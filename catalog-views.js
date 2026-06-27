/*
  Shared category result controls for SteamSelector Beta.
  This file is used by the one reusable category.html page, so list view,
  table view, and Quick View stay consistent across every product category.
*/
(function () {
  "use strict";

  if (!window.SteamSelectorCategories || !window.SteamSelectorProducts) return;
  if ((window.location.pathname.split("/").pop() || "category.html") !== "category.html") return;

  const categoryApi = window.SteamSelectorCategories;
  const productApi = window.SteamSelectorProducts;
  const products = productApi.getAllProducts();
  const query = new URLSearchParams(window.location.search);
  const categoryId = query.get("id") || "steam-traps";
  const selectedSubcategory = query.get("type") || "all";
  const category = categoryApi.getCategoryById(categoryId) || categoryApi.getCategoryById("steam-traps");

  const searchInput = document.getElementById("categorySearchInput");
  const resultCount = document.getElementById("categoryResultCount");
  const resultsRoot = document.getElementById("catalogResults");
  const listRoot = document.getElementById("catalogList");
  const tableBody = document.getElementById("catalogTableBody");
  const emptyState = document.getElementById("categoryEmptyState");
  const viewButtons = Array.from(document.querySelectorAll("[data-catalog-view]"));
  const modal = document.getElementById("quickViewModal");
  const modalContent = document.getElementById("quickViewContent");

  if (!searchInput || !resultCount || !resultsRoot || !listRoot || !tableBody || !emptyState || !modal || !modalContent) return;

  let lastFocusedElement = null;

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

  function productUrl(product) {
    return "product.html?model=" + encodeURIComponent(product.id);
  }

  function productMatches(product, term) {
    const haystack = [
      product.id,
      product.series,
      product.category,
      product.subcategory,
      product.size,
      product.connection,
      product.material,
      product.summary,
      product.description
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(String(term || "").trim().toLowerCase());
  }

  function getMatchingProducts() {
    const term = searchInput.value.trim();

    return products.filter(function (product) {
      const categoryMatches = product.category === category.id;
      const subcategoryMatches = selectedSubcategory === "all" || product.subcategory === selectedSubcategory;
      return categoryMatches && subcategoryMatches && productMatches(product, term);
    });
  }

  function quickViewButton(product, compact) {
    const label = "Quick view for " + product.id;
    const className = compact ? "quick-view-button quick-view-button-compact" : "quick-view-button";

    return "<button class=\"" + className + "\" type=\"button\" data-quick-view=\"" + escapeHtml(product.id) + "\" aria-label=\"" + escapeHtml(label) + "\">"
      + "<span class=\"quick-view-icon\" aria-hidden=\"true\">◉</span>"
      + "<span class=\"quick-view-label\">Quick View</span>"
      + "</button>";
  }

  function renderList(productsToRender) {
    listRoot.innerHTML = productsToRender.map(function (product) {
      return "<article class=\"catalog-list-item\">"
        + quickViewButton(product, true)
        + "<div class=\"catalog-list-copy\">"
        + "<div class=\"catalog-list-heading\"><a href=\"" + productUrl(product) + "\">" + escapeHtml(product.id) + "</a><span>" + escapeHtml(product.series) + "</span></div>"
        + "<p>" + escapeHtml(product.summary) + "</p>"
        + "<div class=\"catalog-list-meta\"><span>" + escapeHtml(product.size) + "</span><span>" + escapeHtml(product.connection) + "</span><span>" + escapeHtml(product.material) + "</span></div>"
        + "</div>"
        + "<a class=\"catalog-product-link\" href=\"" + productUrl(product) + "\">Product Details <span aria-hidden=\"true\">›</span></a>"
        + "</article>";
    }).join("");
  }

  function renderTable(productsToRender) {
    tableBody.innerHTML = productsToRender.map(function (product) {
      return "<tr>"
        + "<td class=\"quick-view-cell\">" + quickViewButton(product, false) + "</td>"
        + "<td><a class=\"table-model\" href=\"" + productUrl(product) + "\">" + escapeHtml(product.id) + "</a><span class=\"mobile-table-summary\">" + escapeHtml(product.summary) + "</span></td>"
        + "<td>" + escapeHtml(product.series) + "</td>"
        + "<td>" + escapeHtml(product.size) + "</td>"
        + "<td>" + escapeHtml(product.connection) + "</td>"
        + "<td>" + escapeHtml(product.material) + "</td>"
        + "<td><a class=\"text-link\" href=\"" + productUrl(product) + "\">Details</a></td>"
        + "</tr>";
    }).join("");
  }

  function refreshResults() {
    const matches = getMatchingProducts();
    renderList(matches);
    renderTable(matches);
    resultCount.textContent = matches.length + " matching product" + (matches.length === 1 ? "" : "s");
    emptyState.hidden = matches.length > 0;
  }

  function setView(view) {
    const nextView = view === "table" ? "table" : "list";
    resultsRoot.dataset.view = nextView;

    viewButtons.forEach(function (button) {
      const isActive = button.getAttribute("data-catalog-view") === nextView;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderSpecs(product) {
    return Object.keys(product.specs || {}).map(function (key) {
      return "<div class=\"quick-view-spec\"><span>" + escapeHtml(key) + "</span><strong>" + escapeHtml(product.specs[key]) + "</strong></div>";
    }).join("");
  }

  function openQuickView(productId, trigger) {
    const product = productApi.getProductById(productId);
    if (!product) return;

    lastFocusedElement = trigger || document.activeElement;

    modalContent.innerHTML = "<div class=\"quick-view-product\">"
      + "<div class=\"quick-view-product-visual\"><span>" + escapeHtml(category.icon) + "</span><small>" + escapeHtml(category.title) + "</small></div>"
      + "<div class=\"quick-view-product-copy\">"
      + "<p class=\"eyebrow\">" + escapeHtml(category.title) + " · " + escapeHtml(product.series) + "</p>"
      + "<h2 id=\"quickViewTitle\">" + escapeHtml(product.id) + "</h2>"
      + "<p class=\"quick-view-summary\">" + escapeHtml(product.summary) + "</p>"
      + "<p class=\"quick-view-description\">" + escapeHtml(product.description) + "</p>"
      + "<div class=\"quick-view-spec-grid\">" + renderSpecs(product) + "</div>"
      + "<div class=\"quick-view-actions\">"
      + "<button class=\"btn btn-secondary\" type=\"button\" data-quick-view-close>Close</button>"
      + "<a class=\"btn btn-primary\" href=\"" + productUrl(product) + "\">View Full Product Page <span aria-hidden=\"true\">→</span></a>"
      + "</div>"
      + "</div>"
      + "</div>";

    modal.hidden = false;
    document.body.classList.add("quick-view-open");

    const closeButton = modal.querySelector(".quick-view-close");
    if (closeButton) closeButton.focus();
  }

  function closeQuickView() {
    if (modal.hidden) return;

    modal.hidden = true;
    modalContent.innerHTML = "";
    document.body.classList.remove("quick-view-open");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  viewButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setView(button.getAttribute("data-catalog-view"));
    });
  });

  searchInput.addEventListener("input", refreshResults);

  document.addEventListener("click", function (event) {
    const quickViewTrigger = event.target.closest("[data-quick-view]");
    if (quickViewTrigger) {
      openQuickView(quickViewTrigger.getAttribute("data-quick-view"), quickViewTrigger);
      return;
    }

    if (event.target.closest("[data-quick-view-close]")) {
      closeQuickView();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeQuickView();
  });

  setView("table");
  refreshResults();
})();
