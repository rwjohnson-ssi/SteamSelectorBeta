/*
  Category-page global search exit override.
  Intercepts iOS touch/pointer/click events at document capture phase before any
  legacy global-search close listener can refocus the category search field.
*/
(function () {
  "use strict";

  const overlay = document.getElementById("globalSearchOverlay");
  const globalInput = document.getElementById("globalSearchInput");
  if (!overlay) return;

  let originX = window.scrollX;
  let originY = window.scrollY;

  function rememberOrigin(event) {
    const target = event.target;
    if (!target || !target.closest) return;

    if (target.closest("#catalogHeaderSearchInput, #modelSearchInput, [data-global-search-open]")) {
      originX = window.scrollX;
      originY = window.scrollY;
    }
  }

  function isSearchClose(event) {
    return Boolean(event.target && event.target.closest && event.target.closest("[data-global-search-close]"));
  }

  function dismissWithoutRefocus(event) {
    if (!isSearchClose(event)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    overlay.classList.remove("is-open");
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("global-search-open");

    if (globalInput && typeof globalInput.blur === "function") globalInput.blur();
    if (document.activeElement && typeof document.activeElement.blur === "function") document.activeElement.blur();

    window.requestAnimationFrame(function () {
      window.scrollTo(originX, originY);
    });
  }

  document.addEventListener("pointerdown", rememberOrigin, true);
  document.addEventListener("focusin", rememberOrigin, true);

  /* Every mobile event form is intercepted before target-level legacy handlers. */
  document.addEventListener("touchstart", dismissWithoutRefocus, { capture: true, passive: false });
  document.addEventListener("touchend", dismissWithoutRefocus, { capture: true, passive: false });
  document.addEventListener("pointerup", dismissWithoutRefocus, { capture: true, passive: false });
  document.addEventListener("click", dismissWithoutRefocus, true);
})();
