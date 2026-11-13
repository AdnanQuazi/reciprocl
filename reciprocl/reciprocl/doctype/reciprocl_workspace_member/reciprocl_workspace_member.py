# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class ReciproclWorkspaceMember(Document):
	def before_insert(self):
		if not self.invited_at:
			self.invited_at = now_datetime()

	def validate(self):
		existing = frappe.db.get_value(
			"Reciprocl Workspace Member",
			{"workspace": self.workspace, "user": self.user, "name": ["!=", self.name or ""]},
			"name",
		)
		if existing:
			frappe.throw(f"User {self.user} is already a member of workspace {self.workspace}.")
