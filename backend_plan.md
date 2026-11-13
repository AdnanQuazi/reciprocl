# Reciprocl — Backend Architecture Plan (v3)

> Updated with: dual form creation modes, Frappe-aligned schema design,
> schema_json structure, page break / conditional logic storage, and lean API surface.

---

## 0. Core Concept: Two Ways to Create a Form

### Mode 1 — From Scratch
User designs fields freely in the builder. On publish, we auto-create a Frappe DocType
(`RF {form_title}`) to store responses. The DocType is generated directly from `schema_json`.

### Mode 2 — From Existing DocType
User picks any installed Frappe DocType (e.g. `CRM Lead`, or a previously created `RF Job Application`).
The builder loads that DocType's fields. No new DocType is created on publish.
Submissions write directly into the selected DocType.

**Both modes store a `Reciprocl Form` record. The only difference is `creation_mode`
and whether we create a new DocType or reuse one.**

---

## 1. DocType Inventory

### Core

| DocType | Purpose |
|---|---|
| **Reciprocl Workspace** | Container (folder) for forms. Has name, owner, visibility. |
| **Reciprocl Workspace Member** | Who has access to a workspace and their role. |
| **Reciprocl Form** | *(exists, extended)* Form definition — title, schema, status, mode, workspace. |
| **Reciprocl Submission** | *(exists)* Metadata row per submission — timestamp, IP, status, response pointer. |
| **RF {form_title}** | *(Mode 1 only, auto-created on publish)* Per-form response table. Human-readable name. |

### Extensions

| DocType | Purpose |
|---|---|
| **Reciprocl Form Integration** | Links a form to a Frappe DocType + field mappings (auto-create a doc on submit). |
| **Reciprocl Integration Field Map** | Child table of Integration. Maps `form_fieldname → doctype_fieldname`. |
| **Reciprocl Form Analytics** | Daily aggregated stats per form (submission_count, completion_count). |

---

## 2. DocType Field Designs

### Reciprocl Workspace
| Field | Type | Notes |
|---|---|---|
| `workspace_name` | Data | e.g. "My workspace", "HR Hiring" |
| `owner_user` | Link → User | Creator / admin |
| `visibility` | Select | Private / Shared |
| `slug` | Data | Auto-generated URL-friendly key |

### Reciprocl Workspace Member
| Field | Type | Notes |
|---|---|---|
| `workspace` | Link → Reciprocl Workspace | |
| `user` | Link → User | Invited Frappe user |
| `role` | Select | Viewer / Editor / Admin |
| `invited_at` | Datetime | |
| `status` | Select | Pending / Accepted |

### Reciprocl Form *(extensions to existing)*
| Field | Type | Notes |
|---|---|---|
| `form_title` | Data | *(exists)* |
| `form_key` | Data | *(exists)* Public URL slug — auto-generated, e.g. `abc123` |
| `status` | Select | *(exists)* Draft / Published |
| `schema_json` | Long Text | *(exists, restructured — see Section 3)* |
| `settings_json` | Long Text | *(exists)* Theme / branding overrides |
| `workspace` | Link → Reciprocl Workspace | Which workspace it belongs to |
| `visibility` | Select | Private / Shared |
| `creation_mode` | Select | **Scratch** / **From DocType** |
| `source_doctype` | Data | *Mode 2 only* — DocType the user selected (e.g. `CRM Lead`) |
| `response_doctype` | Data | *(renamed from `target_doctype`)* Where responses are stored. Mode 1: `RF Job Application`. Mode 2: same as `source_doctype`. |

> **Field rename:** `target_doctype` → `response_doctype` for clarity.
> `source_doctype` = what the user picked (Mode 2).
> `response_doctype` = where submissions land at runtime (always set for both modes).

### Reciprocl Form Integration
| Field | Type | Notes |
|---|---|---|
| `form` | Link → Reciprocl Form | |
| `integration_name` | Data | e.g. "Push to CRM Lead" |
| `target_doctype` | Data | e.g. "CRM Lead" |
| `enabled` | Check | Toggle on/off |

### Reciprocl Integration Field Map *(child of Form Integration)*
| Field | Type | Notes |
|---|---|---|
| `form_fieldname` | Data | Fieldname from schema_json (e.g. `full_name`) |
| `doctype_fieldname` | Data | Fieldname in the integration target DocType (e.g. `lead_name`) |

