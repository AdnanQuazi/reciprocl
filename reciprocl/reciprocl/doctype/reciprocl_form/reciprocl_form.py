# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

import random
import string

import frappe
from frappe.model.document import Document


class ReciproclForm(Document):
	def before_insert(self):
		if not self.form_key:
			self.form_key = _generate_form_key()
		if self.creation_mode == "From DocType" and self.source_doctype:
			self.response_doctype = self.source_doctype
		if self.response_doctype and not self.target_doctype:
			self.target_doctype = self.response_doctype
		elif self.target_doctype and not self.response_doctype:
			self.response_doctype = self.target_doctype

	def validate(self):
		if self.status == "Published" and not self.form_key:
			frappe.throw("A Public URL Key is required before publishing a form.")

		if self.creation_mode == "From DocType":
			if not self.source_doctype:
				frappe.throw("Source DocType is required when creation_mode is 'From DocType'.")
			if not frappe.db.exists("DocType", self.source_doctype):
				frappe.throw(f"Source DocType '{self.source_doctype}' does not exist.")
			self.response_doctype = self.source_doctype

		if self.response_doctype and not self.target_doctype:
			self.target_doctype = self.response_doctype
		elif self.target_doctype and not self.response_doctype:
			self.response_doctype = self.target_doctype


def _generate_form_key() -> str:
	"""Return a unique 8-char alphanumeric slug used for public URL routing."""
	chars = string.ascii_letters + string.digits
	while True:
		key = "".join(random.choices(chars, k=8))
		if not frappe.db.exists("Reciprocl Form", {"form_key": key}):
			return key
