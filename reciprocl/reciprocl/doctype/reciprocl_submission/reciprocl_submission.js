// Copyright (c) 2026, Adnan and contributors
// For license information, please see license.txt

frappe.ui.form.on("Reciprocl Submission", {
	refresh(frm) {
		if (!frm.is_new() && frm.doc.form) {
			frm.add_custom_button(__("View Form"), () => {
				frappe.set_route("Form", "Reciprocl Form", frm.doc.form);
			});
		}
	},
});
