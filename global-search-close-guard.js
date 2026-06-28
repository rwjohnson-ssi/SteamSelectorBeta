/*
  iPhone-safe global search close and clear controls.
  Runs after global-search.js and binds directly to the toolbar buttons.
*/
(function () {
  "use strict";

  const overlay = document.getElementById("globalSearchOverlay");
  const input = document.getElementById("globalSearchInput");
  const clearButton = document.getElementById("globalSearchClear");
  if (!overlay) return;

  function fallbackClose() {
    overlay.classList.remove("is-open");
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("global-search-open");
    if (document.activeElement && typeof document.activeElement.blur === "function") document.activeElement.blur();
  }

  function closeSearch(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (window.SteamSelectorGlobalSearch && typeof window.SteamSelectorGlobalSearch.close === "function") {
      window.SteamSelectorGlobalSearch.close();
    } else {
      fallbackClose();
    }
  }

  function clearSearch(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!input) return;
    input.value = "";
    if (clearButton) clearButton.hidden = true;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }

  function bindDirect(button, handler) {
    if (!button) return;

    button.addEventListener("pointerup", handler, { passive: false });
    button.addEventListener("click", handler, true);
    button.style.touchAction = "manipulation";
  }

  overlay.querySelectorAll("[data-global-search-close]").forEach(function (button) {
    bindDirect(button, closeSearch);
  });

  bindDirect(clearButton, clearSearch);
})();
