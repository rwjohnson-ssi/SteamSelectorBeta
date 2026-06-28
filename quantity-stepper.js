/*
  Shared quantity stepper for Quick View and full product pages.
  Use this module anywhere an item can be added to the quote list.
*/
(function () {
  "use strict";

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
      + "<input id=\"" + safeId + "\" class=\"quantity-stepper-input\" data-quantity-input type=\"number\" min=\"1\" value=\"1\" inputmode=\"numeric\" aria-label=\"" + safeLabel + "\" />"
      + "<button class=\"quantity-stepper-button\" type=\"button\" data-quantity-step=\"1\" aria-label=\"Increase quantity\">+</button>"
      + "</div>"
      + "</div>";
  }

  function setValue(input, value) {
    if (!input) return 1;
    const nextValue = normalize(value);
    input.value = String(nextValue);
    input.dispatchEvent(new CustomEvent("steamselector:quantity-change", { bubbles: true }));
    return nextValue;
  }

  function bind(root) {
    const eventRoot = root || document;

    eventRoot.addEventListener("click", function (event) {
      const button = event.target.closest("[data-quantity-step]");
      if (!button) return;

      const container = button.closest("[data-quantity-stepper]");
      const input = container ? container.querySelector("[data-quantity-input]") : null;
      if (!input) return;

      event.preventDefault();
      setValue(input, normalize(input.value) + Number(button.getAttribute("data-quantity-step")));
    });

    eventRoot.addEventListener("change", function (event) {
      const input = event.target.closest("[data-quantity-input]");
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
