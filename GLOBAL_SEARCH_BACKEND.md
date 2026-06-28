# SteamSelector Global Search Backend

The frontend works now with the public-safe sample catalog in `products.js`.
GitHub Pages is static hosting, so it cannot run `server/search-suggestions.example.js` directly.

## When the product database is ready

1. Deploy the Node/Express route in `server/search-suggestions.example.js` to your API host.
2. Point it at an approved public-product view or table. The example expects a `public_catalog_products` source and deliberately excludes internal-only fields.
3. Set `DATABASE_URL` in the API host's secret/environment settings.
4. In `global-search-config.js`, change:

```js
apiEndpoint: ""
```

to the deployed route, such as:

```js
apiEndpoint: "https://api.yourdomain.com/api/search/suggestions"
```

## Expected API response

```json
{
  "query": "ball valve",
  "category": "control-valves",
  "suggestions": [
    { "term": "Automated Ball Valve", "type": "Product Type" },
    { "term": "SVF", "type": "Series" }
  ],
  "products": [
    {
      "id": "SVF-150-1",
      "category": "control-valves",
      "subcategory": "automated-ball-valve",
      "series": "SVF",
      "size": "1 in.",
      "connection": "NPT",
      "material": "Stainless Steel",
      "pmo": "150 PSIG",
      "summary": "Automated ball valve for on/off process isolation."
    }
  ]
}
```

The frontend automatically falls back to `products.js` if the API is blank, unavailable, slow, or returns an error.
