/* Shared quote-list controller for SteamSelector Beta. */
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const productApi = window.SteamSelectorProducts;

  if (!core || !productApi) return;

  const tableBody = document.getElementById("quoteTableBody");
  const emptyState = document.getElementById("quoteEmptyState");
  const actions = document.getElementById("quoteActions");
  const message = document.getElementById("quoteMessage");

  if (!tableBody || !emptyState || !actions || !message) return;

  core.renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Quote List" }]);

  function row(item) {
    const product = productApi.getProductById(item.id);
    if (!product) return "";
    const category = core.getCategory(product.category);

    return "<tr data-quote-item=\"" + core.escapeHtml(product.id) + "\">"
      + "<td>" + core.renderProductVisual(product, category, "product-thumb") + "</td>"
      + "<td><a class=\"catalog-model-link\" href=\"" + core.productUrl(product) + "\">" + core.escapeHtml(product.id) + "</a><br /><small>" + core.escapeHtml(product.summary) + "</small></td>"
      + "<td><input class=\"quote-quantity-input\" type=\"number\" min=\"1\" data-quote-qty value=\"" + core.quote.safeQuantity(item.qty) + "\" /></td>"
      + "<td><input class=\"quote-notes-input\" type=\"text\" data-quote-notes placeholder=\"Optional notes\" value=\"" + core.escapeHtml(item.notes || "") + "\" /></td>"
      + "<td><button class=\"quote-remove-button\" type=\"button\" data-remove-quote>Remove</button></td>"
      + "</tr>";
  }

  function render() {
    const quote = core.quote.load();
    const validItems = quote.filter(function (item) { return productApi.getProductById(item.id); });

    if (validItems.length !== quote.length) core.quote.save(validItems);

    emptyState.hidden = validItems.length > 0;
    actions.hidden = validItems.length === 0;
    tableBody.innerHTML = validItems.map(row).join("");
  }

  function buildClipboardText() {
    return core.quote.load().map(function (item) {
      const product = productApi.getProductById(item.id);
      if (!product) return "";
      return core.quote.safeQuantity(item.qty) + " ea - " + product.id + " - " + product.summary + (item.notes ? " | Notes: " + item.notes : "");
    }).filter(Boolean).join("\n");
  }

  tableBody.addEventListener("change", function (event) {
    const rowElement = event.target.closest("[data-quote-item]");
    if (!rowElement) return;
    const productId = rowElement.getAttribute("data-quote-item");

    if (event.target.matches("[data-quote-qty]")) {
      core.quote.update(productId, { qty: event.target.value });
      render();
    }

    if (event.target.matches("[data-quote-notes]")) {
      core.quote.update(productId, { notes: event.target.value });
    }
  });

  tableBody.addEventListener("click", function (event) {
    const removeButton = event.target.closest("[data-remove-quote]");
    if (!removeButton) return;
    const rowElement = removeButton.closest("[data-quote-item]");
    core.quote.remove(rowElement.getAttribute("data-quote-item"));
    message.textContent = "Item removed from the quote list.";
    render();
  });

  document.getElementById("clearQuoteButton").addEventListener("click", function () {
    core.quote.clear();
    message.textContent = "Your quote list was cleared.";
    render();
  });

  document.getElementById("copyQuoteButton").addEventListener("click", function () {
    const text = "SteamSelector Beta Quote List\n\n" + buildClipboardText();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        message.textContent = "Quote list copied to your clipboard.";
      }).catch(function () {
        message.textContent = "Unable to copy automatically. Please select and copy the list manually.";
      });
      return;
    }

    message.textContent = text;
  });

  render();
})();
