import json
import random
import string

import frappe
from frappe import _
from frappe.utils import add_days, get_datetime, now_datetime, sha256_hash, validate_email_address
from reciprocl.permissions import (
	check_workspace_permission,
	get_user_workspace_role,
	get_user_workspaces,
	is_system_admin,
)

RESTRICTED_FIELDNAMES = {
	"name",
	"owner",
	"creation",
	"modified",
	"modified_by",
	"parent",
	"parentfield",
	"parenttype",
	"idx",
	"docstatus",
}


def _generate_form_key() -> str:
	"""Return a unique 8-char alphanumeric slug used for public URL routing."""
	chars = string.ascii_letters + string.digits
	while True:
		key = "".join(random.choices(chars, k=8))
		if not frappe.db.exists("Reciprocl Form", {"form_key": key}):
			return key


def _get_ip() -> str:
	"""Safely extract the requester IP address."""
	try:
		return frappe.local.request.environ.get("REMOTE_ADDR", "")
	except Exception:
		return ""


# ---------------------------------------------------------------------------
# DocType setup — runs once at install, then lazily from publish_form
# ---------------------------------------------------------------------------


def setup_doctypes():
	"""Create permanent Reciprocl DocTypes if they don't already exist."""
	_setup_module_def()
	_setup_reciprocl_workspace_member()
	_setup_reciprocl_workspace()
	_setup_reciprocl_workspace_invitation()
	_setup_reciprocl_form()
	_setup_reciprocl_submission()
	_ensure_default_workspace()


def _setup_module_def():
	if not frappe.db.exists("Module Def", "Reciprocl"):
		frappe.get_doc({
			"doctype": "Module Def",
			"module_name": "Reciprocl",
			"app_name": "reciprocl",
			"custom": 0,
		}).insert(ignore_permissions=True)


def _setup_reciprocl_workspace_member():
	if frappe.db.exists("DocType", "Reciprocl Workspace Member"):
		return

	doc = frappe.get_doc({
		"doctype": "DocType",
		"name": "Reciprocl Workspace Member",
		"module": "Reciprocl",
		"custom": 1,
		"istable": 1,
		"editable_grid": 1,
		"fields": [
			{"fieldname": "user", "label": "User", "fieldtype": "Link", "options": "User", "reqd": 1, "in_list_view": 1},
			{"fieldname": "role", "label": "Role", "fieldtype": "Select", "options": "Owner\nAdmin\nEditor\nViewer", "default": "Viewer", "reqd": 1, "in_list_view": 1},
			{"fieldname": "joined_at", "label": "Joined At", "fieldtype": "Datetime", "in_list_view": 1},
		],
	})
	doc.insert(ignore_permissions=True)


