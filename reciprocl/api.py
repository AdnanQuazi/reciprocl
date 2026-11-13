# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

"""
Reciprocl API Root.
Provides backward-compatible re-exports and redirects to the modular reciprocl.api package.
"""

from __future__ import annotations

import json
from typing import Any

import frappe

from reciprocl.api.analytics import (
	get_form_trend,
	get_workspace_summary,
	record_daily_stats,
)
from reciprocl.api.forms import (
	get_available_doctypes,
	get_doctype_schema,
	get_public_form,
	unpublish_form,
)
from reciprocl.api.forms import (
	publish_form as api_publish_form,
)
from reciprocl.api.integrations import (
	create_integration,
	get_doctype_fields,
	get_integrations,
)
from reciprocl.api.submissions import (
	delete_submission,
	get_submission_detail,
	get_submissions,
	submit_form,
	update_submission_status,
)


@frappe.whitelist(allow_guest=True)
def get_form(form_key: str) -> dict[str, Any]:
	"""Backward-compatible alias for get_public_form."""
	return get_public_form(form_key)


@frappe.whitelist(allow_guest=True)
def publish_form(
	form_title: str | None = None,
	fields: str | list[dict[str, Any]] | None = None,
	form_id: str | None = None,
) -> dict[str, Any]:
	"""
	Publish a form.
	Supports both the new format: publish_form(form_id="...")
	and the legacy one-step publish: publish_form(form_title="...", fields=[...])
	"""
	if form_id:
		return api_publish_form(form_id)

	# Legacy one-step flow: create Draft doc and then publish
	if isinstance(fields, str):
		try:
			fields = json.loads(fields)
		except Exception:
			fields = []

	schema_obj = {"fields": fields or []}
	doc = frappe.get_doc(
		{
			"doctype": "Reciprocl Form",
			"form_title": form_title or "Untitled Form",
			"status": "Draft",
			"creation_mode": "Scratch",
			"schema_json": json.dumps(schema_obj),
		}
	)
	doc.insert(ignore_permissions=True)

	return api_publish_form(doc.name)
