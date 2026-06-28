/*
  SteamSelector global-search backend example.

  Runtime: Node 20+, Express, PostgreSQL (pg)
  Install: npm install express pg

  Mount this router in your API server:
    import express from "express";
    import searchSuggestionsRouter from "./server/search-suggestions.example.js";
    const app = express();
    app.use(searchSuggestionsRouter);

  Required database fields shown below are examples. Rename public_catalog_products
  and its columns to match your approved public product database or search view.
  Do not expose pricing, supplier costs, customer data, or internal-only records.
*/
import { Router } from "express";
import { Pool } from "pg";

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const MAX_QUERY_LENGTH = 80;
const MAX_SUGGESTIONS = 7;
const MAX_PRODUCTS = 6;

function cleanQuery(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
}

function cleanCategory(value) {
  const category = String(value || "").trim();
  return /^[a-z0-9-]+$/i.test(category) ? category : "";
}

router.get("/api/search/suggestions", async function (request, response, next) {
  const query = cleanQuery(request.query.q);
  const category = cleanCategory(request.query.category);
  const like = "%" + query + "%";

  if (query.length < 2) {
    response.json({ query: query, category: category || "all", suggestions: [], products: [] });
    return;
  }

  try {
    const productQuery = `
      SELECT
        model_number AS id,
        category_id AS category,
        subcategory,
        series,
        size,
        connection,
        body_material AS material,
        max_operating_pressure AS pmo,
        public_summary AS summary
      FROM public_catalog_products
      WHERE public_visible = TRUE
        AND ($3 = '' OR category_id = $3)
        AND (
          model_number ILIKE $2
          OR COALESCE(series, '') ILIKE $2
          OR COALESCE(subcategory, '') ILIKE $2
          OR COALESCE(public_summary, '') ILIKE $2
          OR COALESCE(search_terms, '') ILIKE $2
        )
      ORDER BY
        CASE
          WHEN LOWER(model_number) = LOWER($1) THEN 1
          WHEN LOWER(model_number) LIKE LOWER($1 || '%') THEN 2
          WHEN LOWER(COALESCE(series, '')) = LOWER($1) THEN 3
          WHEN LOWER(COALESCE(series, '')) LIKE LOWER($1 || '%') THEN 4
          WHEN LOWER(COALESCE(subcategory, '')) LIKE LOWER($1 || '%') THEN 5
          ELSE 9
        END,
        model_number ASC
      LIMIT $4;
    `;

    const suggestionQuery = `
      WITH public_matches AS (
        SELECT model_number, series, subcategory, category_title, public_summary
        FROM public_catalog_products
        WHERE public_visible = TRUE
          AND ($3 = '' OR category_id = $3)
          AND (
            model_number ILIKE $2
            OR COALESCE(series, '') ILIKE $2
            OR COALESCE(subcategory, '') ILIKE $2
            OR COALESCE(category_title, '') ILIKE $2
            OR COALESCE(public_summary, '') ILIKE $2
          )
      ), suggestion_terms AS (
        SELECT model_number AS term, 'Model' AS type FROM public_matches
        UNION
        SELECT series AS term, 'Series' AS type FROM public_matches WHERE COALESCE(series, '') <> ''
        UNION
        SELECT subcategory AS term, 'Product Type' AS type FROM public_matches WHERE COALESCE(subcategory, '') <> ''
        UNION
        SELECT category_title AS term, 'Department' AS type FROM public_matches WHERE COALESCE(category_title, '') <> ''
      )
      SELECT term, MIN(type) AS type
      FROM suggestion_terms
      WHERE term IS NOT NULL AND term <> ''
      GROUP BY term
      ORDER BY
        CASE WHEN LOWER(term) LIKE LOWER($1 || '%') THEN 1 ELSE 2 END,
        term ASC
      LIMIT $4;
    `;

    const parameters = [query, like, category, MAX_PRODUCTS];
    const [productResult, suggestionResult] = await Promise.all([
      pool.query(productQuery, parameters),
      pool.query(suggestionQuery, [query, like, category, MAX_SUGGESTIONS])
    ]);

    response.set("Cache-Control", "private, max-age=30");
    response.json({
      query: query,
      category: category || "all",
      suggestions: suggestionResult.rows.map(function (row) {
        return { term: row.term, type: row.type };
      }),
      products: productResult.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;
