/*
  SteamSelector Beta homepage controller only.
  Other pages use their own focused shared controllers.
*/
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const categoryApi = window.SteamSelectorCategories;
  const productApi = window.SteamSelectorProducts;

  if (!core || !categoryApi || !productApi) return;
  if (core.currentFile() !== "index.html") return;

  const products = productApi.getAllProducts();
  const categoryGrid = document.getElementById("categoryCardGrid");
  const form = document.getElementById("modelSearchForm");
  const input = document.getElementById("modelSearchInput");
  const results = document.getElementById("modelSearchResults");

  function categoryCard(category) {
    const count = products.filter(function (product) { return product.category === category.id; }).length;

    return "<a class=\"category-card\" href=\"" + core.categoryUrl(category.id) + "\">"
      + "<span class=\"category-icon\">" + core.escapeHtml(category.icon) + "</span>"
      + "<span class=\"category-card-copy\"><strong>" + core.escapeHtml(category.title) + "</strong><span>" + core.escapeHtml(category.description) + "</span><small>" + count + " beta product" + (count === 1 ? "" : "s") + "</small></span>"
      + "<span class=\"category-arrow\">›</span>"
      + "</a>";
  }

  function renderCategories() {
    if (!categoryGrid) return;
    categoryGrid.innerHTML = categoryApi.getAllCategories().map(categoryCard).join("");
  }

  function renderSearchMatches() {
    const term = input.value.trim();

    if (!term) {
      results.hidden = true;
      results.innerHTML = "";
      return;
    }

    const matches = products.filter(function (product) {
      return core.productMatches(product, term);
    }).slice(0, 6);

    results.hidden = false;
    results.innerHTML = matches.length
      ? matches.map(function (product) {
          return "<a class=\"model-result\" href=\"" + core.productUrl(product) + "\">"
            + "<strong>" + core.escapeHtml(product.id) + "</strong>"
            + "<span>" + core.escapeHtml(product.series) + " · " + core.escapeHtml(product.size) + " · " + core.escapeHtml(product.connection) + "</span>"
            + "</a>";
        }).join("")
      : "<p class=\"model-result-empty\">No matching beta models found. Try a product type or series name.</p>";
  }

  renderCategories();

  if (!form || !input || !results) return;

  input.addEventListener("input", renderSearchMatches);
  input.addEventListener("focus", renderSearchMatches);

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".model-search-section")) results.hidden = true;
  });
})();