### Reciprocl Form Analytics
| Field | Type | Notes |
|---|---|---|
| `form` | Link → Reciprocl Form | |
| `date` | Date | Aggregation day |
| `submission_count` | Int | Total submissions that day |
| `completion_count` | Int | Submissions with status = Completed |

---

## 3. The `schema_json` Structure (Key Design)

`schema_json` is a single JSON blob on `Reciprocl Form`. It is the **presentation layer** —
it stores field definitions, page breaks, conditional logic, routing, and form-level settings.
It does NOT store raw response data (that goes in the DocType).

This mirrors Frappe's own design: the DocType stores data, the Web Form stores presentation.

---

### How field storage works (Frappe principle we follow)

| Field type | Gets a DB column? | Example |
|---|---|---|
| Data, Int, Select, Long Text, etc. | ✅ YES | `full_name`, `email`, `years_exp` |
| Page Break | ❌ NO — UI only | Page boundary marker → renders Prev/Next buttons |
| Section Break | ❌ NO — UI only | Visual grouping within a page |
| Column Break | ❌ NO — UI only | Two-column layout |

All of them live in the `schema_json.fields[]` array AND in the auto-created DocType's
fields array (Mode 1). Only data-type fields get a SQL column.

---

### Mode 1 — From Scratch: `schema_json` Example

```json
{
  "fields": [
    {
      "fieldname": "full_name",
      "fieldtype": "Data",
      "label": "Full Name",
      "placeholder": "Enter your full name",
      "reqd": 1,
      "depends_on": ""
    },
    {
      "fieldname": "email",
      "fieldtype": "Data",
      "label": "Email",
      "reqd": 1,
      "depends_on": ""
    },
    {
      "fieldname": "page_break_1",
      "fieldtype": "Page Break",
      "label": "Your Experience"
    },
    {
      "fieldname": "years_exp",
      "fieldtype": "Int",
      "label": "Years of Experience",
      "reqd": 0
    },
    {
      "fieldname": "cover_letter",
      "fieldtype": "Long Text",
      "label": "Cover Letter",
      "depends_on": "eval:doc.years_exp > 0"
    }
  ],

  "routing": [
    {
      "from_page": 1,
      "condition": "doc.department === 'Engineering'",
      "to_page": 3
    }
  ],

  "settings": {
    "success_message": "Application received!",
    "success_redirect": "",
    "show_progress_bar": true,
    "allow_draft": false
  }
}
```

**At publish → we create DocType `RF Job Application` with these fields:**
```
RF Job Application (DocType)
├── full_name     → SQL column  ✅ (Data)
├── email         → SQL column  ✅ (Data)
├── page_break_1  → NO column  (layout only)
├── years_exp     → SQL column  ✅ (Int)
└── cover_letter  → SQL column  ✅ (Long Text, depends_on stored on DocField row)
```

---

### Mode 2 — From Existing DocType: `schema_json` Example

User picks `CRM Lead`. `schema_json.fields` stores **which fields to show + overrides + layout markers**.
The actual fieldtype, options, etc. come from `frappe.get_meta("CRM Lead")` at render time.

```json
{
  "fields": [
    {
      "fieldname": "lead_name",
      "label": "Full Name",
      "reqd": 1
    },
    {
      "fieldname": "email_id",
      "label": "Email"
    },
    {
      "fieldname": "page_break_1",
      "fieldtype": "Page Break",
      "label": "More Details"
    },
    {
      "fieldname": "mobile_no",
      "label": "Phone Number"
    },
    {
      "fieldname": "company_name",
      "label": "Company",
      "depends_on": "eval:doc.mobile_no"
    }
  ],

  "routing": [],

  "settings": {
    "success_message": "We'll be in touch!",
    "success_redirect": "/thank-you",
    "show_progress_bar": true,
    "allow_draft": false
  }
}
```

**At render time:**
```
frappe.get_meta("CRM Lead").fields   ← fieldtype, options, full definitions
        +
schema_json.fields                   ← which fields to show, order, label overrides
        =
Final rendered form
```

No DocType is created. Submission writes directly into `CRM Lead`.

---

### Conditional Logic — Two Layers

