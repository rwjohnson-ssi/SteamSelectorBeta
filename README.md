# SteamSelector Beta

A public, static test build of the SteamSelector application.

## What is included

- Responsive homepage with product-category cards
- Shared product-category results page
- Shared product-detail page with related-series cards
- Model / series / product-type search
- Guided-selection starting point
- Browser-only quote list with quantity and notes
- One shared category configuration and product-data source

## Public-repository guardrails

This repository is public while the beta is being tested. Do **not** add:

- Customer names, project information, quote history, or contact details
- Vendor net pricing, discount levels, margins, or internal price books
- Login credentials, API keys, or private documents
- Any product data that SSI is not authorized to publish

`products.js` intentionally contains a small public-safe sample catalog and no pricing. Replace it only with product data approved for public use.

## Run locally

Open the repository folder in VS Code, then use the **Live Server** extension to open `index.html`. This is important because the browser needs a local web server for a realistic test environment.

## Deploy on Netlify

The site is ready for a basic static Netlify deployment because `index.html` is in the repository root.

1. In Netlify, choose **Add new project** → **Import an existing project**.
2. Choose GitHub and select `rwjohnson-ssi/SteamSelectorBeta`.
3. Leave the build command empty.
4. Leave the publish directory empty (or use `.` if Netlify requires a value).
5. Select **Deploy site**.

## Project phase

- **Phase A — Deploy static site:** In Progress
- **Phase B — FastAPI + SQLite locally:** Not Started
- **Phase C — Connect frontend to API:** Not Started
- **Phase D — Internal login:** Not Started
- **Phase E — Server-generated PDF:** Not Started
- **Phase F — Deploy backend and domain:** Not Started
- **Phase G — First sizing module:** Not Started
