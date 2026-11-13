# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

from __future__ import annotations

import json
from typing import Any

import frappe
from frappe import _
from frappe.model import no_value_fields, table_fields

from reciprocl.api.utils import RESTRICTED_FIELDNAMES

NON_MAPPABLE_FIELDTYPES = set(no_value_fields) | set(table_fields)


@frappe.whitelist()
def get_doctype_fields(doctype: str) -> list[dict[str, Any]]:
	"""
	Return all writable field definitions of a target Frappe DocType.
	Used in the frontend Integration UI for field mapping.
	"""
	if not frappe.db.exists("DocType", doctype):
		frappe.throw(_(f"DocType '{doctype}' does not exist."), frappe.DoesNotExistError)

	meta = frappe.get_meta(doctype)
	fields: list[dict[str, Any]] = []

	for df in meta.fields:
		if df.fieldname in RESTRICTED_FIELDNAMES:
			continue
		if df.fieldtype in NON_MAPPABLE_FIELDTYPES:
			continue

		fields.append(
			{
				"fieldname": df.fieldname,
				"label": df.label or df.fieldname,
				"fieldtype": df.fieldtype or "Data",
				"reqd": 1 if df.reqd else 0,
				"options": df.options or "",
			}
		)

	return fields


@frappe.whitelist()
def get_integrations(form_id: str) -> list[dict[str, Any]]:
	"""Fetch all integrations configured for a form, including their field mappings."""
	integrations = frappe.get_all(
		"Reciprocl Form Integration",
		filters={"form": form_id},
		fields=["name", "form", "integration_name", "target_doctype", "enabled"],
		order_by="creation asc",
	)

	for integ in integrations:
		integ["field_mappings"] = frappe.get_all(
			"Reciprocl Integration Field Map",
			filters={"parent": integ["name"], "parenttype": "Reciprocl Form Integration"},
			fields=["name", "form_fieldname", "doctype_fieldname"],
		)

	return integrations


@frappe.whitelist()
def create_integration(
	form_id: str,
	integration_name: str,
	target_doctype: str,
	field_mappings: str | list[dict[str, Any]],
	enabled: int = 1,
) -> dict[str, Any]:
	"""
	Create a new Reciprocl Form Integration with child field mappings.
	"""
	if not frappe.db.exists("Reciprocl Form", form_id):
		frappe.throw(_("Form not found."), frappe.DoesNotExistError)

	if not frappe.db.exists("DocType", target_doctype):
		frappe.throw(_(f"Target DocType '{target_doctype}' does not exist."))

	if isinstance(field_mappings, str):
		try:
			field_mappings = json.loads(field_mappings)
		except Exception:
			field_mappings = []

	doc = frappe.get_doc(
		{
			"doctype": "Reciprocl Form Integration",
			"form": form_id,
			"integration_name": integration_name,
			"target_doctype": target_doctype,
			"enabled": 1 if enabled else 0,
			"field_mappings": [
				{
					"form_fieldname": m.get("form_fieldname"),
					"doctype_fieldname": m.get("doctype_fieldname"),
				}
				for m in (field_mappings or [])
				if m.get("form_fieldname") and m.get("doctype_fieldname")
			],
		}
	)
	doc.insert()

	return {
		"message": "success",
		"integration_id": doc.name,
		"target_doctype": doc.target_doctype,
	}
