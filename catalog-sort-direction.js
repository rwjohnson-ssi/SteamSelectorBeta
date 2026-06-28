/* Shared ascending and descending controls for the catalog Filter & Sort panel. */
(function () {
  "use strict";

  const filterFields = document.getElementById("catalogFilterFields");
  if (!filterFields) return;

  let direction = "asc";
  let applyingDirection = false;

  function drawerSort() {
    return filterFields.querySelector("#drawerCatalogSort");
  }

  function currentKey() {
    const select = drawerSort();
    return select ? select.value : "best-match";
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

  function applyDirection(nextDirection) {
    const select = drawerSort();
    if (!select || !supportsDirection()) return;

    const key = select.value;
    applyingDirection = true;

    /* The shared controller treats a drawer sort change as ascending. */
    select.value = key;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    if (nextDirection === "desc") {
      const columnButton = document.querySelector("[data-column-sort=\"" + key + "\"]");
      if (columnButton) columnButton.click();
    }

    direction = nextDirection;
    applyingDirection = false;
    window.requestAnimationFrame(updateDirectionControl);
  }

  filterFields.addEventListener("click", function (event) {
    const directionButton = event.target.closest("[data-catalog-sort-direction]");
    if (!directionButton || directionButton.disabled) return;
    applyDirection(directionButton.getAttribute("data-catalog-sort-direction"));
  });

  /* A new field selection begins in ascending order. */
  filterFields.addEventListener("change", function (event) {
    if (applyingDirection || event.target.id !== "drawerCatalogSort") return;
    direction = "asc";
    window.requestAnimationFrame(updateDirectionControl);
  });

  /* Direct table-header sorting remains synchronized with the panel buttons. */
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

  observer.observe(filterFields, { childList: true });
  updateDirectionControl();
})();
