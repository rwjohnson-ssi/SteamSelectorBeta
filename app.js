(function () {
  "use strict";

  const categoryApi = window.SteamSelectorCategories;
  const productApi = window.SteamSelectorProducts;
  if (!categoryApi || !productApi) return;

  const QUOTE_KEY = "steamselector_beta_quote";
  const products = productApi.getAllProducts();

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function currentFile() {
    const file = window.location.pathname.split("/").pop();
    return file || "index.html";
  }

  function parameters() {
    return new URLSearchParams(window.location.search);
  }

  function categoryName(categoryId) {
    const category = categoryApi.getCategoryById(categoryId);
    return category ? category.title : "Products";
  }

  function productUrl(product) {
    return "product.html?model=" + encodeURIComponent(product.id);
  }

  function categoryUrl(categoryId, subcategory) {
    return categoryApi.getCategoryHref(categoryId, subcategory);
  }

  function productMatches(product, term) {
    const haystack = [product.id, product.series, product.category, product.subcategory, product.size, product.connection, product.material, product.summary, product.description]
      .join(" ")
      .toLowerCase();
    return haystack.includes(String(term || "").trim().toLowerCase());
  }

  function loadQuote() {
    try {
      const quote = JSON.parse(localStorage.getItem(QUOTE_KEY) || "[]");
      return Array.isArray(quote) ? quote : [];
    } catch (error) {
      return [];
    }
  }

  function saveQuote(quote) {
    localStorage.setItem(QUOTE_KEY, JSON.stringify(quote));
    if (window.SteamSelectorQuoteBadge) window.SteamSelectorQuoteBadge.update();
  }

  function addToQuote(product, quantity) {
    const quote = loadQuote();
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    const existing = quote.find(function (item) { return item.id === product.id; });
    if (existing) {
      existing.qty = Math.max(1, Number(existing.qty || 1) + qty);
    } else {
      quote.push({ id: product.id, qty: qty, notes: "" });
    }
    saveQuote(quote);
  }

  function renderBreadcrumbs(items) {
    const element = document.getElementById("breadcrumbs");
    if (!element) return;
    element.innerHTML = items.map(function (item, index) {
      const last = index === items.length - 1;
      return last ? "<span>" + escapeHtml(item.label) + "</span>" : "<a href=\"" + escapeHtml(item.href) + "\">" + escapeHtml(item.label) + "</a><span aria-hidden=\"true\">/</span>";
    }).join("");
  }

  function categoryCard(category) {
    const count = products.filter(function (product) { return product.category === category.id; }).length;
    return "<a class=\"category-card\" href=\"" + categoryUrl(category.id) + "\">"
      + "<span class=\"category-icon\">" + escapeHtml(category.icon) + "</span>"
      + "<span class=\"category-card-copy\"><strong>" + escapeHtml(category.title) + "</strong><span>" + escapeHtml(category.description) + "</span><small>" + count + " beta product" + (count === 1 ? "" : "s") + "</small></span>"
      + "<span class=\"category-arrow\">›</span></a>";
  }

  function renderHome() {
    const grid = document.getElementById("categoryCardGrid");
    if (grid) grid.innerHTML = categoryApi.getAllCategories().map(categoryCard).join("");

    const form = document.getElementById("modelSearchForm");
    const input = document.getElementById("modelSearchInput");
    const results = document.getElementById("modelSearchResults");
    if (!form || !input || !results) return;

    function showResults() {
      const term = input.value.trim();
      if (!term) {
        results.hidden = true;
        results.innerHTML = "";
        return;
      }
      const matches = products.filter(function (product) { return productMatches(product, term); }).slice(0, 6);
      results.hidden = false;
      results.innerHTML = matches.length
        ? matches.map(function (product) {
            return "<a class=\"model-result\" href=\"" + productUrl(product) + "\"><strong>" + escapeHtml(product.id) + "</strong><span>" + escapeHtml(product.series) + " · " + escapeHtml(product.size) + " · " + escapeHtml(product.connection) + "</span></a>";
          }).join("")
        : "<p class=\"model-result-empty\">No matching beta models found. Try a product type or series name.</p>";
    }

    input.addEventListener("input", showResults);
    input.addEventListener("focus", showResults);
    document.addEventListener("click", function (event) {
      if (!event.target.closest(".model-search-section")) results.hidden = true;
    });
    form.addEventListener("submit", function () {
      if (!input.value.trim()) return;
    });
  }

  function renderCategory() {
    const query = parameters();
    const categoryId = query.get("id") || "steam-traps";
    const selectedSubcategory = query.get("type") || "all";
    const category = categoryApi.getCategoryById(categoryId) || categoryApi.getCategoryById("steam-traps");
    const title = document.getElementById("categoryTitle");
    const description = document.getElementById("categoryDescription");
    const filters = document.getElementById("subcategoryFilters");
    const search = document.getElementById("categorySearchInput");
    const count = document.getElementById("categoryResultCount");
    const body = document.getElementById("catalogTableBody");
    const empty = document.getElementById("categoryEmptyState");

    document.title = category.title + " | SteamSelector Beta";
    if (title) title.textContent = category.title;
    if (description) description.textContent = category.description;
    renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: category.title }]);

    const allFilter = [{ id: "all", title: "All " + category.title }].concat(category.children.filter(function (child) { return child.id !== "all"; }));
    filters.innerHTML = allFilter.map(function (filter) {
      const active = filter.id === selectedSubcategory ? " is-active" : "";
      return "<a class=\"filter-pill" + active + "\" href=\"" + categoryUrl(category.id, filter.id) + "\">" + escapeHtml(filter.title) + "</a>";
    }).join("");

    function redraw() {
      const term = search ? search.value.trim() : "";
      const matches = products.filter(function (product) {
        const subcategoryMatch = selectedSubcategory === "all" || product.subcategory === selectedSubcategory;
        return product.category === category.id && subcategoryMatch && productMatches(product, term);
      });
      body.innerHTML = matches.map(function (product) {
        return "<tr><td><a class=\"table-model\" href=\"" + productUrl(product) + "\">" + escapeHtml(product.id) + "</a><span class=\"mobile-table-summary\">" + escapeHtml(product.summary) + "</span></td><td>" + escapeHtml(product.series) + "</td><td>" + escapeHtml(product.size) + "</td><td>" + escapeHtml(product.connection) + "</td><td>" + escapeHtml(product.material) + "</td><td><a class=\"text-link\" href=\"" + productUrl(product) + "\">View</a></td></tr>";
      }).join("");
      count.textContent = matches.length + " matching product" + (matches.length === 1 ? "" : "s");
      empty.hidden = matches.length > 0;
    }
    if (search) search.addEventListener("input", redraw);
    redraw();
  }

  function specsGrid(product) {
    return Object.keys(product.specs || {}).map(function (key) {
      return "<div class=\"spec-item\"><span>" + escapeHtml(key) + "</span><strong>" + escapeHtml(product.specs[key]) + "</strong></div>";
    }).join("");
  }

  function renderProduct() {
    const model = parameters().get("model");
    const product = productApi.getProductById(model);
    const detail = document.getElementById("productDetail");
    const related = document.getElementById("relatedProducts");
    if (!detail || !related) return;
    if (!product) {
      renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Product Not Found" }]);
      detail.innerHTML = "<section class=\"empty-state\"><h1>Product not found</h1><p>That model is not in the public beta catalog.</p><a class=\"btn btn-primary\" href=\"index.html\">Back to Home</a></section>";
      return;
    }

    const category = categoryApi.getCategoryById(product.category);
    document.title = product.id + " | SteamSelector Beta";
    renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: category.title, href: categoryUrl(category.id) }, { label: product.id }]);
    detail.innerHTML = "<section class=\"product-detail-grid\"><div class=\"product-visual\"><span>" + escapeHtml(category.icon) + "</span><small>Public beta catalog item</small></div><div class=\"product-content\"><p class=\"eyebrow\">" + escapeHtml(category.title) + " · " + escapeHtml(product.series) + "</p><h1>" + escapeHtml(product.id) + "</h1><p class=\"product-summary\">" + escapeHtml(product.summary) + "</p><p>" + escapeHtml(product.description) + "</p><div class=\"spec-grid\">" + specsGrid(product) + "</div><div class=\"product-actions\"><label>Qty <input id=\"productQty\" type=\"number\" min=\"1\" value=\"1\" /></label><button class=\"btn btn-primary\" id=\"addProductButton\" type=\"button\">Add to Quote</button><a class=\"btn btn-secondary\" href=\"quote.html\">View Quote</a></div><p id=\"productStatus\" class=\"status-message\" role=\"status\"></p></div></section>";

    document.getElementById("addProductButton").addEventListener("click", function () {
      addToQuote(product, document.getElementById("productQty").value);
      document.getElementById("productStatus").textContent = product.id + " was added to your quote list.";
    });

    const relatedItems = products.filter(function (item) { return item.series === product.series && item.id !== product.id; }).slice(0, 3);
    related.innerHTML = relatedItems.length ? relatedItems.map(function (item) {
      return "<a class=\"related-product-card\" href=\"" + productUrl(item) + "\"><strong>" + escapeHtml(item.id) + "</strong><span>" + escapeHtml(item.summary) + "</span><small>View product ›</small></a>";
    }).join("") : "<p class=\"muted\">No related beta products are available for this series yet.</p>";
  }

  function renderQuote() {
    renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Quote List" }]);
    const list = document.getElementById("quoteList");
    const empty = document.getElementById("quoteEmptyState");
    const actions = document.getElementById("quoteActions");
    const message = document.getElementById("quoteMessage");
    if (!list || !empty || !actions) return;

    function redraw() {
      const quote = loadQuote();
      empty.hidden = quote.length > 0;
      actions.hidden = quote.length === 0;
      list.innerHTML = quote.map(function (item) {
        const product = productApi.getProductById(item.id);
        if (!product) return "";
        return "<article class=\"quote-item\" data-quote-id=\"" + escapeHtml(product.id) + "\"><div><a href=\"" + productUrl(product) + "\"><strong>" + escapeHtml(product.id) + "</strong></a><p>" + escapeHtml(product.summary) + "</p><span>" + escapeHtml(product.series) + " · " + escapeHtml(product.size) + " · " + escapeHtml(product.connection) + "</span></div><label>Qty <input type=\"number\" min=\"1\" data-quote-qty value=\"" + Math.max(1, Number(item.qty) || 1) + "\" /></label><label class=\"quote-notes\">Notes <input type=\"text\" data-quote-notes placeholder=\"Optional notes\" value=\"" + escapeHtml(item.notes || "") + "\" /></label><button class=\"text-button\" type=\"button\" data-remove-quote>Remove</button></article>";
      }).join("");
    }

    list.addEventListener("change", function (event) {
      const row = event.target.closest("[data-quote-id]");
      if (!row) return;
      const quote = loadQuote();
      const item = quote.find(function (entry) { return entry.id === row.dataset.quoteId; });
      if (!item) return;
      if (event.target.matches("[data-quote-qty]")) item.qty = Math.max(1, Math.floor(Number(event.target.value) || 1));
      if (event.target.matches("[data-quote-notes]")) item.notes = event.target.value.trim();
      saveQuote(quote);
      redraw();
    });

    list.addEventListener("click", function (event) {
      const button = event.target.closest("[data-remove-quote]");
      if (!button) return;
      const id = button.closest("[data-quote-id]").dataset.quoteId;
      saveQuote(loadQuote().filter(function (item) { return item.id !== id; }));
      redraw();
    });

    document.getElementById("clearQuoteButton").addEventListener("click", function () {
      saveQuote([]);
      message.textContent = "Your quote list was cleared.";
      redraw();
    });

    document.getElementById("copyQuoteButton").addEventListener("click", function () {
      const lines = loadQuote().map(function (item) {
        const product = productApi.getProductById(item.id);
        return (item.qty || 1) + " ea - " + item.id + " - " + (product ? product.summary : "") + (item.notes ? " | Notes: " + item.notes : "");
      });
      const text = "SteamSelector Beta Quote List\n\n" + lines.join("\n");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { message.textContent = "Quote list copied to your clipboard."; }).catch(function () { message.textContent = "Unable to copy automatically. Please select and copy the list manually."; });
      } else {
        message.textContent = text;
      }
    });

    redraw();
  }

  function renderGuidedSelection() {
    renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Guided Selection" }]);
    const form = document.getElementById("guidedSelectionForm");
    const select = document.getElementById("guidedCategory");
    const recommendation = document.getElementById("guidedRecommendation");
    if (!form || !select || !recommendation) return;
    select.innerHTML = "<option value=\"\">Choose a product category</option>" + categoryApi.getAllCategories().map(function (category) { return "<option value=\"" + category.id + "\">" + escapeHtml(category.title) + "</option>"; }).join("");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const category = categoryApi.getCategoryById(select.value);
      if (!category) return;
      recommendation.hidden = false;
      recommendation.innerHTML = "<div class=\"card\"><p class=\"eyebrow\">Suggested Starting Point</p><h2>" + escapeHtml(category.title) + "</h2><p>" + escapeHtml(category.description) + "</p><a class=\"btn btn-primary\" href=\"" + categoryUrl(category.id) + "\">Browse " + escapeHtml(category.title) + "</a></div>";
    });
  }

  function renderSearchPage() {
    renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Search" }]);
    const input = document.getElementById("searchPageInput");
    const form = document.getElementById("searchPageForm");
    const summary = document.getElementById("searchPageSummary");
    const results = document.getElementById("searchPageResults");
    if (!input || !form || !summary || !results) return;
    const initial = parameters().get("q") || "";
    input.value = initial;

    function redraw(term) {
      const matches = term ? products.filter(function (product) { return productMatches(product, term); }) : [];
      summary.textContent = term ? matches.length + " matching product" + (matches.length === 1 ? "" : "s") + " for \"" + term + "\"" : "Enter a model, series, or product type to search the public beta catalog.";
      results.innerHTML = matches.map(function (product) {
        return "<a class=\"search-result-card\" href=\"" + productUrl(product) + "\"><span class=\"result-category\">" + escapeHtml(categoryName(product.category)) + "</span><strong>" + escapeHtml(product.id) + "</strong><span>" + escapeHtml(product.summary) + "</span><small>" + escapeHtml(product.series) + " · " + escapeHtml(product.size) + " · " + escapeHtml(product.connection) + "</small></a>";
      }).join("") || (term ? "<p class=\"empty-state\">No matching public beta products were found.</p>" : "");
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const term = input.value.trim();
      const url = new URL(window.location.href);
      if (term) url.searchParams.set("q", term); else url.searchParams.delete("q");
      window.history.replaceState({}, "", url);
      redraw(term);
    });
    redraw(initial);
  }

  const file = currentFile();
  if (file === "index.html") renderHome();
  if (file === "category.html") renderCategory();
  if (file === "product.html") renderProduct();
  if (file === "quote.html") renderQuote();
  if (file === "guided-selection.html") renderGuidedSelection();
  if (file === "search.html") renderSearchPage();
})();
