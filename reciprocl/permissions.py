import frappe
from frappe import _

ROLE_HIERARCHY = {
	"Owner": 4,
	"Admin": 3,
	"Editor": 2,
	"Viewer": 1,
}


def is_system_admin(user: str = None) -> bool:
	user = user or frappe.session.user
	if user == "Administrator":
		return True
	roles = frappe.get_roles(user)
	return "System Manager" in roles


def get_user_workspaces(user: str = None) -> list[str]:
	user = user or frappe.session.user
	if not user or user == "Guest":
		return []

	if is_system_admin(user):
		return frappe.get_all("Reciprocl Workspace", pluck="name")

	workspaces = frappe.db.sql_list(
		"""
		SELECT DISTINCT parent FROM `tabReciprocl Workspace Member`
		WHERE user = %s
		""",
		(user,),
	)

	owned = frappe.get_all("Reciprocl Workspace", filters={"owner_user": user}, pluck="name")
	return list(set(workspaces + owned))


def get_user_workspace_role(workspace: str, user: str = None) -> str | None:
	user = user or frappe.session.user
	if not user or user == "Guest":
		return None

	if is_system_admin(user):
		return "Owner"

	ws_owner = frappe.db.get_value("Reciprocl Workspace", workspace, "owner_user")
	if ws_owner == user:
		return "Owner"

	roles = frappe.db.sql_list(
		"""
		SELECT role FROM `tabReciprocl Workspace Member`
		WHERE parent = %s AND user = %s
		""",
		(workspace, user),
	)

	if not roles:
		return None

	return max(roles, key=lambda r: ROLE_HIERARCHY.get(r, 0))


def check_workspace_permission(
	workspace: str, action: str, user: str = None, raise_error: bool = True
) -> bool:
	user = user or frappe.session.user

	if is_system_admin(user):
		return True

	role = get_user_workspace_role(workspace, user)
	visibility = frappe.db.get_value("Reciprocl Workspace", workspace, "visibility") or "Private"

	permitted = False

	if action in ("delete_workspace", "transfer_ownership"):
		permitted = role == "Owner"
	elif action in ("manage_members", "update_workspace", "approve_join_request", "invite"):
		permitted = role in ("Owner", "Admin")
	elif action in ("create_form", "edit_form", "delete_form", "publish_form"):
		permitted = role in ("Owner", "Admin", "Editor")
	elif action in ("read_form", "read_submissions"):
		permitted = role in ("Owner", "Admin", "Editor", "Viewer")
	elif action == "read_workspace":
		permitted = (visibility == "Public") or (role in ("Owner", "Admin", "Editor", "Viewer"))
	else:
		permitted = False

	if not permitted and raise_error:
		frappe.throw(
			_("You do not have permission to perform '{0}' in workspace '{1}' (Role: {2})").format(
				action, workspace, role or "None"
			),
			frappe.PermissionError,
		)

	return permitted


def has_workspace_permission(doc, ptype="read", user=None):
	user = user or frappe.session.user
	if is_system_admin(user):
		return True

	if ptype == "read":
		return (doc.visibility == "Public") or (get_user_workspace_role(doc.name, user) is not None)
	elif ptype in ("write",):
		return check_workspace_permission(doc.name, "update_workspace", user, raise_error=False)
	elif ptype == "delete":
		return check_workspace_permission(doc.name, "delete_workspace", user, raise_error=False)
	elif ptype == "create":
		return user != "Guest"

	return False


def has_form_permission(doc, ptype="read", user=None):
	user = user or frappe.session.user
	if is_system_admin(user):
		return True

	# Public forms must be readable for public submission even by Guest
	if ptype == "read" and doc.get("status") == "Published":
		return True

	if not doc.get("workspace"):
		return doc.owner == user

	if ptype == "read":
		return check_workspace_permission(doc.workspace, "read_form", user, raise_error=False)
	elif ptype in ("write", "create"):
		return check_workspace_permission(doc.workspace, "create_form", user, raise_error=False)
	elif ptype == "delete":
		return check_workspace_permission(doc.workspace, "delete_form", user, raise_error=False)

	return False


def has_submission_permission(doc, ptype="read", user=None):
	user = user or frappe.session.user

	if ptype == "create":
		return True

	if is_system_admin(user):
		return True

	if not doc.get("form"):
		return False

	ws = frappe.db.get_value("Reciprocl Form", doc.form, "workspace")
	if not ws:
		form_owner = frappe.db.get_value("Reciprocl Form", doc.form, "owner")
		return form_owner == user

	return check_workspace_permission(ws, "read_submissions", user, raise_error=False)


def get_workspace_query_conditions(user=None):
	user = user or frappe.session.user
	if is_system_admin(user):
		return ""

	if not user or user == "Guest":
		return "`tabReciprocl Workspace`.visibility = 'Public'"

	escaped_user = frappe.db.escape(user)
	return f"""(
		`tabReciprocl Workspace`.visibility = 'Public'
		OR `tabReciprocl Workspace`.owner_user = {escaped_user}
		OR `tabReciprocl Workspace`.name IN (
			SELECT parent FROM `tabReciprocl Workspace Member` WHERE user = {escaped_user}
		)
	)"""


def get_form_query_conditions(user=None):
	user = user or frappe.session.user
	if is_system_admin(user):
		return ""

	if not user or user == "Guest":
		return "`tabReciprocl Form`.status = 'Published'"

	escaped_user = frappe.db.escape(user)
	return f"""(
		`tabReciprocl Form`.workspace IN (
			SELECT parent FROM `tabReciprocl Workspace Member` WHERE user = {escaped_user}
		)
		OR `tabReciprocl Form`.workspace IN (
			SELECT name FROM `tabReciprocl Workspace` WHERE owner_user = {escaped_user}
		)
		OR `tabReciprocl Form`.owner = {escaped_user}
	)"""


def get_submission_query_conditions(user=None):
	user = user or frappe.session.user
	if is_system_admin(user):
		return ""

	if not user or user == "Guest":
		return "1=0"

	escaped_user = frappe.db.escape(user)
	return f"""`tabReciprocl Submission`.form IN (
		SELECT name FROM `tabReciprocl Form` WHERE (
			workspace IN (SELECT parent FROM `tabReciprocl Workspace Member` WHERE user = {escaped_user})
			OR workspace IN (SELECT name FROM `tabReciprocl Workspace` WHERE owner_user = {escaped_user})
			OR owner = {escaped_user}
		)
	)"""
