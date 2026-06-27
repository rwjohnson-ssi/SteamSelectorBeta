/* Shared product-detail controller for every SteamSelector Beta product. */
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const productApi = window.SteamSelectorProducts;

  if (!core || !productApi) return;

  const model = core.parameters().get("model");
  const product = productApi.getProductById(model);
  const detail = document.getElementById("productDetail");
  const related = document.getElementById("relatedProducts");
  const status = document.getElementById("productStatus");

  if (!detail || !related || !status) return;

  if (!product) {
    core.renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Product Not Found" }]);
    detail.innerHTML = "<section class=\"product-section\"><h1>Product not found</h1><p class=\"product-doc-note\">That model is not in the public beta catalog.</p><div class=\"product-action-row\"><a class=\"btn btn-primary\" href=\"index.html\">Back to Home</a></div></section>";
    related.hidden = true;
    return;
  }

  const category = core.getCategory(product.category);

  function renderSpecs() {
    return Object.keys(product.specs || {}).map(function (key) {
      return "<div class=\"product-spec\"><span>" + core.escapeHtml(key) + "</span><strong>" + core.escapeHtml(product.specs[key]) + "</strong></div>";
    }).join("");
  }

  function renderRelatedCard(item) {
    return "<a class=\"related-product\" href=\"" + core.productUrl(item) + "\">"
      + "<strong>" + core.escapeHtml(item.id) + "</strong>"
      + "<span>" + core.escapeHtml(item.summary) + "</span>"
      + "<small>View product ›</small>"
      + "</a>";
  }

  document.title = product.id + " | SteamSelector Beta";
  core.renderBreadcrumbs([
    { label: "Home", href: "index.html" },
    { label: category.title, href: core.categoryUrl(category.id) },
    { label: product.id }
  ]);

  detail.innerHTML = "<div class=\"product-layout\">"
    + "<section class=\"product-gallery\">" + core.renderProductVisual(product, category, "product-hero-visual") + "</section>"
    + "<section class=\"product-summary-panel\">"
    + "<p class=\"catalog-kicker\">" + core.escapeHtml(category.title) + " · " + core.escapeHtml(product.series) + "</p>"
    + "<div class=\"product-heading\"><h1>" + core.escapeHtml(product.id) + "</h1></div>"
    + "<p class=\"product-summary\">" + core.escapeHtml(product.summary) + "</p>"
    + "<p class=\"product-description\">" + core.escapeHtml(product.description) + "</p>"
    + "<div class=\"product-specs\">" + renderSpecs() + "</div>"
    + "<div class=\"product-action-row\">"
    + "<label class=\"product-quantity\"><span>Qty</span><input id=\"productQty\" type=\"number\" min=\"1\" value=\"1\" /></label>"
    + "<button id=\"addProductToQuote\" class=\"btn btn-primary\" type=\"button\">Add to Quote</button>"
    + "<a class=\"btn btn-secondary\" href=\"quote.html\">View Quote</a>"
    + "</div>"
    + "</section>"
    + "</div>"
    + "<div class=\"product-sections\">"
    + "<section class=\"product-section\"><h2>Description</h2><p class=\"product-doc-note\">" + core.escapeHtml(product.description) + "</p></section>"
    + "<section class=\"product-section\"><h2>Documents</h2><p class=\"product-doc-note\">Public beta documents are not included in this test repository. Approved product documents can later be added to each product record once this repository is private.</p></section>"
    + "</div>";

  const relatedProducts = productApi.getProductsByCategory(product.category)
    .filter(function (item) { return item.series === product.series && item.id !== product.id; })
    .slice(0, 3);

  related.innerHTML = relatedProducts.length
    ? "<section class=\"product-section\"><h2>Related Series Products</h2><div class=\"related-products\">" + relatedProducts.map(renderRelatedCard).join("") + "</div></section>"
    : "<section class=\"product-section\"><h2>Related Series Products</h2><p class=\"product-doc-note\">No additional public beta models are available for this series yet.</p></section>";

  document.getElementById("addProductToQuote").addEventListener("click", function () {
    const quantity = document.getElementById("productQty").value;
    core.quote.add(product, quantity);
    status.textContent = product.id + " was added to the quote list.";
  });
})();
