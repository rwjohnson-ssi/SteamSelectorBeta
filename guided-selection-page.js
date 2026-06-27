/* Shared guided-selection starting point for SteamSelector Beta. */
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const categoryApi = window.SteamSelectorCategories;
  if (!core || !categoryApi) return;

  const form = document.getElementById("guidedSelectionForm");
  const categorySelect = document.getElementById("guidedCategory");
  const recommendation = document.getElementById("guidedRecommendation");

  if (!form || !categorySelect || !recommendation) return;

  core.renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Guided Selection" }]);

  categorySelect.innerHTML = "<option value=\"\">Choose a product category</option>" + categoryApi.getAllCategories().map(function (category) {
    return "<option value=\"" + core.escapeHtml(category.id) + "\">" + core.escapeHtml(category.title) + "</option>";
  }).join("");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const category = categoryApi.getCategoryById(categorySelect.value);
    if (!category) return;

    recommendation.hidden = false;
    recommendation.innerHTML = "<section class=\"guided-card\">"
      + "<p class=\"catalog-kicker\">Suggested Starting Point</p>"
      + "<h2>" + core.escapeHtml(category.title) + "</h2>"
      + "<p class=\"product-doc-note\">" + core.escapeHtml(category.description) + "</p>"
      + "<div class=\"guided-actions\"><a class=\"btn btn-primary\" href=\"" + core.categoryUrl(category.id) + "\">Browse " + core.escapeHtml(category.title) + "</a></div>"
      + "</section>";
  });
})();
