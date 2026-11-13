# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import slug


class ReciproclWorkspace(Document):
	def before_insert(self):
		if not self.owner_user:
			self.owner_user = frappe.session.user or "Administrator"
		if not self.slug:
			self.slug = self._generate_slug()

	def _generate_slug(self) -> str:
		base_slug = slug(self.workspace_name or "workspace")
		candidate = base_slug
		i = 1
		while frappe.db.exists("Reciprocl Workspace", {"slug": candidate}):
			i += 1
			candidate = f"{base_slug}-{i}"
		return candidate
