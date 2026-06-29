/*
  iPhone-safe global search toolbar controls.
  Close is deliberately self-contained so category-page search triggers cannot
  reopen the overlay after the user taps the toolbar X.
*/
(function () {
  "use strict";

  const overlay = document.getElementById("globalSearchOverlay");
  const input = document.getElementById("globalSearchInput");
  const clearButton = document.getElementById("globalSearchClear");
  if (!overlay) return;

  let returnPosition = { x: window.scrollX, y: window.scrollY };

  function rememberPosition(event) {
    const target = event.target;
    if (!target || !target.closest) return;

    if (target.closest("#catalogHeaderSearchInput, #modelSearchInput, [data-global-search-open]")) {
      returnPosition = { x: window.scrollX, y: window.scrollY };
    }
  }

  function dismissOverlay(event) {
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    overlay.classList.remove("is-open");
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("global-search-open");

    if (input && typeof input.blur === "function") input.blur();
    if (document.activeElement && typeof document.activeElement.blur === "function") document.activeElement.blur();

    window.requestAnimationFrame(function () {
      window.scrollTo(returnPosition.x, returnPosition.y);
    });
  }

  function clearSearch(event) {
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    if (!input) return;
    input.value = "";
    if (clearButton) clearButton.hidden = true;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  function bindDirect(button, handler) {
    if (!button) return;

    /* Capture each tap form before the shared document click listener sees it. */
    button.addEventListener("touchend", handler, { capture: true, passive: false });
    button.addEventListener("pointerup", handler, { capture: true, passive: false });
    button.addEventListener("click", handler, true);
    button.style.touchAction = "manipulation";
  }

  document.addEventListener("pointerdown", rememberPosition, true);
  document.addEventListener("focusin", rememberPosition, true);

  overlay.querySelectorAll("[data-global-search-close]").forEach(function (button) {
    bindDirect(button, dismissOverlay);
  });

  bindDirect(clearButton, clearSearch);
})();
