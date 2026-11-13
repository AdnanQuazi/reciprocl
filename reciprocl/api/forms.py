# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

from __future__ import annotations

import json
from typing import Any

import frappe
from frappe import _
from frappe.model import table_fields

from reciprocl.api.utils import (
	RESTRICTED_FIELDNAMES,
	create_response_doctype,
)


@frappe.whitelist(allow_guest=True)
def get_public_form(form_key: str) -> dict[str, Any]:
	"""
	Fetch a published form by its public form_key slug.
	Guest-accessible endpoint for public form rendering.
	"""
	results = frappe.get_all(
		"Reciprocl Form",
		filters={"form_key": form_key, "status": "Published"},
		fields=[
			"name",
			"form_title",
			"form_key",
			"creation_mode",
			"source_doctype",
			"response_doctype",
			"target_doctype",
			"schema_json",
			"settings_json",
		],
		limit=1,
		ignore_permissions=True,
	)

	if not results:
		frappe.throw(_("Form not found or no longer active."), frappe.DoesNotExistError)

	form = results[0]

	schema_raw = form.get("schema_json") or "{}"
	settings_raw = form.get("settings_json") or "{}"

	try:
		schema_data = json.loads(schema_raw) if isinstance(schema_raw, str) else schema_raw
	except Exception:
		schema_data = {}

	try:
		settings_data = json.loads(settings_raw) if isinstance(settings_raw, str) else settings_raw
	except Exception:
		settings_data = {}

	response_dt = form.get("response_doctype") or form.get("target_doctype")

	return {
		"form_id": form["name"],
		"form_title": form["form_title"],
		"form_key": form["form_key"],
		"creation_mode": form.get("creation_mode") or "Scratch",
		"source_doctype": form.get("source_doctype"),
		"response_doctype": response_dt,
		"schema": schema_data,
		"settings": settings_data,
	}


@frappe.whitelist()
def publish_form(form_id: str) -> dict[str, Any]:
	"""
	Publish a Reciprocl Form.
	For Mode 1 (Scratch): Creates the dynamic 'RF {form_title}' DocType if not already created.
	For Mode 2 (From DocType): Verifies the source DocType exists and points response to it.
	Returns: { message, form_id, form_key, response_doctype, share_url }
	"""
	form = frappe.get_doc("Reciprocl Form", form_id)

	creation_mode = form.creation_mode or "Scratch"
	response_dt = form.response_doctype or form.target_doctype

	if creation_mode == "Scratch":
		# Mode 1: Create response DocType if not already created
		if not response_dt or not frappe.db.exists("DocType", response_dt):
			schema_raw = form.schema_json or "{}"
			if isinstance(schema_raw, str):
				try:
					schema_obj = json.loads(schema_raw)
				except Exception:
					schema_obj = {}
			else:
				schema_obj = schema_raw

			# Handle both {"fields": [...]} and flat list [...]
			if isinstance(schema_obj, dict):
				fields = schema_obj.get("fields", [])
			elif isinstance(schema_obj, list):
				fields = schema_obj
			else:
				fields = []

			response_dt = create_response_doctype(form.form_title, form.form_key, fields)
			form.response_doctype = response_dt
			form.target_doctype = response_dt
	else:
		# Mode 2: From DocType
		if not form.source_doctype:
			frappe.throw(_("Source DocType is required for forms created from DocTypes."))
		if not frappe.db.exists("DocType", form.source_doctype):
			frappe.throw(_(f"Source DocType '{form.source_doctype}' does not exist."))
		response_dt = form.source_doctype
		form.response_doctype = response_dt
		form.target_doctype = response_dt

	form.status = "Published"
	form.save()

	return {
		"message": "success",
		"form_id": form.name,
		"form_key": form.form_key,
		"response_doctype": form.response_doctype,
		"share_url": f"/f/{form.form_key}",
	}


@frappe.whitelist()
def unpublish_form(form_id: str) -> dict[str, Any]:
	"""Set a published form back to Draft."""
	form = frappe.get_doc("Reciprocl Form", form_id)
	form.status = "Draft"
	form.save()
	return {"message": "success", "form_id": form.name, "status": "Draft"}


@frappe.whitelist()
def get_available_doctypes() -> list[dict[str, Any]]:
	"""
	Return all DocTypes available for building forms or configuring integrations.
	Excludes child tables, single doctypes, and internal framework doctypes.
	"""
	excluded_doctypes = {
		"DocField",
		"DocPerm",
		"Custom Field",
		"Property Setter",
		"DocType",
		"Module Def",
		"Patch Log",
		"Version",
		"Communication",
		"Activity Log",
		"Prepared Report",
		"Scheduled Job Type",
	}

	all_doctypes = frappe.get_all(
		"DocType",
		filters={"istable": 0, "issingle": 0},
		fields=["name", "module", "custom"],
		order_by="name asc",
	)

	result: list[dict[str, Any]] = []
	for dt in all_doctypes:
		name = dt["name"]
		module = dt.get("module") or ""

		if name in excluded_doctypes:
			continue

		is_rf = name.startswith("RF ")
		result.append(
			{
				"name": name,
				"label": name,
				"module": module,
				"is_rf": is_rf,
			}
		)

	return result


@frappe.whitelist()
def get_doctype_schema(doctype: str) -> dict[str, Any]:
	"""
	Return the fields metadata of an existing DocType to populate the form builder.
	Omits system columns and child table relations.
	"""
	if not frappe.db.exists("DocType", doctype):
		frappe.throw(_(f"DocType '{doctype}' does not exist."), frappe.DoesNotExistError)

	meta = frappe.get_meta(doctype)
	fields: list[dict[str, Any]] = []

	for df in meta.fields:
		if df.fieldname in RESTRICTED_FIELDNAMES:
			continue
		if df.fieldtype in table_fields:
			continue

		fields.append(
			{
				"fieldname": df.fieldname,
				"label": df.label or df.fieldname,
				"fieldtype": df.fieldtype or "Data",
				"reqd": 1 if df.reqd else 0,
				"read_only": 1 if df.read_only else 0,
				"options": df.options or "",
				"default": df.default or "",
				"description": df.description or "",
				"depends_on": df.depends_on or "",
			}
		)

	return {
		"doctype": doctype,
		"title_field": meta.title_field or "name",
		"fields": fields,
	}