def _setup_reciprocl_workspace():
	if frappe.db.exists("DocType", "Reciprocl Workspace"):
		return

	doc = frappe.get_doc({
		"doctype": "DocType",
		"name": "Reciprocl Workspace",
		"module": "Reciprocl",
		"custom": 1,
		"autoname": "format:WS-{#####}",
		"title_field": "workspace_name",
		"show_title_field_in_link": 1,
		"permissions": [
			{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
			{"role": "All", "read": 1, "write": 1, "create": 1, "delete": 1},
		],
		"fields": [
			{"fieldname": "workspace_name", "label": "Workspace Name", "fieldtype": "Data", "reqd": 1, "in_list_view": 1},
			{"fieldname": "visibility", "label": "Visibility", "fieldtype": "Select", "options": "Private\nPublic", "default": "Private", "reqd": 1, "in_list_view": 1, "in_standard_filter": 1},
			{"fieldname": "description", "label": "Description", "fieldtype": "Small Text"},
			{"fieldname": "owner_user", "label": "Owner User", "fieldtype": "Link", "options": "User"},
			{"fieldname": "members", "label": "Members", "fieldtype": "Table", "options": "Reciprocl Workspace Member"},
		],
	})
	doc.insert(ignore_permissions=True)


def _setup_reciprocl_workspace_invitation():
	if frappe.db.exists("DocType", "Reciprocl Workspace Invitation"):
		return

	doc = frappe.get_doc({
		"doctype": "DocType",
		"name": "Reciprocl Workspace Invitation",
		"module": "Reciprocl",
		"custom": 1,
		"autoname": "format:WINV-{#####}",
		"title_field": "email",
		"permissions": [
			{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
			{"role": "All", "read": 1, "write": 1, "create": 1, "delete": 1},
		],
		"fields": [
			{"fieldname": "workspace", "label": "Workspace", "fieldtype": "Link", "options": "Reciprocl Workspace", "reqd": 1, "in_list_view": 1, "in_standard_filter": 1},
			{"fieldname": "email", "label": "Email", "fieldtype": "Data", "options": "Email", "reqd": 1, "in_list_view": 1},
			{"fieldname": "role", "label": "Role", "fieldtype": "Select", "options": "Admin\nEditor\nViewer", "default": "Viewer", "reqd": 1, "in_list_view": 1},
			{"fieldname": "type", "label": "Type", "fieldtype": "Select", "options": "Invitation\nJoin Request", "default": "Invitation", "reqd": 1, "in_list_view": 1, "in_standard_filter": 1},
			{"fieldname": "status", "label": "Status", "fieldtype": "Select", "options": "Pending\nAccepted\nRejected\nExpired\nCancelled", "default": "Pending", "reqd": 1, "in_list_view": 1, "in_standard_filter": 1},
			{"fieldname": "key", "label": "Key Hash", "fieldtype": "Data"},
			{"fieldname": "invited_by", "label": "Invited By", "fieldtype": "Link", "options": "User"},
			{"fieldname": "email_sent_at", "label": "Email Sent At", "fieldtype": "Datetime"},
			{"fieldname": "accepted_at", "label": "Accepted At", "fieldtype": "Datetime"},
		],
	})
	doc.insert(ignore_permissions=True)


def _setup_reciprocl_form():
	if not frappe.db.exists("DocType", "Reciprocl Form"):
		doc = frappe.get_doc({
			"doctype": "DocType",
			"name": "Reciprocl Form",
			"module": "Reciprocl",
			"custom": 1,
			"autoname": "format:REC-{####}",
			"title_field": "form_title",
			"permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}],
			"fields": [
				{"fieldname": "form_title", "label": "Form Title", "fieldtype": "Data", "reqd": 1, "in_list_view": 1},
				{"fieldname": "workspace", "label": "Workspace", "fieldtype": "Link", "options": "Reciprocl Workspace", "in_list_view": 1, "in_standard_filter": 1},
				{"fieldname": "form_key", "label": "Public URL Key", "fieldtype": "Data", "read_only": 1, "in_list_view": 1, "description": "Short slug for public share URL: /{form_key}"},
				{"fieldname": "status", "label": "Status", "fieldtype": "Select", "options": "Draft\nPublished\nClosed", "default": "Draft", "in_list_view": 1, "in_standard_filter": 1},
				{"fieldname": "target_doctype", "label": "Target DocType", "fieldtype": "Data", "read_only": 1, "description": "Auto-generated DocType storing responses."},
				{"fieldname": "schema_json", "label": "Schema JSON", "fieldtype": "Code", "options": "JSON"},
				{"fieldname": "settings_json", "label": "Settings JSON", "fieldtype": "Code", "options": "JSON"},
				{"fieldname": "integration_json", "label": "Integration JSON", "fieldtype": "Code", "options": "JSON"},
			],
		})
		doc.insert(ignore_permissions=True)
	else:
		form_meta = frappe.get_doc("DocType", "Reciprocl Form")
		fieldnames = [f.fieldname for f in form_meta.fields]
		if "workspace" not in fieldnames:
			form_meta.append("fields", {
				"fieldname": "workspace",
				"label": "Workspace",
				"fieldtype": "Link",
				"options": "Reciprocl Workspace",
				"in_list_view": 1,
				"in_standard_filter": 1,
			})
			form_meta.save(ignore_permissions=True)


def _setup_reciprocl_submission():
	if frappe.db.exists("DocType", "Reciprocl Submission"):
		return

	doc = frappe.get_doc({
		"doctype": "DocType",
		"name": "Reciprocl Submission",
		"module": "Reciprocl",
		"custom": 1,
		"autoname": "format:RSUB-{#####}",
		"title_field": "form",
		"permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}],
		"fields": [
			{"fieldname": "form", "label": "Form", "fieldtype": "Link", "options": "Reciprocl Form", "reqd": 1, "in_list_view": 1, "in_standard_filter": 1},
			{"fieldname": "response_doc", "label": "Response Doc", "fieldtype": "Data", "read_only": 1, "in_list_view": 1},
			{"fieldname": "submitted_at", "label": "Submitted At", "fieldtype": "Datetime", "in_list_view": 1},
			{"fieldname": "submitter_email", "label": "Submitter Email", "fieldtype": "Data", "options": "Email"},
			{"fieldname": "ip_address", "label": "IP Address", "fieldtype": "Data"},
			{"fieldname": "status", "label": "Status", "fieldtype": "Select", "options": "Pending\nReviewed\nSpam", "default": "Pending", "in_list_view": 1, "in_standard_filter": 1},
		],
	})
	doc.insert(ignore_permissions=True)


def _ensure_default_workspace():
	ws = frappe.db.get_value("Reciprocl Workspace", {"workspace_name": "General"}, "name")
	if not ws:
		doc = frappe.get_doc({
			"doctype": "Reciprocl Workspace",
			"workspace_name": "General",
			"visibility": "Public",
			"description": "Default public workspace for general forms",
			"owner_user": "Administrator",
			"members": [
				{"user": "Administrator", "role": "Owner", "joined_at": now_datetime()}
			],
		})
		doc.insert(ignore_permissions=True)
		ws = doc.name

	unassigned_forms = frappe.get_all("Reciprocl Form", filters={"workspace": ["is", "not set"]}, pluck="name")
	for f in unassigned_forms:
		frappe.db.set_value("Reciprocl Form", f, "workspace", ws)
	if unassigned_forms:
		frappe.db.commit()


def _create_target_doctype(form_key: str, fields: list) -> str:
	doctype_name = f"RF {form_key}"
	if frappe.db.exists("DocType", doctype_name):
		return doctype_name

	doc = frappe.get_doc({
		"doctype": "DocType",
		"name": doctype_name,
		"module": "Reciprocl",
		"custom": 1,
		"istable": 0,
		"is_submittable": 0,
		"autoname": f"format:RF-{form_key}-{{####}}",
		"permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}],
		"fields": [],
	})

	for f in fields:
		raw_label = f.get("label", "")
		if not raw_label:
			continue
		fieldname = frappe.scrub(raw_label)
		if fieldname in RESTRICTED_FIELDNAMES:
			fieldname = f"{fieldname}_response"
		doc.append("fields", {
			"fieldname": fieldname,
			"label": raw_label,
			"fieldtype": f.get("type", "Data"),
			"reqd": f.get("required", 0),
		})

	doc.insert(ignore_permissions=True)
	frappe.clear_cache(doctype=doctype_name)
	frappe.clear_cache()
	return doctype_name


# ---------------------------------------------------------------------------
# Workspace APIs
# ---------------------------------------------------------------------------


@frappe.whitelist()
def get_workspaces():
	"""Return all workspaces accessible to current logged in user with role & stats."""
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw(_("Authentication required"), frappe.AuthenticationError)

	workspace_names = get_user_workspaces(user)
	if not workspace_names and is_system_admin(user):
		workspace_names = frappe.get_all("Reciprocl Workspace", pluck="name")

	workspaces = []
	for ws_name in workspace_names:
		try:
			doc = frappe.get_doc("Reciprocl Workspace", ws_name)
			role = get_user_workspace_role(ws_name, user)
			form_count = frappe.db.count("Reciprocl Form", {"workspace": ws_name})
			member_count = len(doc.get("members") or [])
			workspaces.append({
				"name": doc.name,
				"workspace_name": doc.workspace_name,
				"visibility": doc.visibility,
				"description": doc.description or "",
				"owner_user": doc.owner_user,
				"role": role or "Viewer",
				"member_count": member_count,
				"form_count": form_count,
			})
		except Exception:
			continue

	workspaces.sort(key=lambda w: w["workspace_name"].lower())
	return workspaces


@frappe.whitelist()
def get_public_workspaces():
	"""Discover all public workspaces with user's membership / join-request status."""
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw(_("Authentication required"), frappe.AuthenticationError)

	public_ws = frappe.get_all(
		"Reciprocl Workspace",
		filters={"visibility": "Public"},
		fields=["name", "workspace_name", "description", "owner_user"],
	)

	user_workspaces = set(get_user_workspaces(user))

	pending_requests = set(
		frappe.get_all(
			"Reciprocl Workspace Invitation",
			filters={"email": user, "type": "Join Request", "status": "Pending"},
			pluck="workspace",
		)
	)

	result = []
	for ws in public_ws:
		name = ws["name"]
		form_count = frappe.db.count("Reciprocl Form", {"workspace": name})
		member_count = frappe.db.count("Reciprocl Workspace Member", {"parent": name})

		if name in user_workspaces:
			user_status = "member"
			role = get_user_workspace_role(name, user)
		elif name in pending_requests:
			user_status = "pending_request"
			role = None
		else:
			user_status = "none"
			role = None

		result.append({
			"name": name,
			"workspace_name": ws["workspace_name"],
			"description": ws.get("description") or "",
			"owner_user": ws["owner_user"],
			"member_count": member_count,
			"form_count": form_count,
			"user_status": user_status,
			"role": role,
		})

	result.sort(key=lambda w: w["workspace_name"].lower())
	return result


@frappe.whitelist()
def get_workspace(workspace: str):
	"""Get single workspace metadata, user role, and stats."""
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw(_("Authentication required"), frappe.AuthenticationError)

	check_workspace_permission(workspace, "read_workspace")
	doc = frappe.get_doc("Reciprocl Workspace", workspace)
	role = get_user_workspace_role(workspace, user)
	form_count = frappe.db.count("Reciprocl Form", {"workspace": workspace})
	member_count = len(doc.get("members") or [])

	return {
		"name": doc.name,
		"workspace_name": doc.workspace_name,
		"visibility": doc.visibility,
		"description": doc.description or "",
		"owner_user": doc.owner_user,
		"role": role or ("Viewer" if doc.visibility == "Public" else "None"),
		"member_count": member_count,
		"form_count": form_count,
	}


@frappe.whitelist()
def create_workspace(workspace_name: str, visibility: str = "Private", description: str = ""):
	"""Create a new workspace. Logged-in user becomes Owner."""
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw(_("Authentication required"), frappe.AuthenticationError)

	if not workspace_name or not workspace_name.strip():
		frappe.throw(_("Workspace name is required"))

	doc = frappe.get_doc({
		"doctype": "Reciprocl Workspace",
		"workspace_name": workspace_name.strip(),
		"visibility": visibility if visibility in ("Public", "Private") else "Private",
		"description": description.strip() if description else "",
		"owner_user": user,
		"members": [
			{
				"user": user,
				"role": "Owner",
				"joined_at": now_datetime(),
			}
		],
	})
	doc.insert(ignore_permissions=True)
	frappe.db.commit()

	return {
		"message": "Workspace created successfully",
		"workspace": {
			"name": doc.name,
			"workspace_name": doc.workspace_name,
			"visibility": doc.visibility,
			"description": doc.description,
			"owner_user": doc.owner_user,
			"role": "Owner",
			"member_count": 1,
			"form_count": 0,
		},
	}


@frappe.whitelist()
def update_workspace(workspace: str, workspace_name: str = None, visibility: str = None, description: str = None):
	"""Update workspace settings (Owner or Admin)."""
	check_workspace_permission(workspace, "update_workspace")

	doc = frappe.get_doc("Reciprocl Workspace", workspace)
	if workspace_name is not None and workspace_name.strip():
		doc.workspace_name = workspace_name.strip()
	if visibility is not None and visibility in ("Public", "Private"):
		doc.visibility = visibility
	if description is not None:
		doc.description = description.strip()

	doc.save(ignore_permissions=True)
	frappe.db.commit()

	return {"message": "Workspace updated successfully"}


@frappe.whitelist()
def delete_workspace(workspace: str):
	"""Delete workspace (Owner only). Reassigns forms to General if exists."""
	check_workspace_permission(workspace, "delete_workspace")

	general_ws = frappe.db.get_value("Reciprocl Workspace", {"workspace_name": "General"}, "name")
	if general_ws and general_ws != workspace:
		frappe.db.sql(
			"UPDATE `tabReciprocl Form` SET workspace = %s WHERE workspace = %s",
			(general_ws, workspace),
		)

	# Delete invitations
	frappe.db.delete("Reciprocl Workspace Invitation", {"workspace": workspace})
	frappe.delete_doc("Reciprocl Workspace", workspace, ignore_permissions=True)
	frappe.db.commit()

	return {"message": "Workspace deleted successfully"}


@frappe.whitelist()
def transfer_ownership(workspace: str, new_owner_email: str):
	"""Transfer workspace ownership to another user (Owner only)."""
	check_workspace_permission(workspace, "transfer_ownership")
	current_user = frappe.session.user

	if not frappe.db.exists("User", new_owner_email):
		frappe.throw(_("User '{0}' does not exist").format(new_owner_email))

	doc = frappe.get_doc("Reciprocl Workspace", workspace)
	doc.owner_user = new_owner_email

	# Update members: new owner becomes Owner, old owner becomes Admin
	found_new = False
	for m in doc.members:
		if m.user == new_owner_email:
			m.role = "Owner"
			found_new = True
		elif m.user == current_user:
			m.role = "Admin"

	if not found_new:
		doc.append("members", {
			"user": new_owner_email,
			"role": "Owner",
			"joined_at": now_datetime(),
		})

	doc.save(ignore_permissions=True)
	frappe.db.commit()

	return {"message": f"Ownership transferred to {new_owner_email}"}


# ---------------------------------------------------------------------------
# Workspace Members APIs
# ---------------------------------------------------------------------------


@frappe.whitelist()
def get_workspace_members(workspace: str):
	"""Return all members of a workspace."""
	check_workspace_permission(workspace, "read_workspace")

	doc = frappe.get_doc("Reciprocl Workspace", workspace)
	members = []
	for m in doc.get("members") or []:
		user_doc = frappe.db.get_value("User", m.user, ["full_name", "user_image", "email"], as_dict=True) or {}
		members.append({
			"user": m.user,
			"email": user_doc.get("email") or m.user,
			"full_name": user_doc.get("full_name") or m.user,
			"user_image": user_doc.get("user_image") or "",
			"role": m.role,
			"joined_at": str(m.joined_at or ""),
		})

	role_order = {"Owner": 1, "Admin": 2, "Editor": 3, "Viewer": 4}
	members.sort(key=lambda x: (role_order.get(x["role"], 99), x["full_name"].lower()))
	return members


@frappe.whitelist()
def update_member_role(workspace: str, user: str, new_role: str):
	"""Change a member's role (Owner or Admin)."""
	check_workspace_permission(workspace, "manage_members")
	current_user = frappe.session.user
	caller_role = get_user_workspace_role(workspace, current_user)

	if new_role not in ("Owner", "Admin", "Editor", "Viewer"):
		frappe.throw(_("Invalid role: {0}").format(new_role))

	doc = frappe.get_doc("Reciprocl Workspace", workspace)

	# Hierarchy rules:
	# 1. Admin cannot assign Owner role
	if new_role == "Owner" and caller_role != "Owner" and not is_system_admin(current_user):
		frappe.throw(_("Only the Workspace Owner can grant Owner role"), frappe.PermissionError)

	# 2. Cannot demote the workspace Owner unless you are the Owner
	if doc.owner_user == user and caller_role != "Owner" and not is_system_admin(current_user):
		frappe.throw(_("Cannot modify the role of the workspace Owner"), frappe.PermissionError)

	# 3. Admin cannot demote another Admin
	target_role = None
	target_row = None
	for m in doc.members:
		if m.user == user:
			target_role = m.role
			target_row = m
			break

	if not target_row:
		frappe.throw(_("User is not a member of this workspace"))

	if caller_role == "Admin" and target_role in ("Owner", "Admin") and user != current_user:
		frappe.throw(_("Admins cannot modify roles of other Admins or Owners"), frappe.PermissionError)

	target_row.role = new_role
	doc.save(ignore_permissions=True)
	frappe.db.commit()

	return {"message": f"Updated role for {user} to {new_role}"}


@frappe.whitelist()
def remove_member(workspace: str, user: str):
	"""Remove a member from the workspace (Owner/Admin or self-leave)."""
	current_user = frappe.session.user
	caller_role = get_user_workspace_role(workspace, current_user)

	doc = frappe.get_doc("Reciprocl Workspace", workspace)

	if user == doc.owner_user:
		frappe.throw(_("The workspace Owner cannot be removed"), frappe.PermissionError)

	if user != current_user:
		check_workspace_permission(workspace, "manage_members")
		if caller_role == "Admin":
			target_role = get_user_workspace_role(workspace, user)
			if target_role in ("Owner", "Admin"):
				frappe.throw(_("Admins cannot remove other Admins or Owners"), frappe.PermissionError)

	# Filter out the member row
	doc.members = [m for m in doc.members if m.user != user]
	doc.save(ignore_permissions=True)
	frappe.db.commit()

	return {"message": f"Removed {user} from workspace"}


@frappe.whitelist()
def leave_workspace(workspace: str):
	"""Leave a workspace (non-owners only)."""
	return remove_member(workspace, frappe.session.user)



# ---------------------------------------------------------------------------
# Invitations & Join Requests APIs
# ---------------------------------------------------------------------------


@frappe.whitelist()
def invite_user(workspace: str, email: str, role: str = "Viewer"):
	"""Invite a user by email with an assigned role (Owner or Admin)."""
	check_workspace_permission(workspace, "invite")
	email = (email or "").strip().lower()
	validate_email_address(email, throw=True)

	if role not in ("Admin", "Editor", "Viewer"):
		role = "Viewer"

	doc = frappe.get_doc("Reciprocl Workspace", workspace)

	# Check if already a member
	existing_members = [m.user.lower() for m in doc.members]
	if email in existing_members:
		frappe.throw(_("{0} is already a member of this workspace").format(email))

	# Generate key and hash
	plain_key = frappe.generate_hash(length=32)
	hashed_key = sha256_hash(plain_key)

	# Cancel any existing pending invite for this email & workspace
	frappe.db.sql(
		"""
		UPDATE `tabReciprocl Workspace Invitation`
		SET status = 'Cancelled'
		WHERE workspace = %s AND email = %s AND status = 'Pending'
		""",
		(workspace, email),
	)

	invitation = frappe.get_doc({
		"doctype": "Reciprocl Workspace Invitation",
		"workspace": workspace,
		"email": email,
		"role": role,
		"type": "Invitation",
		"status": "Pending",
		"key": hashed_key,
		"invited_by": frappe.session.user,
		"email_sent_at": now_datetime(),
	})
	invitation.insert(ignore_permissions=True)
	frappe.db.commit()

	invite_link = frappe.utils.get_url(f"/reciprocl/invite?key={plain_key}")

	# Send invitation email
	try:
		frappe.sendmail(
			recipients=email,
			subject=f"Invitation to join '{doc.workspace_name}' on Reciprocl",
			message=f"""
			<p>Hello,</p>
			<p><b>{frappe.session.user}</b> has invited you to collaborate on the workspace <b>{doc.workspace_name}</b> as <b>{role}</b>.</p>
			<p><a href="{invite_link}" style="background-color: #191919; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
			<p>Or copy this link: {invite_link}</p>
			""",
			now=True,
		)
	except Exception:
		pass

	return {
		"message": f"Invitation sent to {email}",
		"invitation_id": invitation.name,
		"invite_link": invite_link,
	}


@frappe.whitelist()
def cancel_invitation(invitation_id: str):
	"""Cancel a pending invitation (Owner or Admin)."""
	inv = frappe.get_doc("Reciprocl Workspace Invitation", invitation_id)
	check_workspace_permission(inv.workspace, "manage_members")

	if inv.status != "Pending":
		frappe.throw(_("Only pending invitations can be cancelled"))

	inv.status = "Cancelled"
	inv.save(ignore_permissions=True)
	frappe.db.commit()

	return {"message": "Invitation cancelled"}


@frappe.whitelist()
def get_workspace_invitations(workspace: str):
	"""Get all pending invitations and join requests for this workspace (Owner/Admin)."""
	check_workspace_permission(workspace, "manage_members")

	invites = frappe.get_all(
		"Reciprocl Workspace Invitation",
		filters={"workspace": workspace, "status": "Pending"},
		fields=["name", "email", "role", "type", "status", "invited_by", "email_sent_at", "creation"],
		order_by="creation desc",
	)
	return invites


@frappe.whitelist()
def request_to_join(workspace: str):
	"""Request to join a public workspace."""
	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw(_("Authentication required"), frappe.AuthenticationError)

	ws = frappe.get_doc("Reciprocl Workspace", workspace)
	if ws.visibility != "Public":
		frappe.throw(_("You cannot request to join a private workspace. An invitation is required."), frappe.PermissionError)

	existing_members = [m.user.lower() for m in ws.members]
	if user.lower() in existing_members:
		frappe.throw(_("You are already a member of this workspace"))

	# Check pending join request
	existing_req = frappe.db.exists(
		"Reciprocl Workspace Invitation",
		{"workspace": workspace, "email": user, "type": "Join Request", "status": "Pending"},
	)
	if existing_req:
		frappe.throw(_("You already have a pending join request for this workspace"))

	req = frappe.get_doc({
		"doctype": "Reciprocl Workspace Invitation",
		"workspace": workspace,
		"email": user,
		"role": "Viewer",
		"type": "Join Request",
		"status": "Pending",
		"invited_by": user,
		"email_sent_at": now_datetime(),
	})
	req.insert(ignore_permissions=True)
	frappe.db.commit()

	return {"message": "Join request submitted successfully"}


@frappe.whitelist()
def approve_join_request(invitation_id: str, role: str = "Viewer"):
	"""Approve a user's join request (Owner or Admin)."""
	inv = frappe.get_doc("Reciprocl Workspace Invitation", invitation_id)
	check_workspace_permission(inv.workspace, "approve_join_request")

	if inv.status != "Pending" or inv.type != "Join Request":
		frappe.throw(_("Invalid or already processed join request"))

	if role not in ("Admin", "Editor", "Viewer"):
		role = "Viewer"

	ws = frappe.get_doc("Reciprocl Workspace", inv.workspace)
	if not any(m.user == inv.email for m in ws.members):
		ws.append("members", {
			"user": inv.email,
			"role": role,
			"joined_at": now_datetime(),
		})
		ws.save(ignore_permissions=True)

	inv.status = "Accepted"
	inv.role = role
	inv.accepted_at = now_datetime()
	inv.save(ignore_permissions=True)
	frappe.db.commit()

	return {"message": f"Approved join request for {inv.email}"}


@frappe.whitelist()
def reject_join_request(invitation_id: str):
	"""Reject a join request (Owner or Admin)."""
	inv = frappe.get_doc("Reciprocl Workspace Invitation", invitation_id)
	check_workspace_permission(inv.workspace, "approve_join_request")

	if inv.status != "Pending":
		frappe.throw(_("Request is no longer pending"))

	inv.status = "Rejected"
	inv.save(ignore_permissions=True)
	frappe.db.commit()

	return {"message": "Join request rejected"}


@frappe.whitelist()
def get_my_invitations():
	"""Get pending invitations for the currently logged in user."""
	user = frappe.session.user
	if not user or user == "Guest":
		return []

	user_email = frappe.db.get_value("User", user, "email") or user
	user_emails = list(set([user.lower(), user_email.lower()]))
	invitations = frappe.get_all(
		"Reciprocl Workspace Invitation",
		filters={"email": ["in", user_emails], "type": "Invitation", "status": "Pending"},
		fields=["name", "workspace", "role", "invited_by", "creation", "email_sent_at"],
		order_by="creation desc",
	)

	for inv in invitations:
		inv["workspace_name"] = frappe.db.get_value("Reciprocl Workspace", inv["workspace"], "workspace_name") or inv["workspace"]
		inv["invited_by_name"] = frappe.db.get_value("User", inv["invited_by"], "full_name") or inv["invited_by"]

	return invitations


@frappe.whitelist(allow_guest=True)
def get_invitation_details(key: str):
	"""Fetch invitation info for display on the accept/decline landing page."""
	if not key:
		frappe.throw(_("Key is required"))

	hashed = sha256_hash(key)
	inv_name = frappe.db.get_value("Reciprocl Workspace Invitation", {"key": hashed}, "name")
	if not inv_name:
		frappe.throw(_("Invitation not found or invalid link"), frappe.DoesNotExistError)

	inv = frappe.get_doc("Reciprocl Workspace Invitation", inv_name)
	ws = frappe.get_doc("Reciprocl Workspace", inv.workspace)
	inviter_name = frappe.db.get_value("User", inv.invited_by, "full_name") or inv.invited_by

	expired = False
	if inv.status == "Pending":
		if get_datetime(inv.creation) < get_datetime(add_days(now_datetime(), -7)):
			inv.status = "Expired"
			inv.save(ignore_permissions=True)
			frappe.db.commit()
			expired = True
	elif inv.status == "Expired":
		expired = True

	return {
		"invitation_id": inv.name,
		"workspace": ws.name,
		"workspace_name": ws.workspace_name,
		"description": ws.description or "",
		"email": inv.email,
		"role": inv.role,
		"status": inv.status,
		"invited_by": inv.invited_by,
		"invited_by_name": inviter_name,
		"expired": expired,
	}


@frappe.whitelist(allow_guest=True)
def accept_invitation(key: str = None, invitation_id: str = None):
	"""Accept an invitation via direct token key or via invitation ID."""
	if key:
		hashed = sha256_hash(key)
		inv_name = frappe.db.get_value("Reciprocl Workspace Invitation", {"key": hashed, "status": "Pending"}, "name")
		if not inv_name:
			frappe.throw(_("Invalid or expired invitation link"))
		inv = frappe.get_doc("Reciprocl Workspace Invitation", inv_name)
	elif invitation_id:
		user = frappe.session.user
		if not user or user == "Guest":
			frappe.throw(_("Authentication required"), frappe.AuthenticationError)
		inv = frappe.get_doc("Reciprocl Workspace Invitation", invitation_id)
		if inv.email.lower() != user.lower():
			frappe.throw(_("This invitation belongs to another user"), frappe.PermissionError)
	else:
		frappe.throw(_("Key or invitation_id required"))

	if inv.status != "Pending":
		frappe.throw(_("This invitation is no longer pending (status: {0})").format(inv.status))

	if get_datetime(inv.creation) < get_datetime(add_days(now_datetime(), -7)):
		inv.status = "Expired"
		inv.save(ignore_permissions=True)
		frappe.db.commit()
		frappe.throw(_("This invitation has expired"), frappe.ValidationError)

	# Ensure user account exists
	email = inv.email
	if not frappe.db.exists("User", email):
		first_name = email.split("@")[0].title()
		new_user = frappe.get_doc({
			"doctype": "User",
			"user_type": "Website User",
			"email": email,
			"first_name": first_name,
			"send_welcome_email": 0,
		})
		new_user.insert(ignore_permissions=True)

	# Add to workspace members
	ws = frappe.get_doc("Reciprocl Workspace", inv.workspace)
	if not any(m.user.lower() == email.lower() for m in ws.members):
		ws.append("members", {
			"user": email,
			"role": inv.role or "Viewer",
			"joined_at": now_datetime(),
		})
		ws.save(ignore_permissions=True)

	inv.status = "Accepted"
	inv.accepted_at = now_datetime()
	inv.save(ignore_permissions=True)
	frappe.db.commit()

	if frappe.session.user == "Guest" and hasattr(frappe.local, "login_manager"):
		try:
			frappe.local.login_manager.login_as(email)
		except Exception:
			pass

	return {
		"message": "Invitation accepted successfully",
		"workspace": ws.name,
		"workspace_name": ws.workspace_name,
	}


@frappe.whitelist(allow_guest=True)
def decline_invitation(invitation_id: str = None, key: str = None):
	"""Decline an invitation."""
	if key:
		hashed = sha256_hash(key)
		inv_name = frappe.db.get_value("Reciprocl Workspace Invitation", {"key": hashed, "status": "Pending"}, "name")
		if not inv_name:
			frappe.throw(_("Invalid or expired invitation link"))
		inv = frappe.get_doc("Reciprocl Workspace Invitation", inv_name)
	elif invitation_id:
		user = frappe.session.user
		inv = frappe.get_doc("Reciprocl Workspace Invitation", invitation_id)
		if inv.email.lower() != user.lower():
			frappe.throw(_("This invitation belongs to another user"), frappe.PermissionError)
	else:
		frappe.throw(_("Key or invitation_id required"))

	inv.status = "Rejected"
	inv.save(ignore_permissions=True)
	frappe.db.commit()

	return {"message": "Invitation declined"}


# ---------------------------------------------------------------------------
# Forms & Submissions APIs
# ---------------------------------------------------------------------------


@frappe.whitelist()
def get_workspace_forms(workspace: str, status_filter: str = "All"):
	"""Return all forms for a workspace with stats, filtered by role."""
	check_workspace_permission(workspace, "read_form")

	filters = {"workspace": workspace}
	if status_filter in ("Draft", "Published", "Closed"):
		filters["status"] = status_filter

	forms = frappe.get_all(
		"Reciprocl Form",
		filters=filters,
		fields=["name", "form_title", "form_key", "status", "target_doctype", "modified", "owner"],
		order_by="modified desc",
	)

	for form in forms:
		form["responses_count"] = frappe.db.count("Reciprocl Submission", {"form": form["name"]})
		form["share_url"] = f"/{form['form_key']}" if form.get("form_key") else ""

	return forms


@frappe.whitelist()
def publish_form(form_title: str, fields: str | list, workspace: str = None):
	"""Create and publish a new Reciprocl Form in a workspace."""
	setup_doctypes()

	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw(_("Authentication required"), frappe.AuthenticationError)

	if not workspace:
		user_ws = get_user_workspaces(user)
		if user_ws:
			workspace = user_ws[0]
		else:
			gen = frappe.db.get_value("Reciprocl Workspace", {"workspace_name": "General"}, "name")
			workspace = gen or create_workspace("My Workspace")["workspace"]["name"]

	check_workspace_permission(workspace, "create_form")

	if isinstance(fields, str):
		fields = json.loads(fields)

	form_key = _generate_form_key()
	target_doctype = _create_target_doctype(form_key, fields)

	master = frappe.get_doc({
		"doctype": "Reciprocl Form",
		"workspace": workspace,
		"form_title": form_title,
		"form_key": form_key,
		"status": "Published",
		"target_doctype": target_doctype,
		"schema_json": json.dumps(fields),
	})
	master.insert(ignore_permissions=True)
	frappe.db.commit()

	return {
		"message": "success",
		"form_id": master.name,
		"form_key": form_key,
		"workspace": workspace,
		"share_url": f"/{form_key}",
	}


@frappe.whitelist()
def update_form(
	form_id: str,
	form_title: str = None,
	status: str = None,
	fields: str | list = None,
	settings_json: str | dict = None,
):
	"""Update form details, status, schema, or settings."""
	form = frappe.get_doc("Reciprocl Form", form_id)
	if form.workspace:
		check_workspace_permission(form.workspace, "edit_form")
	elif form.owner != frappe.session.user and not is_system_admin(frappe.session.user):
		frappe.throw(_("Permission denied"), frappe.PermissionError)

	if form_title is not None:
		form.form_title = form_title.strip()
	if status is not None and status in ("Draft", "Published", "Closed"):
		form.status = status
	if fields is not None:
		form.schema_json = json.dumps(fields) if not isinstance(fields, str) else fields
	if settings_json is not None:
		form.settings_json = json.dumps(settings_json) if not isinstance(settings_json, str) else settings_json

	form.save(ignore_permissions=True)
	frappe.db.commit()

	return {"message": "Form updated successfully"}


@frappe.whitelist()
def delete_form(form_id: str):
	"""Delete a form (Editor, Admin, Owner)."""
	form = frappe.get_doc("Reciprocl Form", form_id)
	if form.workspace:
		check_workspace_permission(form.workspace, "delete_form")
	elif form.owner != frappe.session.user and not is_system_admin(frappe.session.user):
		frappe.throw(_("Permission denied"), frappe.PermissionError)

	target = form.target_doctype

	frappe.delete_doc("Reciprocl Form", form_id, ignore_permissions=True)
	if target and frappe.db.exists("DocType", target):
		try:
			frappe.delete_doc("DocType", target, ignore_permissions=True)
		except Exception:
			pass

	frappe.db.commit()
	return {"message": "Form deleted successfully"}


@frappe.whitelist(allow_guest=True)
def get_form(form_key: str):
	"""Fetch a published form by its public form_key slug."""
	results = frappe.get_all(
		"Reciprocl Form",
		filters={"form_key": form_key, "status": "Published"},
		fields=["name", "form_title", "schema_json", "settings_json", "workspace"],
		limit=1,
		ignore_permissions=True,
	)

	if not results:
		frappe.throw(_("Form not found or not published"), frappe.DoesNotExistError)

	form = results[0]
	return {
		"form_id": form["name"],
		"form_title": form["form_title"],
		"workspace": form.get("workspace") or "",
		"schema_json": json.loads(form["schema_json"] or "[]"),
		"settings_json": json.loads(form["settings_json"] or "{}"),
	}


@frappe.whitelist(allow_guest=True)
def submit_form(form_key: str, data: str | dict):
	"""Handle a public form submission."""
	if isinstance(data, str):
		data = json.loads(data)

	results = frappe.get_all(
		"Reciprocl Form",
		filters={"form_key": form_key, "status": "Published"},
		fields=["name", "target_doctype", "workspace"],
		limit=1,
		ignore_permissions=True,
	)

	if not results:
		frappe.throw(_("Form not found or no longer accepting responses"), frappe.DoesNotExistError)

	form = results[0]

	# Step 1: Write response into target DocType
	response_doc = frappe.new_doc(form["target_doctype"])
	clean_data = {}
	for key, value in data.items():
		clean_key = frappe.scrub(key)
		if clean_key in RESTRICTED_FIELDNAMES:
			clean_key = f"{clean_key}_response"
		clean_data[clean_key] = value

	response_doc.update(clean_data)
	response_doc.insert(ignore_permissions=True)

	# Step 2: Write Reciprocl Submission metadata row
	submitter_email = data.get("email") or data.get("Email") or data.get("email_id") or ""

	submission = frappe.get_doc({
		"doctype": "Reciprocl Submission",
		"form": form["name"],
		"response_doc": response_doc.name,
		"submitted_at": now_datetime(),
		"ip_address": _get_ip(),
		"submitter_email": submitter_email,
		"status": "Pending",
	})
	submission.insert(ignore_permissions=True)
	frappe.db.commit()

	return {"message": "success", "submission_id": submission.name}


@frappe.whitelist()
def get_submissions(form_id: str):
	"""Return submissions for a given form. Enforces workspace read_submissions."""
	form = frappe.get_doc("Reciprocl Form", form_id)
	if form.workspace:
		check_workspace_permission(form.workspace, "read_submissions")
	elif form.owner != frappe.session.user and not is_system_admin(frappe.session.user):
		frappe.throw(_("Permission denied"), frappe.PermissionError)

	submissions = frappe.get_all(
		"Reciprocl Submission",
		filters={"form": form_id},
		fields=["name", "submitted_at", "status", "response_doc", "submitter_email", "ip_address"],
		order_by="submitted_at desc",
	)

	target = form.target_doctype
	if not target:
		return submissions

	try:
		meta = frappe.get_meta(target)
		field_names = [f.fieldname for f in meta.fields]
		for sub in submissions:
			if sub.get("response_doc"):
				try:
					resp = frappe.get_doc(target, sub["response_doc"])
					sub["data"] = {fn: resp.get(fn) for fn in field_names}
				except Exception:
					sub["data"] = {}
			else:
				sub["data"] = {}
	except Exception:
		for sub in submissions:
			sub["data"] = {}

	return submissions
