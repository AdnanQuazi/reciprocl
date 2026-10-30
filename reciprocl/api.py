import json

import frappe
from frappe.utils import now_datetime

RESTRICTED_FIELDNAMES = {
	"name",
	"owner",
	"creation",
	"modified",
	"modified_by",
	"parent",
	"parentfield",
	"parenttype",
	"idx",
	"docstatus",
}


def _get_ip() -> str:
	"""Safely extract the requester IP address."""
	try:
		return frappe.local.request.environ.get("REMOTE_ADDR", "")
	except Exception:
		return ""


def _create_target_doctype(form_key: str, fields: list) -> str:
	"""
	Dynamically create a flat DocType for this specific form.
	Named 'RF {form_key}' to guarantee uniqueness regardless of form title.
	"""
	doctype_name = f"RF {form_key}"

	if frappe.db.exists("DocType", doctype_name):
		return doctype_name

	doc = frappe.get_doc(
		{
			"doctype": "DocType",
			"name": doctype_name,
			"module": "Reciprocl",
			"custom": 1,
			"istable": 0,
			"is_submittable": 0,
			"autoname": f"format:RF-{form_key}-{{####}}",
			"permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}],
			"fields": [],
		}
	)

	for f in fields:
		raw_label = f.get("label", "")
		if not raw_label:
			continue
		fieldname = frappe.scrub(raw_label)
		if fieldname in RESTRICTED_FIELDNAMES:
			fieldname = f"{fieldname}_response"
		doc.append(
			"fields",
			{
				"fieldname": fieldname,
				"label": raw_label,
				"fieldtype": f.get("type", "Data"),
				"reqd": f.get("required", 0),
			},
		)

	doc.insert(ignore_permissions=True)
	frappe.clear_cache(doctype=doctype_name)
	frappe.clear_cache()
	return doctype_name


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


@frappe.whitelist(allow_guest=True)
def publish_form(form_title: str, fields: str | list):
	"""
	Create a new Reciprocl Form and its dedicated response DocType.
	Returns: { message, form_id, form_key, share_url }
	"""
	if isinstance(fields, str):
		fields = json.loads(fields)

	# form_key is generated automatically in ReciproclForm.before_insert
	target_doctype_fields = fields  # resolved after we have the key
	master = frappe.get_doc(
		{
			"doctype": "Reciprocl Form",
			"form_title": form_title,
			"status": "Published",
			"schema_json": json.dumps(fields),
		}
	)
	master.insert(ignore_permissions=True)

	# Now create the target DocType with the auto-generated form_key
	target_doctype = _create_target_doctype(master.form_key, target_doctype_fields)
	master.db_set("target_doctype", target_doctype)

	return {
		"message": "success",
		"form_id": master.name,
		"form_key": master.form_key,
		"share_url": f"/{master.form_key}",
	}


@frappe.whitelist(allow_guest=True)
def get_form(form_key: str):
	"""
	Fetch a published form by its public form_key slug.
	Returns: { form_id, form_title, schema_json, settings_json }
	"""
	results = frappe.get_all(
		"Reciprocl Form",
		filters={"form_key": form_key, "status": "Published"},
		fields=["name", "form_title", "schema_json", "settings_json"],
		limit=1,
		ignore_permissions=True,
	)

	if not results:
		frappe.throw("Form not found or not published", frappe.DoesNotExistError)

	form = results[0]
	return {
		"form_id": form["name"],
		"form_title": form["form_title"],
		"schema_json": json.loads(form["schema_json"] or "[]"),
		"settings_json": json.loads(form["settings_json"] or "{}"),
	}


@frappe.whitelist(allow_guest=True)
def submit_form(form_key: str, data: str | dict):
	"""
	Handle a public form submission.

	Writes:
	  1. A row in the target DocType (real SQL columns — Insights-friendly).
	  2. A Reciprocl Submission metadata row (form link, IP, timestamp, status).

	Returns: { message, submission_id }
	"""
	if isinstance(data, str):
		data = json.loads(data)

	results = frappe.get_all(
		"Reciprocl Form",
		filters={"form_key": form_key, "status": "Published"},
		fields=["name", "target_doctype"],
		limit=1,
		ignore_permissions=True,
	)

	if not results:
		frappe.throw("Form not found or no longer accepting responses", frappe.DoesNotExistError)

	form = results[0]

	# Step 1: Write response into the generated target DocType (real SQL columns)
	response_doc = frappe.new_doc(form["target_doctype"])
	clean_data = {}
	for key, value in data.items():
		clean_key = frappe.scrub(key)
		if clean_key in RESTRICTED_FIELDNAMES:
			clean_key = f"{clean_key}_response"
		clean_data[clean_key] = value

	response_doc.update(clean_data)
	response_doc.insert(ignore_permissions=True)

	# Step 2: Write the Reciprocl Submission metadata row
	submitter_email = data.get("email") or data.get("Email") or data.get("email_id") or ""

	submission = frappe.get_doc(
		{
			"doctype": "Reciprocl Submission",
			"form": form["name"],
			"response_doc": response_doc.name,
			"submitted_at": now_datetime(),
			"ip_address": _get_ip(),
			"submitter_email": submitter_email,
			"status": "Pending",
		}
	)
	submission.insert(ignore_permissions=True)

	return {"message": "success", "submission_id": submission.name}


@frappe.whitelist()
def get_submissions(form_id: str):
	"""
	Return all submissions for a given form with response data joined in.
	Requires login — for the React dashboard.

	Returns: List of { name, submitted_at, status, submitter_email, ip_address, data }
	"""
	form = frappe.get_doc("Reciprocl Form", form_id)

	submissions = frappe.get_all(
		"Reciprocl Submission",
		filters={"form": form_id},
		fields=["name", "submitted_at", "status", "response_doc", "submitter_email", "ip_address"],
		order_by="submitted_at desc",
	)

	target = form.target_doctype
	if not target:
		return submissions

	meta = frappe.get_meta(target)
	field_names = [f.fieldname for f in meta.fields]

	for sub in submissions:
		if sub.get("response_doc"):
			try:
				resp = frappe.get_doc(target, sub["response_doc"])
				sub["data"] = {fn: resp.get(fn) for fn in field_names}
			except frappe.DoesNotExistError:
				sub["data"] = {}
		else:
			sub["data"] = {}

	return submissions
