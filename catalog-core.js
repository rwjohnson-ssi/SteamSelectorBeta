/*
  SteamSelector Beta shared core.
  Keep cross-page helpers, URL builders, product matching, product visual fallback,
  breadcrumbs, and browser-only quote storage in this one place.
*/
(function () {
  "use strict";

  const QUOTE_KEY = "steamselector_beta_quote";

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function currentFile() {
    const file = window.location.pathname.split("/").pop();
    return file || "index.html";
  }

  function parameters() {
    return new URLSearchParams(window.location.search);
  }

  function getCategory(categoryId) {
    if (!window.SteamSelectorCategories) return null;
    return window.SteamSelectorCategories.getCategoryById(categoryId);
  }

  function getProduct(productId) {
    if (!window.SteamSelectorProducts) return null;
    return window.SteamSelectorProducts.getProductById(productId);
  }

  function categoryUrl(categoryId, subcategoryId) {
    if (!window.SteamSelectorCategories) return "category.html";
    return window.SteamSelectorCategories.getCategoryHref(categoryId, subcategoryId);
  }

  function productUrl(product) {
    const productId = typeof product === "string" ? product : product && product.id;
    return "product.html?model=" + encodeURIComponent(productId || "");
  }

  function productMatches(product, term) {
    const normalizedTerm = String(term || "").trim().toLowerCase();
    if (!normalizedTerm) return true;

    const haystack = [
      product.id,
      product.series,
      product.category,
      product.subcategory,
      product.size,
      product.connection,
      product.material,
      product.pmo,
      product.summary,
      product.description,
      Object.keys(product.specs || {}).join(" "),
      Object.keys(product.specs || {}).map(function (key) { return product.specs[key]; }).join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedTerm);
  }

  function uniqueValues(products, key) {
    const seen = new Set();

    return products
      .map(function (product) { return String(product[key] || "").trim(); })
      .filter(Boolean)
      .filter(function (value) {
        const token = value.toLowerCase();
        if (seen.has(token)) return false;
        seen.add(token);
        return true;
      })
      .sort(function (left, right) {
        return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
      });
  }

  function renderProductVisual(product, category, className) {
    const safeClass = className || "product-thumb";
    const image = String(product && product.image ? product.image : "").trim();
    const categoryIcon = category && category.icon ? category.icon : "SS";
    const label = product && (product.series || product.id) ? product.series || product.id : "Product";

    if (image) {
      return "<div class=\"" + safeClass + "\"><img src=\"" + escapeHtml(image) + "\" alt=\"" + escapeHtml(product.id || "Product") + "\" loading=\"lazy\" /></div>";
    }

    return "<div class=\"" + safeClass + " product-visual-fallback\" aria-label=\"" + escapeHtml(product.id || "Product") + "\">"
      + "<span class=\"product-visual-icon\">" + escapeHtml(categoryIcon) + "</span>"
      + "<small>" + escapeHtml(label) + "</small>"
      + "</div>";
  }

  function renderBreadcrumbs(items) {
    const element = document.getElementById("breadcrumbs");
    if (!element) return;

    element.innerHTML = items
      .map(function (item, index) {
        const isLast = index === items.length - 1;
        if (isLast || !item.href) return "<span>" + escapeHtml(item.label) + "</span>";
        return "<a href=\"" + escapeHtml(item.href) + "\">" + escapeHtml(item.label) + "</a><span aria-hidden=\"true\">›</span>";
      })
      .join("");
  }

  function loadQuote() {
    try {
      const items = JSON.parse(localStorage.getItem(QUOTE_KEY) || "[]");
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
  }

  function notifyQuoteUpdated() {
    window.dispatchEvent(new CustomEvent("steamselector:quote-updated"));
  }

  function saveQuote(items) {
    const safeItems = Array.isArray(items) ? items : [];
    localStorage.setItem(QUOTE_KEY, JSON.stringify(safeItems));
    notifyQuoteUpdated();
  }

  function safeQuantity(value) {
    return Math.max(1, Math.floor(Number(value) || 1));
  }

  function addToQuote(product, quantity) {
    if (!product || !product.id) return;

    const items = loadQuote();
    const existing = items.find(function (item) { return item.id === product.id; });
    const qty = safeQuantity(quantity);

    if (existing) {
      existing.qty = safeQuantity(existing.qty + qty);
    } else {
      items.push({ id: product.id, qty: qty, notes: "" });
    }

    saveQuote(items);
  }

  function updateQuoteItem(productId, changes) {
    const items = loadQuote();
    const item = items.find(function (entry) { return entry.id === productId; });
    if (!item) return;

    if (Object.prototype.hasOwnProperty.call(changes, "qty")) item.qty = safeQuantity(changes.qty);
    if (Object.prototype.hasOwnProperty.call(changes, "notes")) item.notes = String(changes.notes || "").trim();
    saveQuote(items);
  }

  function removeFromQuote(productId) {
    saveQuote(loadQuote().filter(function (item) { return item.id !== productId; }));
  }

  function clearQuote() {
    saveQuote([]);
  }

  function quoteCount() {
    return loadQuote().reduce(function (total, item) {
      return total + safeQuantity(item.qty);
    }, 0);
  }

  window.SteamSelectorCore = {
    currentFile: currentFile,
    parameters: parameters,
    getCategory: getCategory,
    getProduct: getProduct,
    categoryUrl: categoryUrl,
    productUrl: productUrl,
    productMatches: productMatches,
    uniqueValues: uniqueValues,
    escapeHtml: escapeHtml,
    renderProductVisual: renderProductVisual,
    renderBreadcrumbs: renderBreadcrumbs,
    quote: {
      load: loadQuote,
      save: saveQuote,
      add: addToQuote,
      update: updateQuoteItem,
      remove: removeFromQuote,
      clear: clearQuote,
      count: quoteCount,
      safeQuantity: safeQuantity
    }
  };
})();
