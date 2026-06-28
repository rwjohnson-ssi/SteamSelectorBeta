/* Shared catalog search-results controller for SteamSelector Beta. */
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const productApi = window.SteamSelectorProducts;
  const categoryApi = window.SteamSelectorCategories;
  if (!core || !productApi || !categoryApi) return;

  const form = document.getElementById("searchPageForm");
  const input = document.getElementById("searchPageInput");
  const summary = document.getElementById("searchPageSummary");
  const results = document.getElementById("searchPageResults");
  const products = productApi.getAllProducts();
  const parameters = core.parameters();
  const requestedCategory = parameters.get("category") || "all";
  const selectedCategory = requestedCategory === "all" ? null : categoryApi.getCategoryById(requestedCategory);

  if (!form || !input || !summary || !results) return;

  core.renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Search" }]);
  input.value = parameters.get("q") || "";

  function categoryLabel(product) {
    const category = core.getCategory(product.category);
    return category ? category.title : "Product";
  }

  function render(term) {
    const normalized = String(term || "").trim();
    const scopedProducts = selectedCategory
      ? products.filter(function (product) { return product.category === selectedCategory.id; })
      : products;
    const scopeDescription = selectedCategory ? " in " + selectedCategory.title : "";

    if (!normalized) {
      summary.textContent = "Enter a model, series, or product type to search" + scopeDescription + ".";
      results.innerHTML = "";
      return;
    }

    const matches = scopedProducts.filter(function (product) {
      return core.productMatches(product, normalized);
    });

    summary.textContent = matches.length + " matching product" + (matches.length === 1 ? "" : "s") + " for \"" + normalized + "\"" + scopeDescription;
    results.innerHTML = matches.length
      ? matches.map(function (product) {
          return "<a class=\"search-result\" href=\"" + core.productUrl(product) + "\">"
            + "<small>" + core.escapeHtml(categoryLabel(product)) + " · " + core.escapeHtml(product.series) + "</small>"
            + "<strong>" + core.escapeHtml(product.id) + "</strong>"
            + "<span>" + core.escapeHtml(product.summary) + "</span>"
            + "</a>";
        }).join("")
      : "<div class=\"catalog-empty-state\">No matching public beta products were found" + (selectedCategory ? " in " + core.escapeHtml(selectedCategory.title) : "") + ".</div>";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const term = input.value.trim();
    const url = new URL(window.location.href);
    if (term) url.searchParams.set("q", term); else url.searchParams.delete("q");
    if (selectedCategory) url.searchParams.set("category", selectedCategory.id); else url.searchParams.delete("category");
    window.history.replaceState({}, "", url);
    render(term);
  });

  render(input.value);
})();
