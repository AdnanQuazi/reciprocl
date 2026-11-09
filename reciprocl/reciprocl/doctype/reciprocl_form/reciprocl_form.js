// Copyright (c) 2026, Adnan and contributors
// For license information, please see license.txt

frappe.ui.form.on("Reciprocl Form", {
	refresh(frm) {
		if (!frm.is_new() && frm.doc.status === "Published" && frm.doc.form_key) {
			frm.add_custom_button(__("Open Public Form"), () => {
				window.open(`/${frm.doc.form_key}`, "_blank");
			});
		}
	},
});
