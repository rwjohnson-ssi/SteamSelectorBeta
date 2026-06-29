/*
  Preserve the user's current page and position when closing global search.
  Prevents the category search input from reopening the overlay after it regains focus.
*/
(function () {
  "use strict";

  const overlay = document.getElementById("globalSearchOverlay");
  const searchInput = document.getElementById("globalSearchInput");
  if (!overlay) return;

  let origin = { x: window.scrollX, y: window.scrollY };

  function rememberOrigin(event) {
    const target = event.target;
    if (!target || !target.matches) return;
    if (target.matches("#catalogHeaderSearchInput, #modelSearchInput, [data-global-search-open]")) {
      origin = { x: window.scrollX, y: window.scrollY };
    }
  }

  function returnToCurrentPage(event) {
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    overlay.classList.remove("is-open");
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("global-search-open");

    if (searchInput && typeof searchInput.blur === "function") searchInput.blur();
    if (document.activeElement && typeof document.activeElement.blur === "function") document.activeElement.blur();

    window.requestAnimationFrame(function () {
      window.scrollTo(origin.x, origin.y);
    });
  }

  /* Capture phase runs before any earlier button-level close handlers. */
  overlay.addEventListener("pointerup", function (event) {
    if (event.target.closest("[data-global-search-close]")) returnToCurrentPage(event);
  }, true);

  overlay.addEventListener("touchend", function (event) {
    if (event.target.closest("[data-global-search-close]")) returnToCurrentPage(event);
  }, { capture: true, passive: false });

  overlay.addEventListener("click", function (event) {
    if (event.target.closest("[data-global-search-close]")) returnToCurrentPage(event);
  }, true);

  document.addEventListener("focus", rememberOrigin, true);
  document.addEventListener("pointerdown", rememberOrigin, true);

  window.SteamSelectorGlobalSearchReturn = returnToCurrentPage;
})();
