# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ReciproclFormIntegration(Document):
	def validate(self):
		if not frappe.db.exists("DocType", self.target_doctype):
			frappe.throw(f"Target DocType '{self.target_doctype}' does not exist.")
