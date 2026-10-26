import unittest
import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, now_datetime

from reciprocl.api import (
	create_workspace,
	get_workspace,
	get_workspaces,
	get_public_workspaces,
	update_workspace,
	delete_workspace,
	transfer_ownership,
	get_workspace_members,
	update_member_role,
	remove_member,
	leave_workspace,
	invite_user,
	get_workspace_invitations,
	get_invitation_details,
	request_to_join,
	approve_join_request,
	reject_join_request,
	get_my_invitations,
	accept_invitation,
	decline_invitation,
	publish_form,
	update_form,
	delete_form,
	get_form,
	get_workspace_forms,
	submit_form,
	get_submissions,
)
from reciprocl.permissions import get_user_workspace_role


class TestWorkspacePermissions(FrappeTestCase):
	def setUp(self):
		self.users = {
			"owner": "t_owner@example.com",
			"admin": "t_admin@example.com",
			"editor": "t_editor@example.com",
			"viewer": "t_viewer@example.com",
			"stranger": "t_stranger@example.com",
		}
		for role_key, email in self.users.items():
			if not frappe.db.exists("User", email):
				u = frappe.get_doc({
					"doctype": "User",
					"email": email,
					"first_name": role_key.title(),
					"user_type": "Website User",
					"send_welcome_email": 0,
				})
				u.insert(ignore_permissions=True)
		frappe.db.commit()

	def test_workspace_rbac_flow(self):
		# 1. Create Private and Public Workspaces
		frappe.set_user(self.users["owner"])
		res = create_workspace(workspace_name="Test Priv WS", visibility="Private")
		priv_ws = res["workspace"]["name"]
		self.assertEqual(get_user_workspace_role(priv_ws, self.users["owner"]), "Owner")

		pub_res = create_workspace(workspace_name="Test Pub WS", visibility="Public")
		pub_ws = pub_res["workspace"]["name"]

		# 2. Add members with roles
		ws_doc = frappe.get_doc("Reciprocl Workspace", priv_ws)
		ws_doc.append("members", {"user": self.users["admin"], "role": "Admin", "joined_at": now_datetime()})
		ws_doc.append("members", {"user": self.users["editor"], "role": "Editor", "joined_at": now_datetime()})
		ws_doc.append("members", {"user": self.users["viewer"], "role": "Viewer", "joined_at": now_datetime()})
		ws_doc.save(ignore_permissions=True)
		frappe.db.commit()

		# Verify get_workspace details
		ws_details = get_workspace(priv_ws)
		self.assertEqual(ws_details["name"], priv_ws)
		self.assertEqual(ws_details["role"], "Owner")
		self.assertEqual(ws_details["member_count"], 4)

		# 3. Form creation permissions
		frappe.set_user(self.users["viewer"])
		with self.assertRaises(frappe.PermissionError):
			publish_form(form_title="Blocked", fields=[{"label": "Q", "type": "Data"}], workspace=priv_ws)

		frappe.set_user(self.users["editor"])
		form_res = publish_form(form_title="Editor Form", fields=[{"label": "Q", "type": "Data"}], workspace=priv_ws)
		form_id = form_res["form_id"]

		# 4. Form reading permissions
		frappe.set_user(self.users["viewer"])
		forms = get_workspace_forms(priv_ws)
		self.assertTrue(any(f["name"] == form_id for f in forms))

		frappe.set_user(self.users["stranger"])
		with self.assertRaises(frappe.PermissionError):
			get_workspace_forms(priv_ws)

		# 5. Member management hierarchy
		frappe.set_user(self.users["admin"])
		with self.assertRaises(frappe.PermissionError):
			delete_workspace(priv_ws)

		with self.assertRaises(frappe.PermissionError):
			update_member_role(priv_ws, self.users["owner"], "Viewer")

		# 6. Invitation & acceptance
		frappe.set_user(self.users["owner"])
		inv_res = invite_user(priv_ws, "invitee_t@example.com", "Editor")
		key = inv_res["invite_link"].split("key=")[1]

		# Verify get_invitation_details as Guest
		frappe.set_user("Guest")
		inv_info = get_invitation_details(key=key)
		self.assertEqual(inv_info["workspace"], priv_ws)
		self.assertEqual(inv_info["role"], "Editor")
		self.assertFalse(inv_info["expired"])

		accept_res = accept_invitation(key=key)
		self.assertEqual(get_user_workspace_role(priv_ws, "invitee_t@example.com"), "Editor")

		# 7. Public workspace join request & approval
		frappe.set_user(self.users["stranger"])
		request_to_join(pub_ws)

		frappe.set_user(self.users["owner"])
		invs = get_workspace_invitations(pub_ws)
		req_id = [i["name"] for i in invs if i["email"] == self.users["stranger"]][0]
		approve_join_request(req_id, role="Viewer")
		self.assertEqual(get_user_workspace_role(pub_ws, self.users["stranger"]), "Viewer")

		# Clean up
		delete_workspace(priv_ws)
		delete_workspace(pub_ws)
		frappe.db.commit()

	def test_workspace_ownership_and_transfer(self):
		frappe.set_user(self.users["owner"])
		res = create_workspace(workspace_name="Transfer WS", visibility="Private")
		ws_name = res["workspace"]["name"]

		# Admin tries to transfer ownership -> fails
		frappe.set_user(self.users["admin"])
		with self.assertRaises(frappe.PermissionError):
			transfer_ownership(ws_name, self.users["admin"])

		# Owner transfers ownership to admin
		frappe.set_user(self.users["owner"])
		transfer_ownership(ws_name, self.users["admin"])

		# Admin is now Owner
		self.assertEqual(get_user_workspace_role(ws_name, self.users["admin"]), "Owner")
		# Old owner is now Admin
		self.assertEqual(get_user_workspace_role(ws_name, self.users["owner"]), "Admin")

		# New owner deletes workspace
		frappe.set_user(self.users["admin"])
		delete_workspace(ws_name)
		frappe.db.commit()

	def test_invitation_decline_and_expiry(self):
		frappe.set_user(self.users["owner"])
		res = create_workspace(workspace_name="Inv Test WS", visibility="Private")
		ws_name = res["workspace"]["name"]

		# Invite stranger
		inv_res = invite_user(ws_name, self.users["stranger"], "Viewer")
		key = inv_res["invite_link"].split("key=")[1]

		# Stranger declines
		frappe.set_user(self.users["stranger"])
		decline_invitation(key=key)
		inv_doc = frappe.get_doc("Reciprocl Workspace Invitation", inv_res["invitation_id"])
		self.assertEqual(inv_doc.status, "Rejected")

		# Invite again and test simulated expiry
		frappe.set_user(self.users["owner"])
		inv_res2 = invite_user(ws_name, self.users["stranger"], "Editor")
		key2 = inv_res2["invite_link"].split("key=")[1]

		# Simulate 10 days ago creation
		frappe.db.set_value("Reciprocl Workspace Invitation", inv_res2["invitation_id"], "creation", add_days(now_datetime(), -10))
		frappe.db.commit()

		frappe.set_user("Guest")
		with self.assertRaises(frappe.ValidationError):
			accept_invitation(key=key2)

		frappe.set_user(self.users["owner"])
		delete_workspace(ws_name)
		frappe.db.commit()

	def test_form_rbac_and_query_conditions(self):
		# Create workspace
		frappe.set_user(self.users["owner"])
		res = create_workspace(workspace_name="QueryCond WS", visibility="Private")
		ws_name = res["workspace"]["name"]

		# Add editor and viewer
		ws_doc = frappe.get_doc("Reciprocl Workspace", ws_name)
		ws_doc.append("members", {"user": self.users["editor"], "role": "Editor", "joined_at": now_datetime()})
		ws_doc.append("members", {"user": self.users["viewer"], "role": "Viewer", "joined_at": now_datetime()})
		ws_doc.save(ignore_permissions=True)
		frappe.db.commit()

		# Editor publishes form
		frappe.set_user(self.users["editor"])
		form_res = publish_form(form_title="Secret Form", fields=[{"label": "Name", "type": "Data"}], workspace=ws_name)
		form_id = form_res["form_id"]

		# Viewer cannot edit or delete form
		frappe.set_user(self.users["viewer"])
		with self.assertRaises(frappe.PermissionError):
			update_form(form_id, form_title="Hacked Title")
		with self.assertRaises(frappe.PermissionError):
			delete_form(form_id)

		# Editor can update form
		frappe.set_user(self.users["editor"])
		update_form(form_id, form_title="Updated Title")
		f_doc = frappe.get_doc("Reciprocl Form", form_id)
		self.assertEqual(f_doc.form_title, "Updated Title")

		# Stranger cannot see workspace via get_list (query conditions filter it out)
		frappe.set_user(self.users["stranger"])
		stranger_workspaces = frappe.get_list("Reciprocl Workspace", pluck="name")
		self.assertNotIn(ws_name, stranger_workspaces)

		# Stranger cannot get workspace forms via API
		with self.assertRaises(frappe.PermissionError):
			get_workspace_forms(ws_name)

		# Editor can get workspace forms via API
		frappe.set_user(self.users["editor"])
		editor_forms = get_workspace_forms(ws_name)
		self.assertTrue(any(f["name"] == form_id for f in editor_forms))

		# Clean up
		frappe.set_user(self.users["owner"])
		delete_form(form_id)
		delete_workspace(ws_name)
		frappe.db.commit()
