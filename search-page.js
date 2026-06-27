/* Shared catalog search-results controller for SteamSelector Beta. */
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const productApi = window.SteamSelectorProducts;
  if (!core || !productApi) return;

  const form = document.getElementById("searchPageForm");
  const input = document.getElementById("searchPageInput");
  const summary = document.getElementById("searchPageSummary");
  const results = document.getElementById("searchPageResults");
  const products = productApi.getAllProducts();

  if (!form || !input || !summary || !results) return;

  core.renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Search" }]);
  input.value = core.parameters().get("q") || "";

  function render(term) {
    const normalized = String(term || "").trim();

    if (!normalized) {
      summary.textContent = "Enter a model, series, or product type to search the public beta catalog.";
      results.innerHTML = "";
      return;
    }

    const matches = products.filter(function (product) {
      return core.productMatches(product, normalized);
    });

    summary.textContent = matches.length + " matching product" + (matches.length === 1 ? "" : "s") + " for \"" + normalized + "\"";
    results.innerHTML = matches.length
      ? matches.map(function (product) {
          const category = core.getCategory(product.category);
          return "<a class=\"search-result\" href=\"" + core.productUrl(product) + "\">"
            + "<small>" + core.escapeHtml(category ? category.title : "Product") + " · " + core.escapeHtml(product.series) + "</small>"
            + "<strong>" + core.escapeHtml(product.id) + "</strong>"
            + "<span>" + core.escapeHtml(product.summary) + "</span>"
            + "</a>";
        }).join("")
      : "<div class=\"catalog-empty-state\">No matching public beta products were found.</div>";
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const term = input.value.trim();
    const url = new URL(window.location.href);
    if (term) url.searchParams.set("q", term); else url.searchParams.delete("q");
    window.history.replaceState({}, "", url);
    render(term);
  });

  render(input.value);
})();
