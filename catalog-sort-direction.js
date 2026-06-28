/*
  Shared sort direction control for the catalog Filter & Sort panel.
  The existing catalog controller owns the actual sorting state. This component
  uses the same public controls to set ascending or descending reliably.
*/
(function () {
  "use strict";

  const filterFields = document.getElementById("catalogFilterFields");
  const topSort = document.getElementById("catalogSort");
  if (!filterFields || !topSort) return;

  let direction = "asc";
  let applyingDirection = false;

  function currentKey() {
    return topSort.value || "best-match";
  }

  function supportsDirection() {
    return currentKey() !== "best-match";
  }

  function buttonMarkup(value, label, symbol, disabled) {
    const active = direction === value;
    const disabledAttribute = disabled ? " disabled" : "";

    return "<button class=\"catalog-sort-direction-button" + (active ? " is-active" : "") + "\" type=\"button\" data-catalog-sort-direction=\"" + value + "\" aria-pressed=\"" + String(active) + "\"" + disabledAttribute + ">"
      + "<span class=\"catalog-sort-direction-symbol\" aria-hidden=\"true\">" + symbol + "</span>"
      + "<span>" + label + "</span>"
      + "</button>";
  }

  function updateDirectionControl() {
    const sortOptions = filterFields.querySelector(".catalog-filter-sort-options");
    if (!sortOptions) return;

    let control = sortOptions.querySelector("[data-catalog-sort-direction-control]");
    if (!control) {
      control = document.createElement("div");
      control.className = "catalog-sort-direction-control";
      control.setAttribute("data-catalog-sort-direction-control", "");
      control.setAttribute("role", "group");
      control.setAttribute("aria-label", "Sort direction");
      sortOptions.insertBefore(control, sortOptions.querySelector(".catalog-filter-sort-help"));
    }

    const unavailable = !supportsDirection();
    if (unavailable) direction = "asc";

    control.innerHTML = buttonMarkup("asc", "Ascending", "↑", unavailable)
      + buttonMarkup("desc", "Descending", "↓", unavailable);

    const help = sortOptions.querySelector(".catalog-filter-sort-help");
    if (help) {
      help.textContent = unavailable
        ? "Choose a field other than Best Match to set ascending or descending order."
        : "Ascending sorts A–Z or low to high. Descending sorts Z–A or high to low.";
    }
  }

  function resetToAscending() {
    direction = "asc";
    window.requestAnimationFrame(updateDirectionControl);
  }

  function applyDirection(nextDirection) {
    if (!supportsDirection()) return;

    const key = currentKey();
    applyingDirection = true;

    /* Selecting the current sort field resets the shared controller to ascending. */
    topSort.value = key;
    topSort.dispatchEvent(new Event("change", { bubbles: true }));

    if (nextDirection === "desc") {
      const columnButton = document.querySelector("[data-column-sort=\"" + key + "\"]");
      if (columnButton) columnButton.click();
    }

    direction = nextDirection;
    applyingDirection = false;
    window.requestAnimationFrame(updateDirectionControl);
  }

  filterFields.addEventListener("click", function (event) {
    const button = event.target.closest("[data-catalog-sort-direction]");
    if (!button || button.disabled) return;
    applyDirection(button.getAttribute("data-catalog-sort-direction"));
  });

  /* New sort field selections always begin in ascending order. */
  document.addEventListener("change", function (event) {
    if (applyingDirection) return;
    if (event.target === topSort || event.target.id === "drawerCatalogSort") resetToAscending();
  });

  /* Keep the panel direction button in sync with direct table-header sorting. */
  document.addEventListener("click", function (event) {
    const headerButton = event.target.closest("[data-column-sort]");
    if (!headerButton || applyingDirection) return;

    const key = headerButton.getAttribute("data-column-sort");
    direction = key === currentKey() ? (direction === "asc" ? "desc" : "asc") : "asc";
    window.requestAnimationFrame(updateDirectionControl);
  }, true);

  const observer = new MutationObserver(function () {
    window.requestAnimationFrame(updateDirectionControl);
  });

  observer.observe(filterFields, { childList: true, subtree: true });
  updateDirectionControl();
})();
