# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ReciproclForm(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		form_title: DF.Data
		form_key: DF.Data | None
		status: DF.Literal["Draft", "Published", "Closed"]
		target_doctype: DF.Data | None
		schema_json: DF.Code | None
		settings_json: DF.Code | None
		integration_json: DF.Code | None
	# end: auto-generated types

	def before_insert(self):
		if not self.form_key:
			self.form_key = _generate_form_key()

	def validate(self):
		if self.status == "Published" and not self.form_key:
			frappe.throw("A Public URL Key is required before publishing a form.")


def _generate_form_key() -> str:
	"""Return a unique 8-char alphanumeric slug used for public URL routing."""
	import random
	import string

	chars = string.ascii_letters + string.digits
	while True:
		key = "".join(random.choices(chars, k=8))
		if not frappe.db.exists("Reciprocl Form", {"form_key": key}):
			return key
