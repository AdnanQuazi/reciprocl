import json

import frappe


def setup_master_doctype():
	if frappe.db.exists("DocType", "Reciprocl Form"):
		return

	doc = frappe.get_doc(
		{
			"doctype": "DocType",
			"name": "Reciprocl Form",
			"module": "Reciprocl",
			"custom": 1,
			"autoname": "format:REC-{####}",
			"permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}],
			"fields": [
				{"fieldname": "form_title", "label": "Form Title", "fieldtype": "Data", "reqd": 1},
				{"fieldname": "target_doctype", "label": "Target DocType", "fieldtype": "Data"},
				{"fieldname": "schema_json", "label": "Schema JSON", "fieldtype": "Code", "options": "JSON"},
			],
		}
	)
	doc.insert(ignore_permissions=True)


@frappe.whitelist(allow_guest=True)
def publish_form(form_title: str, fields: str | list):
	setup_master_doctype()

	if isinstance(fields, str):
		fields = json.loads(fields)

	doctype_name = f"Form {form_title}"
	if not frappe.db.exists("DocType", doctype_name):
		doc = frappe.get_doc(
			{
				"doctype": "DocType",
				"name": doctype_name,
				"module": "Reciprocl",
				"custom": 1,
				"istable": 0,
				"is_submittable": 0,
				"autoname": f"format:{form_title.upper()}-{{####}}",
				"permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}],
				"fields": [],
			}
		)

		restricted_fields = [
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
		]

		for f in fields:
			fieldname = frappe.scrub(f.get("label"))
			if fieldname in restricted_fields:
				fieldname = f"{fieldname}_custom"

			doc.append(
				"fields",
				{
					"fieldname": fieldname,
					"label": f.get("label"),
					"fieldtype": f.get("type"),
					"reqd": f.get("required", 0),
				},
			)

		doc.insert(ignore_permissions=True)
		frappe.clear_cache(doctype=doctype_name)
		frappe.clear_cache()

	# Save the master blueprint
	master = frappe.get_doc(
		{
			"doctype": "Reciprocl Form",
			"form_title": form_title,
			"target_doctype": doctype_name,
			"schema_json": json.dumps(fields),
		}
	)
	master.insert(ignore_permissions=True)

	return {"message": "success", "form_id": master.name}


@frappe.whitelist(allow_guest=True)
def get_form(form_id: str):
	if not frappe.db.exists("Reciprocl Form", form_id):
		frappe.throw("Form not found", frappe.NotFoundError)

	master = frappe.get_doc("Reciprocl Form", form_id)
	return {"form_title": master.form_title, "schema_json": json.loads(master.schema_json)}


@frappe.whitelist(allow_guest=True)
def submit_form(form_id: str, data: str | dict):
	if isinstance(data, str):
		data = json.loads(data)

	master = frappe.get_doc("Reciprocl Form", form_id)
	target = master.target_doctype

	doc = frappe.new_doc(target)

	# Scrub keys in case React sent plain labels instead of frappe scrubbed fieldnames
	clean_data = {}
	for key, value in data.items():
		clean_key = frappe.scrub(key)
		if clean_key in [
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
		]:
			clean_key = f"{clean_key}_custom"
		clean_data[clean_key] = value

	doc.update(clean_data)
	doc.insert(ignore_permissions=True)

	return {"message": "success", "id": doc.name}
