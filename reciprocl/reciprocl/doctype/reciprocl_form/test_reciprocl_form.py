# Copyright (c) 2026, Adnan and Contributors
# See license.txt

from __future__ import annotations

import json
from typing import Any

import frappe
from frappe.tests import IntegrationTestCase

from reciprocl.api.analytics import (
	get_form_trend,
	get_workspace_summary,
	record_daily_stats,
)
from reciprocl.api.forms import (
	get_available_doctypes,
	get_doctype_schema,
	get_public_form,
	publish_form,
	unpublish_form,
)
from reciprocl.api.integrations import (
	create_integration,
	get_doctype_fields,
	get_integrations,
)
from reciprocl.api.submissions import (
	get_submission_detail,
	get_submissions,
	submit_form,
	update_submission_status,
)


class TestReciproclForm(IntegrationTestCase):
	@classmethod
	def setUpClass(cls):
		# Avoid ERPNext fiscal year fixture dependency generation
		cls._newly_created_test_records = []

	def setUp(self):
		frappe.set_user("Administrator")

	def tearDown(self):
		frappe.set_user("Administrator")

	def test_workspace_creation_and_membership(self):
		"""Test workspace creation, auto-slug generation, and member adding."""
		ws = frappe.get_doc(
			{
				"doctype": "Reciprocl Workspace",
				"workspace_name": "Product Design",
				"visibility": "Private",
			}
		)
		ws.insert()
		self.assertTrue(ws.slug.startswith("product-design"))
		self.assertEqual(ws.owner_user, "Administrator")

		# Add member
		member = frappe.get_doc(
			{
				"doctype": "Reciprocl Workspace Member",
				"workspace": ws.name,
				"user": "Administrator",
				"role": "Admin",
			}
		)
		member.insert()
		self.assertEqual(member.role, "Admin")

	def test_mode_1_scratch_publish_and_submit(self):
		"""
		Mode 1 (Scratch):
		1. Create draft form with fields (including Page Break and depends_on).
		2. Publish form -> creates readable 'RF {form_title}' DocType.
		3. Fetch via get_public_form.
		4. Submit via submit_form (guest) -> writes to RF-* and Reciprocl Submission.
		5. Get submissions and verify joined data.
		"""
		schema = {
			"fields": [
				{
					"fieldname": "full_name",
					"fieldtype": "Data",
					"label": "Full Name",
					"reqd": 1,
				},
				{
					"fieldname": "email_address",
					"fieldtype": "Data",
					"label": "Email Address",
					"reqd": 1,
				},
				{
					"fieldname": "page_break_experience",
					"fieldtype": "Page Break",
					"label": "Experience Page",
				},
				{
					"fieldname": "years_exp",
					"fieldtype": "Int",
					"label": "Years of Experience",
				},
				{
					"fieldname": "cover_letter",
					"fieldtype": "Long Text",
					"label": "Cover Letter",
					"depends_on": "eval:doc.years_exp > 0",
				},
			],
			"routing": [
				{
					"from_page": 1,
					"condition": "doc.years_exp > 2",
					"to_page": 2,
				}
			],
			"settings": {
				"success_message": "Thanks for applying!",
			},
		}

		form = frappe.get_doc(
			{
				"doctype": "Reciprocl Form",
				"form_title": "Senior Engineer Application",
				"creation_mode": "Scratch",
				"status": "Draft",
				"schema_json": json.dumps(schema),
			}
		)
		form.insert()
		self.assertIsNotNone(form.form_key)

		# Publish
		pub_res = publish_form(form.name)
		self.assertEqual(pub_res["message"], "success")
		self.assertTrue(pub_res["response_doctype"].startswith("RF Senior Engineer Application"))

		response_dt = pub_res["response_doctype"]
		self.assertTrue(frappe.db.exists("DocType", response_dt))

		# Check that Page Break is present in metadata but is not a physical SQL column
		meta = frappe.get_meta(response_dt)
		field_names = [df.fieldname for df in meta.fields]
		self.assertIn("full_name", field_names)
		self.assertIn("email_address", field_names)
		self.assertIn("years_exp", field_names)

		# Public fetch
		pub_form = get_public_form(form.form_key)
		self.assertEqual(pub_form["form_title"], "Senior Engineer Application")
		self.assertEqual(pub_form["creation_mode"], "Scratch")
		self.assertEqual(pub_form["response_doctype"], response_dt)

		# Public Submit
		sub_payload = {
			"Full Name": "Ada Lovelace",
			"Email Address": "ada@analytical.engine",
			"Years of Experience": 10,
			"Cover Letter": "First programmer in history.",
		}
		sub_res = submit_form(form.form_key, sub_payload)
		self.assertEqual(sub_res["message"], "success")
		self.assertTrue(sub_res["submission_id"])

		# Verify response doc row
		response_row = frappe.get_doc(response_dt, sub_res["response_doc"])
		self.assertEqual(response_row.get("full_name"), "Ada Lovelace")
		self.assertEqual(response_row.get("years_exp"), 10)

		# Verify Reciprocl Submission
		submission_doc = frappe.get_doc("Reciprocl Submission", sub_res["submission_id"])
		self.assertEqual(submission_doc.submitter_email, "ada@analytical.engine")
		self.assertEqual(submission_doc.response_doctype, response_dt)

		# Verify get_submissions
		submissions_list = get_submissions(form.name)
		self.assertGreaterEqual(submissions_list["total"], 1)
		first_sub = submissions_list["submissions"][0]
		self.assertEqual(first_sub["data"].get("full_name"), "Ada Lovelace")

	def test_mode_2_from_doctype(self):
		"""
		Mode 2 (From DocType):
		1. User picks an existing DocType (e.g. Note).
		2. Publish form -> skips creating a new DocType.
		3. Submissions land directly in the source DocType.
		"""
		# We use standard 'Note' DocType which has 'title', 'content', 'public'
		form = frappe.get_doc(
			{
				"doctype": "Reciprocl Form",
				"form_title": "Feedback Note Form",
				"creation_mode": "From DocType",
				"source_doctype": "Note",
				"status": "Draft",
				"schema_json": json.dumps(
					{
						"fields": [
							{"fieldname": "title", "label": "Title", "reqd": 1},
							{"fieldname": "content", "label": "Message"},
						]
					}
				),
			}
		)
		form.insert()
		self.assertEqual(form.response_doctype, "Note")

		# Publish
		pub_res = publish_form(form.name)
		self.assertEqual(pub_res["response_doctype"], "Note")

		# Submit
		sub_res = submit_form(
			form.form_key,
			{
				"title": "Great Product",
				"content": "Loving the form builder experience!",
				"email": "reviewer@example.com",
			},
		)
		self.assertEqual(sub_res["message"], "success")

		# Verify row in Note
		note_row = frappe.get_doc("Note", sub_res["response_doc"])
		self.assertEqual(note_row.title, "Great Product")

	def test_integrations_pipeline(self):
		"""Test creating an integration and auto-inserting mapped doc on form submission."""
		# 1. Create a scratch form
		form = frappe.get_doc(
			{
				"doctype": "Reciprocl Form",
				"form_title": "Contact With Integration",
				"creation_mode": "Scratch",
				"status": "Draft",
				"schema_json": json.dumps(
					{
						"fields": [
							{"fieldname": "contact_name", "label": "Name", "reqd": 1},
							{"fieldname": "note_content", "label": "Note Content"},
						]
					}
				),
			}
		)
		form.insert()
		publish_form(form.name)

		# 2. Add integration to 'Note' DocType: maps contact_name -> title, note_content -> content
		integ_res = create_integration(
			form_id=form.name,
			integration_name="Create Note on Submit",
			target_doctype="Note",
			field_mappings=[
				{"form_fieldname": "contact_name", "doctype_fieldname": "title"},
				{"form_fieldname": "note_content", "doctype_fieldname": "content"},
			],
			enabled=1,
		)
		self.assertEqual(integ_res["message"], "success")

		# 3. Submit form
		submit_form(
			form.form_key,
			{
				"contact_name": "Integration User",
				"note_content": "This note was generated from form integration pipeline.",
			},
		)

		# 4. Verify Note doc was automatically created
		notes = frappe.get_all(
			"Note",
			filters={"title": "Integration User"},
			fields=["name", "title", "content"],
		)
		self.assertGreaterEqual(len(notes), 1)
		self.assertIn("Integration User", notes[0]["title"])

	def test_workspace_summary_and_trend_analytics(self):
		"""Test workspace summary calculations and daily trend aggregation."""
		# Create workspace
		ws = frappe.get_doc(
			{
				"doctype": "Reciprocl Workspace",
				"workspace_name": "Analytics Workspace",
			}
		)
		ws.insert()

		# Create form in this workspace
		form = frappe.get_doc(
			{
				"doctype": "Reciprocl Form",
				"form_title": "Survey Form",
				"workspace": ws.name,
				"status": "Draft",
				"creation_mode": "Scratch",
				"schema_json": json.dumps(
					{"fields": [{"fieldname": "score", "fieldtype": "Int", "label": "Score"}]}
				),
			}
		)
		form.insert()
		publish_form(form.name)

		# Submit responses
		s1 = submit_form(form.form_key, {"Score": 5})
		submit_form(form.form_key, {"Score": 4})

		# Update one to Reviewed/Completed
		update_submission_status(s1["submission_id"], "Reviewed")

		# Workspace summary
		summary = get_workspace_summary(ws.name)
		self.assertEqual(summary["total_responses"], 2)
		self.assertEqual(summary["avg_completion_pct"], 50.0)
		self.assertEqual(summary["live_forms_count"], 1)

		# Trend
		trend = get_form_trend(form.name, days=7)
		self.assertIsInstance(trend, list)
		self.assertGreater(len(trend), 0)

		# Daily stats recorder
		rec_res = record_daily_stats()
		self.assertEqual(rec_res["message"], "success")

	def test_helper_apis(self):
		"""Test get_available_doctypes and get_doctype_schema."""
		available = get_available_doctypes()
		self.assertIsInstance(available, list)
		names = [d["name"] for d in available]
		self.assertIn("User", names)

		schema = get_doctype_schema("User")
		self.assertEqual(schema["doctype"], "User")
		fieldnames = [f["fieldname"] for f in schema["fields"]]
		self.assertIn("email", fieldnames)
		self.assertNotIn("password", fieldnames)  # System password column not regular field or restricted

		integ_fields = get_doctype_fields("Note")
		f_names = [f["fieldname"] for f in integ_fields]
		self.assertIn("title", f_names)
		self.assertIn("content", f_names)
