# Reciprocl Product Plan & Roadmap

## Vision
To build an enterprise-grade, native "No-Code" form builder for the Frappe ecosystem that provides a Typeform-like frontend while leveraging Frappe's robust DocType backend for seamless data storage and integration.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS, running outside the Desk via a standalone SPA interface.
- **Backend Schema Management**: Python Whitelisted APIs handle the creation of a master blueprint (`Reciprocl Form`) which dynamically generates flat Frappe `DocTypes` to act as form response tables.
- **Routing**: `react-router-dom` is used to navigate between the Builder (`/`) and the Public Submission Form (`/:formId`).

---

## Roadmap

### Phase 1: Authentication & User Flow
- [ ] Build custom login/signup pages in React.
- [ ] Implement Session Auth to communicate with Frappe backend securely.
- [ ] Build the User Dashboard to view their created forms.
- [ ] Update form generation logic to assign ownership to the logged-in user.

### Phase 2: Advanced Builder Features
- [ ] Implement robust field types (Dropdowns, Checkboxes, File Uploads).
- [ ] Add Form Customization (Themes, Colors, Cover Images).
- [ ] Implement conditional branching / logic jumps (e.g. "If Question 1 is X, Show Question 2").
- [ ] Add Form Settings (Success message configuration, Expiry dates).

### Phase 3: The "Reciprocl" Integrations
- [ ] Build a Visual Mapping UI in the Builder to map form fields to Frappe Core Apps (HR, CRM, ERP).
- [ ] Implement the backend webhook interceptor that executes the mapped JSON instructions upon submission.
- [ ] Add generic Webhook support for external apps (Zapier).

### Phase 4: Analytics and Admin
- [ ] Build a React dashboard to view forms and quick metrics.
- [ ] Implement Submission List View in React (so users don't need Frappe Desk access).
- [ ] Add CSV export functionalities.

---

## Development Guidelines
- Always prioritize Headless API development.
- Keep the generated Data DocTypes completely flat and simple; all complex logic must reside in the Master `Reciprocl Form` JSON schema.
- Follow modern Frappe App directory structure (delete unused Jinja/HTML templates).
- Use short, unique hash IDs for public form routing (`/:formId`).
