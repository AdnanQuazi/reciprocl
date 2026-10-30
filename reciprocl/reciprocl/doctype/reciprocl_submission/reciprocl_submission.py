# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class ReciproclSubmission(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		form: DF.Link
		ip_address: DF.Data | None
		response_doc: DF.Data | None
		status: DF.Literal["Pending", "Reviewed", "Spam"]
		submitted_at: DF.Datetime | None
		submitter_email: DF.Data | None
	# end: auto-generated types

	pass
