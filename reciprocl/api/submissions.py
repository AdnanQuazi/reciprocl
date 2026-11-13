# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

from __future__ import annotations

import json
from typing import Any

import frappe
from frappe import _
from frappe.utils import cint, now_datetime

from reciprocl.api.utils import (
	RESTRICTED_FIELDNAMES,
	get_client_ip,
	trigger_integrations,
)


@frappe.whitelist(allow_guest=True)
def submit_form(form_key: str, data: str | dict[str, Any]) -> dict[str, Any]:
	"""
	Handle a public form submission.
	Writes:
	  1. A row in the response DocType (RF {form_title} or existing DocType).
	  2. A Reciprocl Submission metadata record (linking form, IP, timestamp, status).
	  3. Triggers any enabled Reciprocl Form Integrations.
	Returns: { message, submission_id, response_doc }
	"""
	if isinstance(data, str):
		try:
			data = json.loads(data)
		except Exception:
			frappe.throw(_("Invalid form submission payload: expected JSON."))

	if not isinstance(data, dict):
		frappe.throw(_("Form submission payload must be a JSON object."))

	results = frappe.get_all(
		"Reciprocl Form",
		filters={"form_key": form_key, "status": "Published"},
		fields=["name", "form_title", "creation_mode", "response_doctype", "target_doctype"],
		limit=1,
		ignore_permissions=True,
	)

	if not results:
		frappe.throw(_("Form not found or no longer accepting responses."), frappe.DoesNotExistError)

	form = results[0]
	response_doctype = form.get("response_doctype") or form.get("target_doctype")

	if not response_doctype or not frappe.db.exists("DocType", response_doctype):
		frappe.throw(_("The response storage for this form is not configured or DocType does not exist."))

	meta = frappe.get_meta(response_doctype)
	valid_fieldnames = {df.fieldname for df in meta.fields}

	# Build intelligent field lookup map: fieldname, label, and scrubbed variants
	field_map: dict[str, str] = {}
	for df in meta.fields:
		fn = df.fieldname
		field_map[fn] = fn
		field_map[fn.lower()] = fn
		if df.label:
			field_map[df.label] = fn
			field_map[frappe.scrub(df.label)] = fn
			field_map[df.label.lower()] = fn

	clean_data: dict[str, Any] = {}
	creation_mode = form.get("creation_mode") or "Scratch"

	for raw_key, value in data.items():
		target_fn = (
			field_map.get(raw_key)
			or field_map.get(frappe.scrub(raw_key))
			or field_map.get(str(raw_key).lower())
		)

		if not target_fn and creation_mode == "Scratch":
			scrubbed = frappe.scrub(raw_key)
			if scrubbed in RESTRICTED_FIELDNAMES:
				scrubbed = f"{scrubbed}_response"
			if scrubbed in valid_fieldnames:
				target_fn = scrubbed

		if target_fn and target_fn in valid_fieldnames:
			clean_data[target_fn] = value

	# Step 1: Insert into the response DocType
	response_doc = frappe.new_doc(response_doctype)
	response_doc.update(clean_data)
	response_doc.insert(ignore_permissions=True)

	# Step 2: Determine submitter email from common keys or values
	submitter_email = ""
	all_submitted = {**data, **clean_data}
	for k, v in all_submitted.items():
		if isinstance(v, str) and "@" in v:
			lower_k = str(k).lower()
			if "email" in lower_k or "mail" in lower_k:
				submitter_email = v
				break

	if not submitter_email:
		for v in clean_data.values():
			if isinstance(v, str) and "@" in v and "." in v and " " not in v:
				submitter_email = v
				break

	# Step 3: Insert Reciprocl Submission metadata record
	submission = frappe.get_doc(
		{
			"doctype": "Reciprocl Submission",
			"form": form["name"],
			"response_doctype": response_doctype,
			"response_doc": response_doc.name,
			"submitted_at": now_datetime(),
			"ip_address": get_client_ip(),
			"submitter_email": str(submitter_email),
			"status": "Pending",
		}
	)
	submission.insert(ignore_permissions=True)

	# Step 4: Fire integrations
	trigger_integrations(form["name"], {**data, **clean_data})

	return {
		"message": "success",
		"submission_id": submission.name,
		"response_doc": response_doc.name,
	}


@frappe.whitelist()
def get_submissions(form_id: str, page: int | str = 1, page_size: int | str = 20) -> dict[str, Any]:
	"""
	Return paginated submissions for a given form with response data joined in.
	Requires login.
	Returns: { total, page, page_size, submissions: [...] }
	"""
	form = frappe.get_doc("Reciprocl Form", form_id)

	page = max(1, cint(page))
	page_size = max(1, min(100, cint(page_size)))
	offset = (page - 1) * page_size

	total = frappe.db.count("Reciprocl Submission", filters={"form": form_id})

	submissions = frappe.get_all(
		"Reciprocl Submission",
		filters={"form": form_id},
		fields=[
			"name",
			"submitted_at",
			"status",
			"response_doctype",
			"response_doc",
			"submitter_email",
			"ip_address",
		],
		order_by="submitted_at desc",
		limit_start=offset,
		limit=page_size,
	)

	default_target = form.response_doctype or form.target_doctype

	for sub in submissions:
		target = sub.get("response_doctype") or default_target
		sub["data"] = {}
		if target and sub.get("response_doc") and frappe.db.exists("DocType", target):
			try:
				resp = frappe.get_doc(target, sub["response_doc"])
				meta = frappe.get_meta(target)
				sub["data"] = {df.fieldname: resp.get(df.fieldname) for df in meta.fields}
			except frappe.DoesNotExistError:
				sub["data"] = {}

	return {
		"total": total,
		"page": page,
		"page_size": page_size,
		"submissions": submissions,
	}


@frappe.whitelist()
def get_submission_detail(submission_id: str) -> dict[str, Any]:
	"""Fetch details of a single submission with response payload."""
	sub = frappe.get_doc("Reciprocl Submission", submission_id)
	target = sub.response_doctype
	if not target:
		target = frappe.db.get_value("Reciprocl Form", sub.form, "response_doctype")

	data: dict[str, Any] = {}
	if target and sub.response_doc and frappe.db.exists("DocType", target):
		try:
			resp = frappe.get_doc(target, sub.response_doc)
			meta = frappe.get_meta(target)
			data = {df.fieldname: resp.get(df.fieldname) for df in meta.fields}
		except frappe.DoesNotExistError:
			pass

	return {
		"submission": sub.as_dict(),
		"data": data,
	}


@frappe.whitelist()
def update_submission_status(submission_id: str, status: str) -> dict[str, Any]:
	"""Update the status of a submission (e.g. Pending, Reviewed, Spam)."""
	allowed_statuses = {"Pending", "Reviewed", "Spam"}
	if status not in allowed_statuses:
		frappe.throw(_(f"Invalid status '{status}'. Must be one of: {', '.join(allowed_statuses)}"))

	sub = frappe.get_doc("Reciprocl Submission", submission_id)
	sub.status = status
	sub.save()
	return {"message": "success", "submission_id": sub.name, "status": sub.status}


@frappe.whitelist()
def delete_submission(submission_id: str) -> dict[str, Any]:
	"""Delete a submission and its associated response document."""
	sub = frappe.get_doc("Reciprocl Submission", submission_id)
	target = sub.response_doctype
	docname = sub.response_doc

	if target and docname and frappe.db.exists(target, docname):
		try:
			frappe.delete_doc(target, docname, ignore_permissions=True)
		except Exception:
			pass

	sub.delete()
	return {"message": "success", "deleted_id": submission_id}
