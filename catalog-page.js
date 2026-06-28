/*
  One shared catalog-results controller for every SteamSelector Beta category.
  Route examples:
    category.html?id=steam-traps
    category.html?id=steam-traps&type=inverted-bucket
*/
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const categoryApi = window.SteamSelectorCategories;
  const productApi = window.SteamSelectorProducts;
  const configApi = window.SteamSelectorCatalogConfig;
  const quantityApi = window.SteamSelectorQuantity;

  if (!core || !categoryApi || !productApi || !configApi || !quantityApi) return;

  const query = core.parameters();
  const requestedCategoryId = query.get("id") || "steam-traps";
  const category = categoryApi.getCategoryById(requestedCategoryId) || categoryApi.getCategoryById("steam-traps");
  const config = configApi.getCatalogConfig(category.id);
  const allCategoryProducts = productApi.getProductsByCategory(category.id);
  const initialSubcategory = query.get("type") || "all";

  const dom = {
    title: document.getElementById("categoryTitle"),
    resultCount: document.getElementById("catalogResultCount"),
    filterLabel: document.getElementById("catalogFilterLabel"),
    filterDrawer: document.getElementById("catalogFilters"),
    filterBackdrop: document.getElementById("catalogFilterBackdrop"),
    openFilters: document.getElementById("openCatalogFilters"),
    closeFilters: Array.from(document.querySelectorAll("[data-close-catalog-filters]")),
    filters: document.getElementById("catalogFilterFields"),
    filterSearch: document.getElementById("catalogSearch"),
    headerSearch: document.getElementById("catalogHeaderSearchInput"),
    headerSearchForm: document.getElementById("catalogHeaderSearchForm"),
    resetFilters: document.getElementById("resetCatalogFilters"),
    sort: document.getElementById("catalogSort"),
    pageSize: document.getElementById("catalogPageSize"),
    tableWrap: document.getElementById("catalogTableWrap"),
    tableHead: document.getElementById("catalogTableHead"),
    tableBody: document.getElementById("catalogTableBody"),
    list: document.getElementById("catalogList"),
    pagination: document.getElementById("catalogPagination"),
    paginationSummary: document.getElementById("catalogPaginationSummary"),
    previousPage: document.getElementById("catalogPreviousPage"),
    nextPage: document.getElementById("catalogNextPage"),
    pageIndicator: document.getElementById("catalogPageIndicator"),
    viewButtons: Array.from(document.querySelectorAll("[data-catalog-view]")),
    status: document.getElementById("catalogStatus"),
    modal: document.getElementById("quickViewModal"),
    modalContent: document.getElementById("quickViewContent")
  };

  if (!dom.title || !dom.resultCount || !dom.filters || !dom.tableHead || !dom.tableBody || !dom.list || !dom.modal || !dom.modalContent) return;

  function emptyFilters() {
    const filters = {};
    config.filters.forEach(function (filter) {
      filters[filter.key] = [];
    });
    return filters;
  }

  const state = {
    view: config.defaultView || "table",
    page: 1,
    pageSize: config.pageSize || 25,
    search: "",
    sortKey: config.defaultSort || "best-match",
    sortDirection: "asc",
    filters: emptyFilters(),
    expandedFilterGroups: new Set(["series", "size"]),
    lastFocus: null
  };

  if (initialSubcategory && initialSubcategory !== "all") {
    state.filters.subcategory = [initialSubcategory];
  }

  const FILTER_LABELS = {
    subcategory: "Product Type",
    series: "Series",
    size: "Size",
    connection: "Connection",
    material: "Body Material"
  };

  const SORT_OPTIONS = [
    { value: "best-match", label: "Best Match" },
    { value: "id", label: "Model Number" },
    { value: "subcategory", label: "Product Type" },
    { value: "size", label: "Size" },
    { value: "connection", label: "Connection" },
    { value: "pmo", label: "Max Rating" }
  ];

  function text(value) {
    const safeValue = String(value == null ? "" : value).trim();
    return safeValue || "—";
  }

  function titleCase(value) {
    return String(value || "")
      .split("-")
      .filter(Boolean)
      .map(function (part) { return part.charAt(0).toUpperCase() + part.slice(1); })
      .join(" ");
  }

  function numericValue(value) {
    const raw = String(value || "");
    const mixedFraction = raw.match(/(\d+)\s*-\s*(\d+)\s*\/\s*(\d+)/);
    if (mixedFraction) return Number(mixedFraction[1]) + Number(mixedFraction[2]) / Number(mixedFraction[3]);
    const fraction = raw.match(/(\d+)\s*\/\s*(\d+)/);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]);
    const number = raw.match(/[\d.]+/);
    return number ? Number(number[0]) : 0;
  }

  function selectedValues(key) {
    const current = state.filters[key];
    if (Array.isArray(current)) return current;
    if (!current || current === "all") return [];
    return [current];
  }

  function productMatchesSelectedFilters(product, excludedKey) {
    return config.filters.every(function (filter) {
      if (filter.key === excludedKey) return true;
      const selected = selectedValues(filter.key);
      return !selected.length || selected.includes(product[filter.key]);
    });
  }

  function filterOptionCount(key, value) {
    return allCategoryProducts.filter(function (product) {
      return core.productMatches(product, state.search)
        && product[key] === value
        && productMatchesSelectedFilters(product, key);
    }).length;
  }

  function compareProducts(left, right) {
    if (state.sortKey === "best-match") return 0;

    let comparison = 0;
    if (state.sortKey === "size" || state.sortKey === "pmo") {
      comparison = numericValue(left[state.sortKey]) - numericValue(right[state.sortKey]);
    } else {
      comparison = String(left[state.sortKey] || "").localeCompare(String(right[state.sortKey] || ""), undefined, {
        numeric: true,
        sensitivity: "base"
      });
    }

    return state.sortDirection === "desc" ? comparison * -1 : comparison;
  }

  function filteredProducts() {
    return allCategoryProducts
      .filter(function (product) {
        return core.productMatches(product, state.search) && productMatchesSelectedFilters(product);
      })
      .slice()
      .sort(compareProducts);
  }

  function pageCount(products) {
    return Math.max(1, Math.ceil(products.length / state.pageSize));
  }

  function visibleProducts(products) {
    const start = (state.page - 1) * state.pageSize;
    return products.slice(start, start + state.pageSize);
  }

  function activeFilterCount() {
    return config.filters.reduce(function (count, filter) {
      return count + selectedValues(filter.key).length;
    }, 0);
  }

  function updateFilterLabel() {
    const count = activeFilterCount();
    dom.filterLabel.textContent = count ? "Filter (" + count + ")" : "Filter";
  }

  function filterLabel(filter) {
    return FILTER_LABELS[filter.key] || filter.label;
  }

  function sortOptionMarkup() {
    return SORT_OPTIONS.map(function (option) {
      const selected = option.value === state.sortKey ? " selected" : "";
      return "<option value=\"" + option.value + "\"" + selected + ">" + option.label + "</option>";
    }).join("");
  }

  function renderSortSection() {
    const isOpen = state.expandedFilterGroups.has("sort");
    const symbol = isOpen ? "−" : "+";

    return "<section class=\"catalog-filter-accordion" + (isOpen ? " is-open" : "") + "\">"
      + "<button class=\"catalog-filter-accordion-toggle\" type=\"button\" data-filter-accordion=\"sort\" aria-expanded=\"" + String(isOpen) + "\">"
      + "<span class=\"catalog-filter-accordion-name\">Sort Results</span>"
      + "<span class=\"catalog-filter-accordion-symbol\" aria-hidden=\"true\">" + symbol + "</span>"
      + "</button>"
      + "<div class=\"catalog-filter-options\"><div class=\"catalog-filter-sort-options\">"
      + "<select id=\"drawerCatalogSort\" aria-label=\"Sort products\">" + sortOptionMarkup() + "</select>"
      + "<p class=\"catalog-filter-sort-help\">For reverse order, tap the matching column header in Table View.</p>"
      + "</div></div>"
      + "</section>";
  }

  function renderFilterFields() {
    const groups = config.filters.map(function (filter) {
      const options = core.uniqueValues(allCategoryProducts, filter.key);
      const selected = selectedValues(filter.key);
      const isOpen = state.expandedFilterGroups.has(filter.key);

      if (!options.length) return "";

      const optionsMarkup = options.map(function (option) {
        const checked = selected.includes(option) ? " checked" : "";
        const total = filterOptionCount(filter.key, option);

        return "<label class=\"catalog-filter-option\">"
          + "<input type=\"checkbox\" data-catalog-filter=\"" + core.escapeHtml(filter.key) + "\" data-filter-value=\"" + core.escapeHtml(option) + "\"" + checked + " />"
          + "<span class=\"catalog-filter-checkbox\" aria-hidden=\"true\"></span>"
          + "<span class=\"catalog-filter-option-label\">" + core.escapeHtml(titleCase(option)) + "</span>"
          + "<span class=\"catalog-filter-option-total\">(" + total + ")</span>"
          + "</label>";
      }).join("");

      return "<section class=\"catalog-filter-accordion" + (isOpen ? " is-open" : "") + "\">"
        + "<button class=\"catalog-filter-accordion-toggle\" type=\"button\" data-filter-accordion=\"" + core.escapeHtml(filter.key) + "\" aria-expanded=\"" + String(isOpen) + "\">"
        + "<span class=\"catalog-filter-accordion-name\">" + core.escapeHtml(filterLabel(filter))
        + (selected.length ? "<b class=\"catalog-filter-accordion-count\">" + selected.length + "</b>" : "")
        + "</span>"
        + "<span class=\"catalog-filter-accordion-symbol\" aria-hidden=\"true\">" + (isOpen ? "−" : "+") + "</span>"
        + "</button>"
        + "<div class=\"catalog-filter-options\">" + optionsMarkup + "</div>"
        + "</section>";
    }).join("");

    dom.filters.innerHTML = renderSortSection() + groups;
  }

  function syncSortControls() {
    if (dom.sort && dom.sort.value !== state.sortKey) dom.sort.value = state.sortKey;
    const drawerSort = dom.filters.querySelector("#drawerCatalogSort");
    if (drawerSort && drawerSort.value !== state.sortKey) drawerSort.value = state.sortKey;
  }

  function sortHeader(label, key) {
    const active = state.sortKey === key ? " is-active" : "";
    return "<button class=\"results-column-button" + active + "\" type=\"button\" data-column-sort=\"" + key + "\">" + core.escapeHtml(label) + "</button>";
  }

  function renderTableHead() {
    dom.tableHead.innerHTML = "<tr>"
      + "<th class=\"results-quick-column\">Quick View</th>"
      + "<th class=\"results-image-column\">Image</th>"
      + "<th class=\"results-model-column\">" + sortHeader("Model", "id") + "</th>"
      + config.tableColumns.map(function (column) {
          return "<th>" + (column.sortable ? sortHeader(column.label, column.key) : core.escapeHtml(column.label)) + "</th>";
        }).join("")
      + "<th class=\"results-action-column\"><span class=\"sr-only\">Product details</span></th>"
      + "</tr>";
  }

  function quickViewButton(product) {
    return "<button class=\"results-quick-view\" type=\"button\" data-quick-view=\"" + core.escapeHtml(product.id) + "\" aria-label=\"Quick view " + core.escapeHtml(product.id) + "\"><span class=\"results-eye-icon\" aria-hidden=\"true\"></span></button>";
  }

  function tableRow(product) {
    const columns = config.tableColumns.map(function (column) {
      return "<td>" + core.escapeHtml(text(product[column.key])) + "</td>";
    }).join("");

    return "<tr>"
      + "<td>" + quickViewButton(product) + "</td>"
      + "<td>" + core.renderProductVisual(product, category, "results-product-image") + "</td>"
      + "<td><a class=\"results-model-link\" href=\"" + core.productUrl(product) + "\">" + core.escapeHtml(product.id) + "</a></td>"
      + columns
      + "<td><a class=\"results-detail-link\" href=\"" + core.productUrl(product) + "\" aria-label=\"View " + core.escapeHtml(product.id) + " details\">›</a></td>"
      + "</tr>";
  }

  function gridCard(product) {
    return "<article class=\"results-card\">"
      + quickViewButton(product)
      + core.renderProductVisual(product, category, "results-product-image")
      + "<div class=\"results-card-copy\">"
      + "<a class=\"results-model-link\" href=\"" + core.productUrl(product) + "\">" + core.escapeHtml(product.id) + "</a>"
      + "<p>" + core.escapeHtml(product.summary) + "</p>"
      + "<div class=\"results-card-meta\"><span>" + core.escapeHtml(text(product.size)) + "</span><span>" + core.escapeHtml(text(product.connection)) + "</span><span>" + core.escapeHtml(text(product.pmo)) + "</span></div>"
      + "</div>"
      + "<div class=\"results-card-actions\"><span>" + core.escapeHtml(titleCase(product.subcategory)) + "</span><a class=\"results-detail-link\" href=\"" + core.productUrl(product) + "\" aria-label=\"View " + core.escapeHtml(product.id) + " details\">›</a></div>"
      + "</article>";
  }

  function renderPagination(products) {
    const totalPages = pageCount(products);
    const start = products.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const end = Math.min(state.page * state.pageSize, products.length);

    dom.paginationSummary.textContent = "Showing " + start + " to " + end + " of " + products.length + " products";
    dom.pageIndicator.textContent = String(state.page);
    dom.previousPage.disabled = state.page <= 1;
    dom.nextPage.disabled = state.page >= totalPages;
    dom.pagination.hidden = products.length <= state.pageSize;
  }

  function renderResults() {
    const products = filteredProducts();
    const totalPages = pageCount(products);
    if (state.page > totalPages) state.page = totalPages;
    const currentProducts = visibleProducts(products);

    dom.resultCount.textContent = products.length + " product" + (products.length === 1 ? "" : "s");
    updateFilterLabel();
    syncSortControls();

    if (!products.length) {
      const colspan = config.tableColumns.length + 4;
      dom.tableBody.innerHTML = "<tr><td colspan=\"" + colspan + "\"><div class=\"catalog-empty-state\">No products match the current search and filters.</div></td></tr>";
      dom.list.innerHTML = "<div class=\"catalog-empty-state\">No products match the current search and filters.</div>";
      renderPagination(products);
      return;
    }

    dom.tableBody.innerHTML = currentProducts.map(tableRow).join("");
    dom.list.innerHTML = currentProducts.map(gridCard).join("");
    renderPagination(products);
  }

  function refreshFilterResults() {
    renderFilterFields();
    renderResults();
  }

  function setView(view) {
    state.view = view === "list" ? "list" : "table";
    dom.tableWrap.hidden = state.view !== "table";
    dom.list.hidden = state.view !== "list";

    dom.viewButtons.forEach(function (button) {
      const active = button.getAttribute("data-catalog-view") === state.view;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setFilterDrawer(open) {
    document.body.classList.toggle("catalog-filter-open", Boolean(open));
    if (dom.filterDrawer) dom.filterDrawer.setAttribute("aria-hidden", String(!open));
    if (dom.openFilters) dom.openFilters.setAttribute("aria-expanded", String(Boolean(open)));

    if (open) {
      window.setTimeout(function () {
        const closeButton = dom.filterDrawer.querySelector("[data-close-catalog-filters]");
        if (closeButton) closeButton.focus();
      }, 50);
    }
  }

  function updateSearch(value) {
    state.search = String(value || "").trim();
    state.page = 1;
    if (dom.filterSearch && dom.filterSearch.value !== state.search) dom.filterSearch.value = state.search;
    if (dom.headerSearch && dom.headerSearch.value !== state.search) dom.headerSearch.value = state.search;
    refreshFilterResults();
  }

  function clearFilters() {
    state.page = 1;
    state.filters = emptyFilters();
    refreshFilterResults();
  }

  function setSort(key) {
    state.sortKey = key;
    state.sortDirection = "asc";
    state.page = 1;
    renderTableHead();
    renderResults();
  }

  function sortBy(key) {
    if (state.sortKey === key) {
      state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
    } else {
      state.sortKey = key;
      state.sortDirection = "asc";
    }

    state.page = 1;
    renderTableHead();
    renderResults();
  }

  function updatePage(delta) {
    const products = filteredProducts();
    const nextPage = Math.min(Math.max(1, state.page + delta), pageCount(products));
    if (nextPage === state.page) return;

    state.page = nextPage;
    renderResults();
    document.querySelector(".results-table-region").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function filterSummary(product) {
    return config.tableColumns.map(function (column) {
      return "<div class=\"quick-view-spec\"><span>" + core.escapeHtml(column.label) + "</span><strong>" + core.escapeHtml(text(product[column.key])) + "</strong></div>";
    }).join("");
  }

  function quickViewQuantityInput() {
    return dom.modal.querySelector("#quickViewQty");
  }

  function updateQuickViewAddLabel() {
    const quantityInput = quickViewQuantityInput();
    const addButton = dom.modal.querySelector("[data-add-quote]");
    if (!quantityInput || !addButton) return;

    const quantity = quantityApi.normalize(quantityInput.value);
    quantityInput.value = String(quantity);
    addButton.textContent = "Add " + quantity + " to Quote";
  }

  function openQuickView(productId, trigger) {
    const product = productApi.getProductById(productId);
    if (!product) return;

    state.lastFocus = trigger || document.activeElement;
    dom.modalContent.innerHTML = "<div class=\"quick-view-content\">"
      + "<div class=\"quick-view-media\">" + core.renderProductVisual(product, category, "product-hero-visual") + "</div>"
      + "<div class=\"quick-view-copy\">"
      + "<p class=\"catalog-kicker\">" + core.escapeHtml(category.title) + " · " + core.escapeHtml(product.series) + "</p>"
      + "<h2 id=\"quickViewTitle\">" + core.escapeHtml(product.id) + "</h2>"
      + "<p class=\"quick-view-summary\">" + core.escapeHtml(product.summary) + "</p>"
      + "<p class=\"quick-view-description\">" + core.escapeHtml(product.description) + "</p>"
      + "<div class=\"quick-view-specs\">" + filterSummary(product) + "</div>"
      + "<div class=\"quick-view-order-row\">" + quantityApi.markup("quickViewQty", "Quantity") + "<p class=\"quick-view-quote-status\" data-quick-quote-status role=\"status\" aria-live=\"polite\"></p></div>"
      + "<div class=\"quick-view-actions\"><button class=\"btn btn-primary\" type=\"button\" data-add-quote=\"" + core.escapeHtml(product.id) + "\">Add 1 to Quote</button><a class=\"btn btn-secondary\" href=\"" + core.productUrl(product) + "\">View Full Product Page</a></div>"
      + "</div>"
      + "</div>";

    dom.modal.hidden = false;
    document.body.classList.add("quick-view-open");
    updateQuickViewAddLabel();

    const closeButton = dom.modal.querySelector(".quick-view-close");
    if (closeButton) closeButton.focus();
  }

  function closeQuickView() {
    if (dom.modal.hidden) return;
    dom.modal.hidden = true;
    dom.modalContent.innerHTML = "";
    document.body.classList.remove("quick-view-open");
    if (state.lastFocus && typeof state.lastFocus.focus === "function") state.lastFocus.focus();
  }

  const child = category.children.find(function (entry) { return entry.id === initialSubcategory; });
  const pageTitle = child && initialSubcategory !== "all" ? child.title + " " + category.title : category.title;
  document.title = pageTitle + " | SteamSelector Beta";
  dom.title.textContent = pageTitle;
  core.renderBreadcrumbs([
    { label: "Home", href: "index.html" },
    { label: category.title, href: core.categoryUrl(category.id) },
    ...(child && initialSubcategory !== "all" ? [{ label: child.title }] : [])
  ]);

  if (dom.sort) dom.sort.value = state.sortKey;
  if (dom.pageSize) dom.pageSize.value = String(state.pageSize);
  renderFilterFields();
  renderTableHead();
  renderResults();
  setView(config.defaultView);
  quantityApi.bind(document);

  if (dom.headerSearchForm) {
    dom.headerSearchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      updateSearch(dom.headerSearch ? dom.headerSearch.value : "");
    });
  }

  if (dom.headerSearch) dom.headerSearch.addEventListener("input", function () { updateSearch(dom.headerSearch.value); });
  if (dom.filterSearch) dom.filterSearch.addEventListener("input", function () { updateSearch(dom.filterSearch.value); });

  dom.filters.addEventListener("click", function (event) {
    const toggle = event.target.closest("[data-filter-accordion]");
    if (!toggle) return;

    const key = toggle.getAttribute("data-filter-accordion");
    if (state.expandedFilterGroups.has(key)) state.expandedFilterGroups.delete(key);
    else state.expandedFilterGroups.add(key);
    renderFilterFields();
  });

  dom.filters.addEventListener("change", function (event) {
    const drawerSort = event.target.closest("#drawerCatalogSort");
    if (drawerSort) {
      setSort(drawerSort.value);
      return;
    }

    const control = event.target.closest("[data-catalog-filter]");
    if (!control) return;

    const key = control.getAttribute("data-catalog-filter");
    const value = control.getAttribute("data-filter-value");
    const selected = new Set(selectedValues(key));

    if (control.checked) selected.add(value);
    else selected.delete(value);

    state.filters[key] = Array.from(selected);
    state.page = 1;
    refreshFilterResults();
  });

  if (dom.sort) dom.sort.addEventListener("change", function () { setSort(dom.sort.value); });

  if (dom.pageSize) dom.pageSize.addEventListener("change", function () {
    state.pageSize = Number(dom.pageSize.value) || config.pageSize || 25;
    state.page = 1;
    renderResults();
  });

  if (dom.openFilters) dom.openFilters.addEventListener("click", function () { setFilterDrawer(true); });
  dom.closeFilters.forEach(function (button) {
    button.addEventListener("click", function () { setFilterDrawer(false); });
  });
  if (dom.filterBackdrop) dom.filterBackdrop.addEventListener("click", function () { setFilterDrawer(false); });
  if (dom.resetFilters) dom.resetFilters.addEventListener("click", clearFilters);
  dom.previousPage.addEventListener("click", function () { updatePage(-1); });
  dom.nextPage.addEventListener("click", function () { updatePage(1); });

  dom.viewButtons.forEach(function (button) {
    button.addEventListener("click", function () { setView(button.getAttribute("data-catalog-view")); });
  });

  document.addEventListener("steamselector:quantity-change", function (event) {
    if (event.target && event.target.id === "quickViewQty") updateQuickViewAddLabel();
  });

  document.addEventListener("click", function (event) {
    const quickButton = event.target.closest("[data-quick-view]");
    if (quickButton) {
      openQuickView(quickButton.getAttribute("data-quick-view"), quickButton);
      return;
    }

    const sortButton = event.target.closest("[data-column-sort]");
    if (sortButton) {
      sortBy(sortButton.getAttribute("data-column-sort"));
      return;
    }

    if (event.target.closest("[data-quick-close]")) {
      closeQuickView();
      return;
    }

    const addButton = event.target.closest("[data-add-quote]");
    if (addButton) {
      const product = productApi.getProductById(addButton.getAttribute("data-add-quote"));
      if (!product) return;

      const quantityInput = quickViewQuantityInput();
      const quantity = quantityApi.normalize(quantityInput ? quantityInput.value : 1);
      core.quote.add(product, quantity);

      const message = quantity === 1
        ? product.id + " was added to the quote list."
        : quantity + " × " + product.id + " were added to the quote list.";
      const confirmation = dom.modal.querySelector("[data-quick-quote-status]");
      if (confirmation) confirmation.textContent = message;
      dom.status.textContent = message;
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeQuickView();
      setFilterDrawer(false);
    }
  });
})();
