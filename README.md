# Reciprocl

**Reciprocl** is a modern, headless Form Builder built natively for the Frappe Framework. 

It provides a beautiful React-based drag-and-drop interface for users to build forms. When a form is published, Reciprocl dynamically generates a native Frappe `DocType` and fully functional REST APIs to handle submissions, effectively giving you Typeform-like capabilities directly integrated with your Frappe database.

## Architecture

Reciprocl uses a two-tier architecture:
1. **The Blueprint (Reciprocl Form):** A master DocType that stores form metadata, branching logic, and integration mappings as a JSON schema.
2. **The Data Store (Auto-generated DocTypes):** When a form is published, a flat, dedicated DocType (e.g. `Form Contact`) is generated dynamically purely for fast, native data storage and retrieval.

## Installation

You can install Reciprocl like any standard Frappe app.

```bash
# Get the app
bench get-app https://github.com/AdnanQuazi/reciprocl

# Install on your site
bench --site [your-site-name] install-app reciprocl
```

## Development

Reciprocl uses Vite and React for the frontend interface.

### Running the Backend
Start your Frappe bench as usual:
```bash
bench start
```

### Running the Frontend
In a separate terminal, navigate to the frontend directory and run the Vite dev server:
```bash
cd apps/reciprocl/frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` and automatically proxy API requests to your Frappe backend.

## License

MIT
