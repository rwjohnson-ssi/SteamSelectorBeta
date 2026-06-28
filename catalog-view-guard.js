/*
  Final catalog view guard.
  The shared results page must show either the table or the product-card grid,
  never both. Inline !important display rules prevent older layout styles from
  overriding the selected view.
*/
(function () {
  "use strict";

  function getViewElements() {
    return {
      table: document.getElementById("catalogTableWrap"),
      grid: document.getElementById("catalogList"),
      buttons: Array.from(document.querySelectorAll("[data-catalog-view]"))
    };
  }

  function applyView(requestedView) {
    const elements = getViewElements();
    if (!elements.table || !elements.grid) return;

    const useGrid = requestedView === "list";

    elements.table.hidden = useGrid;
    elements.grid.hidden = !useGrid;

    elements.table.classList.toggle("is-active-view", !useGrid);
    elements.grid.classList.toggle("is-active-view", useGrid);

    elements.table.style.setProperty("display", useGrid ? "none" : "block", "important");
    elements.grid.style.setProperty("display", useGrid ? "grid" : "none", "important");

    elements.buttons.forEach(function (button) {
      const active = button.getAttribute("data-catalog-view") === (useGrid ? "list" : "table");
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  // The beta opens in Table View. The listener uses capture so this guard
  // applies before older page listeners run, then the inline rules remain final.
  applyView("table");

  document.addEventListener("click", function (event) {
    const control = event.target.closest("[data-catalog-view]");
    if (!control) return;
    applyView(control.getAttribute("data-catalog-view"));
  }, true);

  window.SteamSelectorCatalogViewGuard = { applyView: applyView };
})();