| Layer | What it handles | Where stored |
|---|---|---|
| **Field-level** `depends_on` | Show/hide a field based on another field's value | `schema_json.fields[].depends_on` as a JS expression string. Copied to DocType field def at publish (Mode 1). Evaluated client-side. |
| **Page-level routing** | "If Department = Engineering → go to page 3" | `schema_json.routing[]`. Our React renderer handles this. NOT part of Frappe DocType (Frappe doesn't support branching navigation natively). |

---

## 4. DocType Naming Convention for Auto-Created Tables

| | Old (bad) | New (good) |
|---|---|---|
| Name | `RF abc123` | `RF Job Application` |
| Readable? | ❌ Opaque random slug | ✅ Matches the form title |
| In Frappe Desk / Insights | Useless | Meaningful |

**Conflict handling:** If `RF Lead Capture` already exists → try `RF Lead Capture 2`, etc.

```python
def _make_response_doctype_name(form_title: str) -> str:
    base = f"RF {form_title.strip()}"
    if not frappe.db.exists("DocType", base):
        return base
    i = 2
    while frappe.db.exists("DocType", f"{base} {i}"):
        i += 1
    return f"{base} {i}"
```

**Autoname pattern:** `format:RF-{scrubbed_title}-{####}` → e.g. `RF-Job-Application-0001`

---

## 5. Folder Structure

```
reciprocl/
├── hooks.py
├── api.py                          ← thin file, re-exports from api/ package
│
├── api/
│   ├── __init__.py
│   ├── utils.py                    ← _get_ip, RESTRICTED_FIELDNAMES,
│   │                                  _create_response_doctype, _make_doctype_name
│   ├── forms.py                    ← get_public_form, publish_form,
│   │                                  get_available_doctypes, get_doctype_schema
│   ├── submissions.py              ← submit_form (guest), get_submissions
│   ├── integrations.py             ← get_doctype_fields
│   └── analytics.py               ← get_workspace_summary, get_form_trend,
│                                      record_daily_stats (scheduler)
│
└── reciprocl/
    └── doctype/
        ├── reciprocl_workspace/
        ├── reciprocl_workspace_member/
        ├── reciprocl_form/             ← existing, fields extended
        ├── reciprocl_submission/       ← existing
        ├── reciprocl_form_integration/
        ├── reciprocl_integration_field_map/
        └── reciprocl_form_analytics/
```

---

## 6. What Frappe Gives Us For Free

The React frontend calls these Frappe built-in APIs directly via `frappe-react-sdk`.
No custom Python needed for these:

| Task | Frappe API |
|---|---|
| List workspaces / forms | `frappe.client.get_list` |
| Open a form for editing | `frappe.client.get` |
| Create workspace / form doc | `frappe.client.insert` |
| Save form schema edits | `frappe.client.save` |
| Toggle status / visibility | `frappe.client.set_value` |
| Delete a form / workspace | `frappe.client.delete` |
| Browse available DocTypes | `frappe.client.get_list("DocType", ...)` |
| Invite / manage members | `frappe.client.insert` / `.save` / `.delete` |

---

## 7. Custom API Endpoints We Build

Format: `reciprocl.api.<file>.<function>`

### `api/forms.py`

| Function | Auth | Why custom |
|---|---|---|
| `get_public_form(form_key)` | 🌐 Guest | Guests can't call `frappe.client.get` without permissions. Fetches published form schema + settings by URL slug. |
| `publish_form(form_id)` | 🔒 Login | Mode 1 side effect: creates the `RF *` DocType. Mode 2: just flips status. `frappe.client.set_value` can't trigger DocType creation. |
| `get_available_doctypes()` | 🔒 Login | Returns DocTypes the user can base a form on — all `RF *` ones + installed app DocTypes, filtered and labelled. |
| `get_doctype_schema(doctype)` | 🔒 Login | Returns fields of an existing DocType (filtered — no system fields, no child tables). Used to populate the builder in Mode 2. |

### `api/submissions.py`

| Function | Auth | Why custom |
|---|---|---|
| `submit_form(form_key, data)` | 🌐 Guest | Main public submit. Handles both modes, writes response row + Submission metadata, triggers integrations. `frappe.client.insert` is not guest-safe without permissions setup. |
| `get_submissions(form_id, page, page_size)` | 🔒 Login | Joins two DocTypes (Submission + RF-* or source doctype). Needs custom SQL. |

### `api/integrations.py`

| Function | Auth | Why custom |
|---|---|---|
| `get_doctype_fields(doctype)` | 🔒 Login | Wraps `frappe.get_meta()` with filtering (removes system/layout fields). Used in integration field-mapping UI. |

### `api/analytics.py`

| Function | Auth | Why custom |
|---|---|---|
| `get_workspace_summary(workspace_id)` | 🔒 Login | Returns `{ total_responses, avg_completion_pct, live_forms_count }`. Complex aggregation across multiple DocTypes. |
| `get_form_trend(form_id, days)` | 🔒 Login | Daily `[{ date, submissions, completions }]` for sparkline. Reads `Reciprocl Form Analytics`. |
| `record_daily_stats()` | ⚙️ Scheduler | Nightly Frappe scheduler job. Aggregates submission counts into `Reciprocl Form Analytics` rows. |

**Total custom endpoints: 9** (down from ~25 originally planned)

---

## 8. Full Data Flow Examples

### Mode 1 — Scratch: Create → Publish → Submit

```
1. User creates form
   → frappe.client.insert({
       doctype: "Reciprocl Form",
       form_title: "Job Application",
       creation_mode: "Scratch",
       status: "Draft",
       schema_json: JSON.stringify({ fields: [...], routing: [], settings: {} })
     })
   ← { name: "RF-FORM-00001" }

2. User hits Publish
   → reciprocl.api.forms.publish_form("RF-FORM-00001")
   → Internally:
       a. db_set("status", "Published")
       b. Parse schema_json.fields
       c. _create_response_doctype("Job Application", fields)
          → Creates "RF Job Application" with SQL columns for data fields
          → Page Break / Section Break rows added but get no SQL column
       d. db_set("response_doctype", "RF Job Application")
   ← { form_key: "abc123", share_url: "/f/abc123" }

3. Guest submits the public form
   → reciprocl.api.submissions.submit_form("abc123", {
       full_name: "John", email: "j@x.com", years_exp: 3, cover_letter: "..."
     })
   → Internally:
       a. Fetch form by form_key → response_doctype = "RF Job Application"
       b. creation_mode = "Scratch" → scrub keys (label → fieldname)
       c. INSERT into "RF Job Application": { full_name, email, years_exp, cover_letter }
       d. INSERT Reciprocl Submission: { form, response_doctype, response_doc, ... }
       e. _trigger_integrations(form.name, data)  ← if any enabled
   ← { submission_id: "SUB-00001" }
```

---

### Mode 2 — From DocType: Create → Publish → Submit

```
1. User picks "CRM Lead" in builder
   → reciprocl.api.forms.get_doctype_schema("CRM Lead")
   ← [{ fieldname: "lead_name", fieldtype: "Data", label: "Lead Name" }, ...]

2. User selects fields, adds a Page Break, hits Save
   → frappe.client.insert({
       doctype: "Reciprocl Form",
       form_title: "Contact Us",
       creation_mode: "From DocType",
       source_doctype: "CRM Lead",
       response_doctype: "CRM Lead",
       schema_json: JSON.stringify({ fields: [...], routing: [], settings: {} })
     })

3. User hits Publish
   → reciprocl.api.forms.publish_form("RF-FORM-00002")
   → Internally:
       a. db_set("status", "Published")
       b. creation_mode = "From DocType" → skip DocType creation
   ← { form_key: "xyz789", share_url: "/f/xyz789" }

4. Guest submits
   → reciprocl.api.submissions.submit_form("xyz789", {
       lead_name: "Sara", email_id: "s@x.com"
     })
   → Internally:
       a. Fetch form → response_doctype = "CRM Lead"
       b. creation_mode = "From DocType" → fieldnames already match, no scrubbing
       c. INSERT into "CRM Lead": { lead_name: "Sara", email_id: "s@x.com" }
       d. INSERT Reciprocl Submission: { form, response_doctype: "CRM Lead", response_doc: "CRM-LEAD-0001" }
   ← { submission_id: "SUB-00002" }
```

---

### Reusing an Existing RF-* DocType

```
"RF Job Application" already exists from a previous form.
User creates a new "Quick Apply" form → picks "RF Job Application" in Mode 2.

→ frappe.client.insert({
    ...,
    creation_mode: "From DocType",
    source_doctype: "RF Job Application",
    response_doctype: "RF Job Application"
  })

Both "Job Application" and "Quick Apply" write to the same table.
In Submissions view, filter by form_id (Reciprocl Submission.form) to separate them.
```

---

## 9. submit_form Internal Logic

```python
@frappe.whitelist(allow_guest=True)
def submit_form(form_key: str, data: dict):
    form = _get_published_form(form_key)        # fetch Reciprocl Form doc
    response_doctype = form.response_doctype    # "RF Job Application" or "CRM Lead"

    if form.creation_mode == "Scratch":
        clean_data = _scrub_keys(data)          # label-based keys → fieldnames
    else:
        clean_data = data                       # fieldnames already match DocType

    # Write response into the response DocType
    response_doc = frappe.get_doc({"doctype": response_doctype, **clean_data})
    response_doc.insert(ignore_permissions=True)

    # Write submission metadata
    submission = frappe.get_doc({
        "doctype": "Reciprocl Submission",
        "form": form.name,
        "response_doctype": response_doctype,
        "response_doc": response_doc.name,
        "submitted_at": now_datetime(),
        "ip_address": _get_ip(),
        "submitter_email": clean_data.get("email") or clean_data.get("email_id", ""),
        "status": "Pending",
    })
    submission.insert(ignore_permissions=True)

    # Fire integrations
    _trigger_integrations(form.name, clean_data)

    return {"message": "success", "submission_id": submission.name}
```

---

## 10. Everything in One View

```
Reciprocl Form
├── form_title        "Job Application"
├── creation_mode     "Scratch"
├── response_doctype  "RF Job Application"
├── form_key          "abc123"
├── status            "Published"
│
├── schema_json
│   ├── fields[]
│   │   ├── { fieldname, fieldtype, label, reqd, depends_on, placeholder }  ← data fields
│   │   └── { fieldtype: "Page Break", label: "Page title" }                ← layout markers
│   ├── routing[]
│   │   └── { from_page, condition, to_page }   ← branching logic (our custom addition)
│   └── settings{}
│       └── { success_message, success_redirect, show_progress_bar, allow_draft }
│
└── settings_json     { theme, colors, logo }     ← visual branding

RF Job Application (auto-created DocType)
├── full_name        SQL column ✅
├── email            SQL column ✅
├── page_break_1     NO column  (layout only)
├── years_exp        SQL column ✅
└── cover_letter     SQL column ✅

Reciprocl Submission (one row per submission)
├── form             → Reciprocl Form
├── response_doctype "RF Job Application"
├── response_doc     "RF-Job-Application-0001"
├── submitted_at
├── ip_address
├── submitter_email
└── status           Pending / Reviewed / Spam

Reciprocl Form Integration (optional, one per integration)
├── form             → Reciprocl Form
├── target_doctype   "CRM Lead"
├── enabled          1
└── field_mappings[]
    ├── full_name   → lead_name
    └── email       → email_id
```

---

## 11. Scope Summary (Phase 1)

| Area | Status | Notes |
|---|---|---|
| Workspaces + Member Roles | ✅ | CRUD via `frappe.client.*` from React |
| Forms — Mode 1 (Scratch) | ✅ | Custom DocType creation on publish |
| Forms — Mode 2 (From DocType) | ✅ | Reuse existing DocType, no creation step |
| DocType reuse across forms | ✅ | Both `RF *` and native Frappe DocTypes |
| Public form serving (guest) | ✅ | `get_public_form` |
| Public submissions (guest) | ✅ | `submit_form` handles both modes |
| Multi-page forms (Page Break) | ✅ | Native Frappe fieldtype, rendered by React |
| Field-level conditional logic | ✅ | `depends_on` JS string on field |
| Page-level routing | ✅ | `schema_json.routing[]`, handled by React |
| Integrations (auto-create on submit) | ✅ | `Reciprocl Form Integration` DocType |
| Analytics (summary + sparkline) | ✅ | Custom aggregation queries |
| Brand Kit | ⏳ | Deferred |
| Pages | ⏳ | Deferred |
| Automations | ⏳ | Use Frappe Email Alerts natively |
