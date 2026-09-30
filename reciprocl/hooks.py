app_name = "reciprocl"
app_title = "Reciprocl"
app_publisher = "Adnan"
app_description = "Form Builder"
app_email = "adnan@example.com"
app_license = "mit"

after_install = "reciprocl.api.setup_doctypes"

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
