/*
   Quick View redesign controller.
   Replaces the legacy modal content on category pages while preserving the
   existing shared quote storage and quantity-stepper behavior.
*/
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const productApi = window.SteamSelectorProducts;
  const categoryApi = window.SteamSelectorCategories;
  const quantityApi = window.SteamSelectorQuantity;
  const modal = document.getElementById("quickViewModal");
  const modalContent = document.getElementById("quickViewContent");
  if (!core || !productApi || !categoryApi || !quantityApi || !modal || !modalContent) return;

  let lastFocus = null;

  function escape(value) {
    return core.escapeHtml(value == null ? "" : value);
  }

  function titleCase(value) {
    return String(value || "")
      .split("-")
      .filter(Boolean)
      .map(function (part) { return part.charAt(0).toUpperCase() + part.slice(1); })
      .join(" ");
  }

  function productType(product) {
    return product.subcategory && product.subcategory !== "all" ? titleCase(product.subcategory) : "All";
  }

  function specIcon(index) {
    return ["◫", "◌", "↔", "◷"][index] || "•";
  }

  function specMarkup(product) {
    const specs = [
      { label: "Type", value: productType(product) },
      { label: "Size", value: product.size || "—" },
      { label: "Connection", value: product.connection || "—" },
      { label: "Max Rating", value: product.pmo || "—" }
    ];

    return specs.map(function (spec, index) {
      return "<div class=\"quick-view-spec\">"
        + "<span class=\"quick-view-spec-icon\" aria-hidden=\"true\">" + specIcon(index) + "</span>"
        + "<div class=\"quick-view-spec-copy\"><span>" + escape(spec.label) + "</span><strong>" + escape(spec.value) + "</strong></div>"
        + "</div>";
    }).join("");
  }

  function documentDefinition(product, key, fallbackTitle) {
    const documents = product.documents || {};
    const configured = documents[key] || {};
    const url = String(configured.url || product[key + "Url"] || "").trim();
    const title = configured.title || fallbackTitle;
    const meta = configured.meta || "";
    return { url: url, title: title, meta: meta };
  }

  function documentMarkup(definition) {
    const inactive = !definition.url;
    const common = "<span class=\"quick-view-document-pdf\" aria-hidden=\"true\">PDF</span>"
      + "<span class=\"quick-view-document-copy\"><strong>" + escape(definition.title) + "</strong>"
      + (definition.meta ? "<small>" + escape(definition.meta) + "</small>" : inactive ? "<small>Not available in this beta catalog</small>" : "")
      + "</span>"
      + "<span class=\"quick-view-document-action\" aria-hidden=\"true\">" + (inactive ? "—" : "⇩") + "</span>";

    if (inactive) {
      return "<div class=\"quick-view-document is-unavailable\" aria-disabled=\"true\">" + common + "</div>";
    }

    return "<a class=\"quick-view-document\" href=\"" + escape(definition.url) + "\" target=\"_blank\" rel=\"noopener\">" + common + "</a>";
  }

  function quantityInput() {
    return modal.querySelector("#quickViewQty");
  }

  function updateAddLabel() {
    const input = quantityInput();
    const button = modal.querySelector("[data-quick-view-add]");
    if (!input || !button) return;

    const quantity = quantityApi.normalize(input.value);
    input.value = String(quantity);
    button.innerHTML = "<span class=\"quick-view-cart-mark\" aria-hidden=\"true\">⌑</span><span>Add " + quantity + " to Quote</span>";
  }

  function openQuickView(productId, trigger) {
    const product = productApi.getProductById(productId);
    if (!product) return;

    const category = categoryApi.getCategoryById(product.category);
    const specSheet = documentDefinition(product, "specSheet", "Product Spec Sheet PDF");
    const manual = documentDefinition(product, "manual", "Manual PDF");
    lastFocus = trigger || document.activeElement;

    modalContent.innerHTML = "<div class=\"quick-view-redesign\">"
      + "<div class=\"quick-view-hero\">"
      + "<div class=\"quick-view-media\">" + core.renderProductVisual(product, category, "product-hero-visual") + "</div>"
      + "<div class=\"quick-view-copy\">"
      + "<p class=\"catalog-kicker\">" + escape(category ? category.title : "Products") + " · " + escape(product.series || product.id) + "</p>"
      + "<h2 id=\"quickViewTitle\">" + escape(product.id) + "</h2>"
      + "<p class=\"quick-view-summary\">" + escape(product.summary || "") + "</p>"
      + "<p class=\"quick-view-description\">" + escape(product.description || "") + "</p>"
      + "</div></div>"
      + "<div class=\"quick-view-details\">"
      + "<section class=\"quick-view-spec-section\"><h3 class=\"quick-view-section-title\">Key Specifications</h3><div class=\"quick-view-specs\">" + specMarkup(product) + "</div></section>"
      + "<section class=\"quick-view-quantity-section\"><h3 class=\"quick-view-section-title\">Quantity</h3><div class=\"quick-view-order-row\">" + quantityApi.markup("quickViewQty", "Quantity") + "<p class=\"quick-view-quote-status\" data-quick-view-status role=\"status\" aria-live=\"polite\"></p></div></section>"
      + "<section class=\"quick-view-documents-section\"><h3 class=\"quick-view-section-title\">Documents</h3><div class=\"quick-view-document-list\">" + documentMarkup(specSheet) + documentMarkup(manual) + "</div></section>"
      + "</div>"
      + "<div class=\"quick-view-actions\">"
      + "<button class=\"btn btn-primary\" type=\"button\" data-quick-view-add=\"" + escape(product.id) + "\"><span class=\"quick-view-cart-mark\" aria-hidden=\"true\">⌑</span><span>Add 1 to Quote</span></button>"
      + "<a class=\"btn btn-secondary\" href=\"" + core.productUrl(product) + "\">View Full Product Page</a>"
      + "</div>"
      + "</div>";

    modal.hidden = false;
    document.body.classList.add("quick-view-open");
    /* The category page already binds the shared stepper once on document. Binding
       it again on every modal open caused one press to run more than one increment. */
    updateAddLabel();

    const closeButton = modal.querySelector(".quick-view-close");
    if (closeButton) closeButton.focus();
  }

  function closeQuickView() {
    if (modal.hidden) return;
    modal.hidden = true;
    modalContent.innerHTML = "";
    document.body.classList.remove("quick-view-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function addCurrentProduct(productId) {
    const product = productApi.getProductById(productId);
    if (!product) return;

    const input = quantityInput();
    const quantity = quantityApi.normalize(input ? input.value : 1);
    core.quote.add(product, quantity);

    const status = modal.querySelector("[data-quick-view-status]");
    if (status) {
      status.textContent = quantity === 1
        ? product.id + " was added to the quote list."
        : quantity + " × " + product.id + " were added to the quote list.";
    }
  }

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-quick-view]");
    if (trigger) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openQuickView(trigger.getAttribute("data-quick-view"), trigger);
      return;
    }

    if (event.target.closest("[data-quick-close]")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeQuickView();
      return;
    }

    const addButton = event.target.closest("[data-quick-view-add]");
    if (addButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      addCurrentProduct(addButton.getAttribute("data-quick-view-add"));
    }
  }, true);

  document.addEventListener("steamselector:quantity-change", function (event) {
    if (event.target && event.target.id === "quickViewQty") {
      window.requestAnimationFrame(updateAddLabel);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeQuickView();
    }
  }, true);
})();
