# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

from __future__ import annotations

import json
from typing import Any

import frappe
from frappe.model import child_table_fields, default_fields, no_value_fields
from frappe.utils import slug

RESTRICTED_FIELDNAMES = set(default_fields) | set(child_table_fields)
NO_VALUE_FIELDTYPES = set(no_value_fields) | {"Page Break"}


def get_client_ip() -> str:
	"""Safely extract the requester IP address using Frappe's built-in request context."""
	if hasattr(frappe.local, "request_ip") and frappe.local.request_ip:
		return str(frappe.local.request_ip)
	try:
		return frappe.get_request_header("REMOTE_ADDR", "") or ""
	except Exception:
		return ""


def scrub_fieldname(label: str) -> str:
	"""Convert a user label to a safe DocType fieldname."""
	if not label:
		return "field"
	fieldname = frappe.scrub(label.strip())
	if not fieldname:
		fieldname = "field"
	if fieldname in RESTRICTED_FIELDNAMES:
		fieldname = f"{fieldname}_response"
	return fieldname


def make_response_doctype_name(form_title: str) -> str:
	"""
	Generate a human-readable DocType name for a form: 'RF {form_title}'.
	Handles collisions by appending numeric suffix 'RF {form_title} 2'.
	"""
	clean_title = (form_title or "Form").strip()
	base = f"RF {clean_title}"
	if not frappe.db.exists("DocType", base):
		return base

	i = 2
	while frappe.db.exists("DocType", f"{base} {i}"):
		i += 1
	return f"{base} {i}"


def create_response_doctype(form_title: str, form_key: str, fields: list[dict[str, Any]]) -> str:
	"""
	Dynamically create a flat DocType for a Mode 1 (Scratch) form.
	Name is human-readable: 'RF {form_title}'.
	Layout markers (Page Break, Section Break) are stored in fields metadata without SQL columns.
	"""
	doctype_name = make_response_doctype_name(form_title)

	scrubbed_slug = slug(form_title or form_key or "form")
	autoname_format = f"format:RF-{scrubbed_slug}-{{####}}"

	doc = frappe.get_doc(
		{
			"doctype": "DocType",
			"name": doctype_name,
			"module": "Reciprocl",
			"custom": 1,
			"istable": 0,
			"is_submittable": 0,
			"autoname": autoname_format,
			"permissions": [
				{
					"role": "System Manager",
					"read": 1,
					"write": 1,
					"create": 1,
					"delete": 1,
					"export": 1,
					"report": 1,
				},
				{
					"role": "All",
					"read": 1,
					"write": 1,
					"create": 1,
					"delete": 1,
				},
			],
			"fields": [],
		}
	)

	used_fieldnames: set[str] = set()

	for idx, f in enumerate(fields or []):
		fieldtype = f.get("fieldtype") or f.get("type") or "Data"
		raw_label = f.get("label") or f.get("fieldname") or f"Field {idx + 1}"

		# DocField does not have 'Page Break' - map it to 'Section Break' in DB metadata
		if fieldtype == "Page Break":
			fieldtype = "Section Break"

		if fieldtype in NO_VALUE_FIELDTYPES:
			fieldname = f.get("fieldname") or frappe.scrub(raw_label)
			if not fieldname or fieldname in used_fieldnames:
				fieldname = f"{frappe.scrub(fieldtype)}_{idx + 1}"
			used_fieldnames.add(fieldname)

			doc.append(
				"fields",
				{
					"fieldname": fieldname,
					"label": raw_label,
					"fieldtype": fieldtype,
					"reqd": 0,
					"depends_on": f.get("depends_on") or "",
				},
			)
			continue

		fieldname = f.get("fieldname")
		if not fieldname:
			fieldname = scrub_fieldname(raw_label)

		# Ensure uniqueness within the DocType
		base_fieldname = fieldname
		counter = 2
		while fieldname in used_fieldnames:
			fieldname = f"{base_fieldname}_{counter}"
			counter += 1
		used_fieldnames.add(fieldname)

		doc.append(
			"fields",
			{
				"fieldname": fieldname,
				"label": raw_label,
				"fieldtype": fieldtype,
				"reqd": 1 if f.get("reqd") or f.get("required") else 0,
				"options": f.get("options") or "",
				"default": f.get("default") or "",
				"description": f.get("description") or "",
				"depends_on": f.get("depends_on") or "",
			},
		)

	doc.insert(ignore_permissions=True)
	frappe.clear_cache(doctype=doctype_name)
	frappe.clear_cache()
	return doctype_name


def trigger_integrations(form_id: str, data: dict[str, Any]) -> list[str]:
	"""
	Trigger any enabled Reciprocl Form Integrations for this form.
	Creates new documents in mapped target DocTypes (e.g. CRM Lead, Customer, etc.)
	Returns list of created document IDs.
	"""
	created_docs: list[str] = []
	integrations = frappe.get_all(
		"Reciprocl Form Integration",
		filters={"form": form_id, "enabled": 1},
		fields=["name", "target_doctype"],
	)

	for integ in integrations:
		target_doctype = integ.get("target_doctype")
		if not target_doctype or not frappe.db.exists("DocType", target_doctype):
			continue

		mappings = frappe.get_all(
			"Reciprocl Integration Field Map",
			filters={"parent": integ.name, "parenttype": "Reciprocl Form Integration"},
			fields=["form_fieldname", "doctype_fieldname"],
		)

		payload: dict[str, Any] = {"doctype": target_doctype}
		for m in mappings:
			f_name = m.get("form_fieldname")
			t_name = m.get("doctype_fieldname")
			if f_name in data:
				payload[t_name] = data[f_name]

		try:
			target_doc = frappe.get_doc(payload)
			target_doc.insert(ignore_permissions=True)
			created_docs.append(f"{target_doctype}:{target_doc.name}")
		except Exception as e:
			frappe.log_error(
				title=f"Reciprocl Integration Failed ({integ.name})",
				message=f"Failed to create doc in {target_doctype}: {e!s}",
			)

	return created_docs
