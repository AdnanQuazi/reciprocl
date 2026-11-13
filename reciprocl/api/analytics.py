# Copyright (c) 2026, Adnan and contributors
# For license information, please see license.txt

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import frappe
from frappe.utils import add_days, cint, getdate, nowdate


@frappe.whitelist()
def get_workspace_summary(workspace_id: str | None = None) -> dict[str, Any]:
	"""
	Return summary statistics for the dashboard header:
	{ total_responses, avg_completion_pct, live_forms_count }
	Optionally scoped to a specific workspace.
	"""
	form_filters: dict[str, Any] = {}
	if workspace_id:
		form_filters["workspace"] = workspace_id

	forms = frappe.get_all(
		"Reciprocl Form",
		filters=form_filters,
		fields=["name", "status"],
	)

	live_forms_count = sum(1 for f in forms if f.get("status") == "Published")
	form_names = [f["name"] for f in forms]

	if not form_names:
		return {
			"total_responses": 0,
			"avg_completion_pct": 0.0,
			"live_forms_count": live_forms_count,
		}

	submissions = frappe.get_all(
		"Reciprocl Submission",
		filters={"form": ["in", form_names]},
		fields=["name", "status"],
	)

	total_responses = len(submissions)
	completed_responses = sum(1 for s in submissions if s.get("status") in {"Reviewed", "Completed"})

	avg_completion_pct = (
		round((completed_responses / total_responses) * 100, 1) if total_responses > 0 else 0.0
	)

	return {
		"total_responses": total_responses,
		"avg_completion_pct": avg_completion_pct,
		"live_forms_count": live_forms_count,
	}


@frappe.whitelist()
def get_form_trend(form_id: str, days: int | str = 30) -> list[dict[str, Any]]:
	"""
	Return daily submission trend for sparkline visualization.
	Prioritizes Reciprocl Form Analytics table; computes dynamically from submissions if empty.
	"""
	days_count = max(1, cint(days or 30))
	start_date = add_days(nowdate(), -days_count)

	# Check aggregated analytics records first
	analytics_records = frappe.get_all(
		"Reciprocl Form Analytics",
		filters={"form": form_id, "date": [">=", start_date]},
		fields=["date", "submission_count", "completion_count"],
		order_by="date asc",
	)

	if analytics_records:
		return [
			{
				"date": str(r["date"]),
				"submissions": r["submission_count"] or 0,
				"completions": r["completion_count"] or 0,
			}
			for r in analytics_records
		]

	# Dynamic fallback from Reciprocl Submission rows
	submissions = frappe.get_all(
		"Reciprocl Submission",
		filters={"form": form_id, "submitted_at": [">=", f"{start_date} 00:00:00"]},
		fields=["submitted_at", "status"],
	)

	date_map: dict[str, dict[str, int]] = {}
	curr = getdate(start_date)
	end = getdate(nowdate())
	while curr <= end:
		date_str = str(curr)
		date_map[date_str] = {"submissions": 0, "completions": 0}
		curr += timedelta(days=1)

	for s in submissions:
		dt = s.get("submitted_at")
		if dt:
			d_str = str(dt)[:10]
			if d_str in date_map:
				date_map[d_str]["submissions"] += 1
				if s.get("status") in {"Reviewed", "Completed"}:
					date_map[d_str]["completions"] += 1

	return [
		{"date": d, "submissions": counts["submissions"], "completions": counts["completions"]}
		for d, counts in sorted(date_map.items())
	]


@frappe.whitelist()
def record_daily_stats(target_date: str | None = None) -> dict[str, Any]:
	"""
	Daily scheduler task: aggregates submission stats for each form into Reciprocl Form Analytics.
	"""
	date_to_record = target_date or nowdate()
	forms = frappe.get_all("Reciprocl Form", fields=["name"])

	recorded = 0
	for f in forms:
		form_id = f["name"]
		day_start = f"{date_to_record} 00:00:00"
		day_end = f"{date_to_record} 23:59:59"

		subs = frappe.get_all(
			"Reciprocl Submission",
			filters={"form": form_id, "submitted_at": ["between", [day_start, day_end]]},
			fields=["status"],
		)

		sub_count = len(subs)
		comp_count = sum(1 for s in subs if s.get("status") in {"Reviewed", "Completed"})

		existing = frappe.db.get_value(
			"Reciprocl Form Analytics",
			{"form": form_id, "date": date_to_record},
			"name",
		)

		if existing:
			doc = frappe.get_doc("Reciprocl Form Analytics", existing)
			doc.submission_count = sub_count
			doc.completion_count = comp_count
			doc.save(ignore_permissions=True)
		else:
			doc = frappe.get_doc(
				{
					"doctype": "Reciprocl Form Analytics",
					"form": form_id,
					"date": date_to_record,
					"submission_count": sub_count,
					"completion_count": comp_count,
				}
			)
			doc.insert(ignore_permissions=True)

		recorded += 1

	return {"message": "success", "date": date_to_record, "forms_recorded": recorded}
