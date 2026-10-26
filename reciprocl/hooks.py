app_name = "reciprocl"
app_title = "Reciprocl"
app_publisher = "Adnan"
app_description = "Form Builder"
app_email = "adnan@example.com"
app_license = "mit"

after_install = "reciprocl.api.setup_doctypes"
after_migrate = "reciprocl.api.setup_doctypes"

use_json_request_body = True
export_python_type_annotations = True
require_type_annotated_api_methods = True

add_to_apps_screen = [
	{
		"name": "reciprocl",
		"logo": "/assets/reciprocl/images/logo.png",
		"title": "Reciprocl",
		"route": "/reciprocl",
	}
]

website_route_rules = [
	{"from_route": "/reciprocl/<path:app_path>", "to_route": "reciprocl"},
]

has_permission = {
	"Reciprocl Workspace": "reciprocl.permissions.has_workspace_permission",
	"Reciprocl Form": "reciprocl.permissions.has_form_permission",
	"Reciprocl Submission": "reciprocl.permissions.has_submission_permission",
}

permission_query_conditions = {
	"Reciprocl Workspace": "reciprocl.permissions.get_workspace_query_conditions",
	"Reciprocl Form": "reciprocl.permissions.get_form_query_conditions",
	"Reciprocl Submission": "reciprocl.permissions.get_submission_query_conditions",
}
