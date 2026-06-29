# SteamSelector Beta

A public, static test build of the SteamSelector application.

## Current structure

The beta uses one shared catalog system for every product category. Steam Traps, Pumps, Regulators, Control Valves, and future categories all use the same category page, filter panel, Table/List switcher, product thumbnail position, Quick View popup, quote workflow, and mobile layout.

```text
index.html                  Homepage only
category.html               One shared product-selection page
product.html                One shared product-detail page
quote.html                  One shared quote-list page
guided-selection.html       Guided-selection starting page
search.html                 Shared catalog search page

categories.js               Category names, links, subcategory labels, descriptions
products.js                 Public-safe beta product records
catalog-config.js           Shared filters, table columns, labels, page defaults
catalog-core.js             Shared URLs, search matching, product visuals, quote storage, breadcrumbs
catalog-page.js             One controller for every product category
product-page.js             One controller for every product detail page
quote-page.js               One controller for the quote list
guided-selection-page.js    Guided-selection controller
search-page.js              Search-results controller
site-header.js              Shared site header and quote badge
catalog-layout.css          Shared industrial layout for all non-home pages

app.js                      Homepage controller only
industrial-home.css          Homepage-only industrial design
```

## Update once rule

| Change you want to make | Update this file |
|---|---|
| Add/edit a product category, category description, or subcategory label | `categories.js` |
| Add/edit public beta products | `products.js` |
| Change shared table columns, filter order, labels, or default table/list view | `catalog-config.js` |
| Change shared Quick View behavior, quote storage, product thumbnails, URL rules, or search matching | `catalog-core.js` |
| Change all category-page filters, table rows, cards, pagination, and Quick View wiring | `catalog-page.js` |
| Change the shared catalog/mobile/product/quote styling | `catalog-layout.css` |
| Change the homepage only | `index.html`, `app.js`, or `industrial-home.css` |

## What is included

- Industrial & Bold homepage design
- Responsive shared product-category results page
- Private-site-style filter sidebar and results toolbar
- Table View default with List View option
- Quick View in the first table column with product visual immediately beside it
- Shared product detail page with related products
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
4. Leave the publish directory empty, or use `.` if Netlify requires a value.
5. Select **Deploy site**.

## GitHub Pages

The public beta publishes from the `main` branch and repository root. A new commit to `main` triggers a fresh GitHub Pages deployment.

## Project phase

- **Phase A — Deploy static site:** In Progress
- **Phase B — FastAPI + SQLite locally:** Not Started
- **Phase C — Connect frontend to API:** Not Started
- **Phase D — Internal login:** Not Started
- **Phase E — Server-generated PDF:** Not Started
- **Phase F — Deploy backend and domain:** Not Started
- **Phase G — First sizing module:** Not Started
