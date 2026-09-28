import os

import frappe


def get_context(context):
	csrf_token = frappe.sessions.get_csrf_token()

	html_path = frappe.get_app_path("reciprocl", "public", "frontend", "index.html")

	if os.path.exists(html_path):
		with open(html_path) as f:
			html = f.read()

		script_inject = f'<script>window.csrf_token = "{csrf_token}";</script></head>'
		context.rendered_html = html.replace("</head>", script_inject)
	else:
		context.rendered_html = "<h1>Vite build not found! Run npm run build.</h1>"
