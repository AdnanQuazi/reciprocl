import json
import random
import string

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


def _generate_form_key() -> str:
	"""Return a unique 8-char alphanumeric slug used for public URL routing."""
	chars = string.ascii_letters + string.digits
	while True:
		key = "".join(random.choices(chars, k=8))
		if not frappe.db.exists("Reciprocl Form", {"form_key": key}):
			return key


def _get_ip() -> str:
	"""Safely extract the requester IP address."""
	try:
		return frappe.local.request.environ.get("REMOTE_ADDR", "")
	except Exception:
		return ""


# ---------------------------------------------------------------------------
# DocType setup — runs once at install, then lazily from publish_form
# ---------------------------------------------------------------------------


def setup_doctypes():
	"""Create the two permanent Reciprocl DocTypes if they don't already exist."""
	_setup_reciprocl_form()
	_setup_reciprocl_submission()


def _setup_reciprocl_form():
	if frappe.db.exists("DocType", "Reciprocl Form"):
		return

	doc = frappe.get_doc(
		{
			"doctype": "DocType",
			"name": "Reciprocl Form",
			"module": "Reciprocl",
			"custom": 1,
			"autoname": "format:REC-{####}",
			"title_field": "form_title",
			"permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}],
			"fields": [
				{
					"fieldname": "form_title",
					"label": "Form Title",
					"fieldtype": "Data",
					"reqd": 1,
					"in_list_view": 1,
				},
				{
					"fieldname": "form_key",
					"label": "Public URL Key",
					"fieldtype": "Data",
					"read_only": 1,
					"in_list_view": 1,
					"description": "Short slug for the public share URL: /{form_key}",
				},
				{
					"fieldname": "status",
					"label": "Status",
					"fieldtype": "Select",
					"options": "Draft\nPublished\nClosed",
					"default": "Draft",
					"in_list_view": 1,
					"in_standard_filter": 1,
				},
				{
					"fieldname": "target_doctype",
					"label": "Target DocType",
					"fieldtype": "Data",
					"read_only": 1,
					"description": "Auto-generated DocType storing this form's responses as real SQL columns.",
				},
				{
					"fieldname": "schema_json",
					"label": "Schema JSON",
					"fieldtype": "Code",
					"options": "JSON",
				},
				{
					"fieldname": "settings_json",
					"label": "Settings JSON",
					"fieldtype": "Code",
					"options": "JSON",
					"description": "Success message, expiry date, etc.",
				},
				{
					"fieldname": "integration_json",
					"label": "Integration JSON",
					"fieldtype": "Code",
					"options": "JSON",
					"description": "Phase 3: field mappings to HR, CRM, ERPNext DocTypes.",
				},
			],
		}
	)
	doc.insert(ignore_permissions=True)


def _setup_reciprocl_submission():
	if frappe.db.exists("DocType", "Reciprocl Submission"):
		return

	doc = frappe.get_doc(
		{
			"doctype": "DocType",
			"name": "Reciprocl Submission",
			"module": "Reciprocl",
			"custom": 1,
			"autoname": "format:RSUB-{#####}",
			"title_field": "form",
			"permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}],
			"fields": [
				{
					"fieldname": "form",
					"label": "Form",
					"fieldtype": "Link",
					"options": "Reciprocl Form",
					"reqd": 1,
					"in_list_view": 1,
					"in_standard_filter": 1,
				},
				{
					"fieldname": "response_doc",
					"label": "Response Doc",
					"fieldtype": "Data",
					"read_only": 1,
					"in_list_view": 1,
					"description": "Name/ID of the row in the target DocType.",
				},
				{
					"fieldname": "submitted_at",
					"label": "Submitted At",
					"fieldtype": "Datetime",
					"in_list_view": 1,
				},
				{
					"fieldname": "submitter_email",
					"label": "Submitter Email",
					"fieldtype": "Data",
					"options": "Email",
				},
				{
					"fieldname": "ip_address",
					"label": "IP Address",
					"fieldtype": "Data",
				},
				{
					"fieldname": "status",
					"label": "Status",
					"fieldtype": "Select",
					"options": "Pending\nReviewed\nSpam",
					"default": "Pending",
					"in_list_view": 1,
					"in_standard_filter": 1,
				},
			],
		}
	)
	doc.insert(ignore_permissions=True)


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
	setup_doctypes()

	if isinstance(fields, str):
		fields = json.loads(fields)

	form_key = _generate_form_key()
	target_doctype = _create_target_doctype(form_key, fields)

	master = frappe.get_doc(
		{
			"doctype": "Reciprocl Form",
			"form_title": form_title,
			"form_key": form_key,
			"status": "Published",
			"target_doctype": target_doctype,
			"schema_json": json.dumps(fields),
		}
	)
	master.insert(ignore_permissions=True)

	return {
		"message": "success",
		"form_id": master.name,
		"form_key": form_key,
		"share_url": f"/{form_key}",
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
