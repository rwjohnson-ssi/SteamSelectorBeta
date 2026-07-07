/*
   Shared quantity stepper for Quick View and full product pages.
   Use this module anywhere an item can be added to the quote list.
*/
(function () {
  "use strict";

  const DOCUMENT_BIND_FLAG = "__steamselectorQuantityStepperBound";

  function normalize(value) {
    const quantity = Math.floor(Number(value));
    return Number.isFinite(quantity) && quantity >= 1 ? quantity : 1;
  }

  function markup(inputId, label) {
    const safeId = String(inputId || "quantityInput");
    const safeLabel = String(label || "Quantity");

    return "<div class=\"quantity-control\" data-quantity-stepper>"
      + "<span class=\"quantity-control-label\">" + safeLabel + "</span>"
      + "<div class=\"quantity-stepper\">"
      + "<button class=\"quantity-stepper-button\" type=\"button\" data-quantity-step=\"-1\" aria-label=\"Decrease quantity\">−</button>"
      + "<input id=\"" + safeId + "\" class=\"quantity-stepper-input\" data-quantity-input type=\"number\" min=\"1\" step=\"1\" value=\"1\" inputmode=\"numeric\" aria-label=\"" + safeLabel + "\" />"
      + "<button class=\"quantity-stepper-button\" type=\"button\" data-quantity-step=\"1\" aria-label=\"Increase quantity\">+</button>"
      + "</div>"
      + "</div>";
  }

  function syncQuickViewProjectLabel(input, quantity) {
    if (!input || input.id !== "quickViewQty") return;

    const projectButton = document.querySelector("#quickViewContent [data-quick-view-project-toggle]");
    if (!projectButton) return;

    projectButton.innerHTML = "<span aria-hidden=\"true\">＋</span><span>Add "
      + quantity + " to Project</span>";
  }

  function setValue(input, value) {
    if (!input) return 1;
    const nextValue = normalize(value);
    input.value = String(nextValue);
    syncQuickViewProjectLabel(input, nextValue);
    input.dispatchEvent(new CustomEvent("steamselector:quantity-change", { bubbles: true }));
    return nextValue;
  }

  function closestElement(target, selector) {
    return target && typeof target.closest === "function" ? target.closest(selector) : null;
  }

  function bind() {
    /*
       Every page uses one document-level delegated listener. This makes the
       binding safe when Quick View content is opened repeatedly or when another
       component asks to bind the shared stepper again.
    */
    if (document[DOCUMENT_BIND_FLAG]) return;
    document[DOCUMENT_BIND_FLAG] = true;

    document.addEventListener("click", function (event) {
      const button = closestElement(event.target, "[data-quantity-step]");
      if (!button) return;

      const container = button.closest("[data-quantity-stepper]");
      const input = container ? container.querySelector("[data-quantity-input]") : null;
      if (!input) return;

      const requestedStep = Number(button.getAttribute("data-quantity-step"));
      const step = requestedStep < 0 ? -1 : 1;

      event.preventDefault();
      setValue(input, normalize(input.value) + step);
    });

    document.addEventListener("change", function (event) {
      const input = closestElement(event.target, "[data-quantity-input]");
      if (!input) return;
      setValue(input, input.value);
    });
  }

  window.SteamSelectorQuantity = {
    normalize: normalize,
    markup: markup,
    setValue: setValue,
    bind: bind
  };
})();
