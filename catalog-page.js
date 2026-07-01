/*
  Shared catalog-results controller for every SteamSelector Beta category.
  One controller owns filtering, sorting, view state, Quick View, quantity,
  and quote-list actions so category pages do not need override scripts.
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
  const requestedSubcategory = query.get("type") || "all";
  const validSubcategory = category.children.some(function (entry) {
    return entry.id === requestedSubcategory;
  });
  const initialSubcategory = validSubcategory ? requestedSubcategory : "all";

  const dom = {
    title: document.getElementById("categoryTitle"),
    resultCount: document.getElementById("catalogResultCount"),
    filterLabel: document.getElementById("catalogFilterLabel"),
    pageSizeLabel: document.getElementById("catalogPageSizeLabel"),
    filterDrawer: document.getElementById("catalogFilters"),
    filterBackdrop: document.getElementById("catalogFilterBackdrop"),
    openFilters: document.getElementById("openCatalogFilters"),
    closeFilters: Array.from(document.querySelectorAll("[data-close-catalog-filters]")),
    filters: document.getElementById("catalogFilterFields"),
    headerSearch: document.getElementById("catalogHeaderSearchInput"),
    headerSearchForm: document.getElementById("catalogHeaderSearchForm"),
    resetFilters: document.getElementById("resetCatalogFilters"),
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

  if (!dom.title || !dom.resultCount || !dom.filters || !dom.tableHead || !dom.tableBody || !dom.list
    || !dom.pagination || !dom.previousPage || !dom.nextPage || !dom.modal || !dom.modalContent) return;

  const labels = config.labels || {};
  const filters = Array.isArray(config.filters) ? config.filters : [];
  const tableColumns = Array.isArray(config.tableColumns) ? config.tableColumns : [];
  const quickViewFields = Array.isArray(config.quickViewFields) && config.quickViewFields.length
    ? config.quickViewFields
    : tableColumns;
  const listMetaFields = Array.isArray(config.listMetaFields) && config.listMetaFields.length
    ? config.listMetaFields
    : tableColumns;
  const sortOptions = Array.isArray(config.sortOptions) ? config.sortOptions : [];

  function emptyFilters() {
    const values = {};
    filters.forEach(function (filter) {
      values[filter.key] = [];
    });
    return values;
  }

  const state = {
    view: config.defaultView === "list" ? "list" : "table",
    page: 1,
    pageSize: Number(config.pageSize) || 25,
    search: "",
    sortKey: config.defaultSort || "best-match",
    sortDirection: "asc",
    filters: emptyFilters(),
    expandedFilterGroups: new Set(["series", "size"]),
    lastFocus: null
  };

  if (initialSubcategory !== "all" && Object.prototype.hasOwnProperty.call(state.filters, "subcategory")) {
    state.filters.subcategory = [initialSubcategory];
  }

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

  function formatFieldValue(product, field) {
    const raw = product ? product[field.key] : "";
    if (field && field.format === "title-case") return titleCase(raw);
    return text(raw);
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
    return filters.every(function (filter) {
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
    return filters.reduce(function (count, filter) {
      return count + selectedValues(filter.key).length;
    }, 0);
  }

  function updateFilterLabel() {
    const count = activeFilterCount();
    dom.filterLabel.textContent = count ? "Filter (" + count + ")" : "Filter";
  }

  function sortOptionMarkup() {
    return sortOptions.map(function (option) {
      const selected = option.value === state.sortKey ? " selected" : "";
      return "<option value=\"" + core.escapeHtml(option.value) + "\"" + selected + ">"
        + core.escapeHtml(option.label) + "</option>";
    }).join("");
  }

  function supportsSortDirection() {
    return state.sortKey !== "best-match";
  }

  function directionButtonMarkup(value, label, symbol, disabled) {
    const active = state.sortDirection === value;
    const disabledAttribute = disabled ? " disabled" : "";
    return "<button class=\"catalog-sort-direction-button" + (active ? " is-active" : "") + "\" type=\"button\""
      + " data-catalog-sort-direction=\"" + value + "\" aria-pressed=\"" + String(active) + "\"" + disabledAttribute + ">"
      + "<span class=\"catalog-sort-direction-symbol\" aria-hidden=\"true\">" + symbol + "</span>"
      + "<span>" + label + "</span>"
      + "</button>";
  }

  function renderSortSection() {
    const isOpen = state.expandedFilterGroups.has("sort");
    const directionUnavailable = !supportsSortDirection();
    const directionHelp = directionUnavailable
      ? "Choose a field other than Best Match to set ascending or descending order."
      : "Ascending sorts A–Z or low to high. Descending sorts Z–A or high to low.";

    return "<section class=\"catalog-filter-accordion" + (isOpen ? " is-open" : "") + "\">"
      + "<button class=\"catalog-filter-accordion-toggle\" type=\"button\" data-filter-accordion=\"sort\" aria-expanded=\"" + String(isOpen) + "\">"
      + "<span class=\"catalog-filter-accordion-name\">" + core.escapeHtml(labels.sortResults || "Sort Results") + "</span>"
      + "<span class=\"catalog-filter-accordion-symbol\" aria-hidden=\"true\">" + (isOpen ? "−" : "+") + "</span>"
      + "</button>"
      + "<div class=\"catalog-filter-options\"><div class=\"catalog-filter-sort-options\">"
      + "<select id=\"drawerCatalogSort\" aria-label=\"Sort products\">" + sortOptionMarkup() + "</select>"
      + "<div class=\"catalog-sort-direction-control\" role=\"group\" aria-label=\"" + core.escapeHtml(labels.sortDirection || "Sort direction") + "\">"
      + directionButtonMarkup("asc", "Ascending", "↑", directionUnavailable)
      + directionButtonMarkup("desc", "Descending", "↓", directionUnavailable)
      + "</div>"
      + "<p class=\"catalog-filter-sort-help\">" + directionHelp + "</p>"
      + "</div></div>"
      + "</section>";
  }

  function renderFilterFields() {
    const groups = filters.map(function (filter) {
      const options = core.uniqueValues(allCategoryProducts, filter.key);
      const selected = selectedValues(filter.key);
      const isOpen = state.expandedFilterGroups.has(filter.key);

      if (!options.length) return "";

      const optionsMarkup = options.map(function (option) {
        const checked = selected.includes(option) ? " checked" : "";
        const total = filterOptionCount(filter.key, option);

        return "<label class=\"catalog-filter-option\">"
          + "<input type=\"checkbox\" data-catalog-filter=\"" + core.escapeHtml(filter.key) + "\""
          + " data-filter-value=\"" + core.escapeHtml(option) + "\"" + checked + " />"
          + "<span class=\"catalog-filter-checkbox\" aria-hidden=\"true\"></span>"
          + "<span class=\"catalog-filter-option-label\">" + core.escapeHtml(
            filter.format === "title-case" ? titleCase(option) : option
          ) + "</span>"
          + "<span class=\"catalog-filter-option-total\">(" + total + ")</span>"
          + "</label>";
      }).join("");

      return "<section class=\"catalog-filter-accordion" + (isOpen ? " is-open" : "") + "\">"
        + "<button class=\"catalog-filter-accordion-toggle\" type=\"button\" data-filter-accordion=\""
        + core.escapeHtml(filter.key) + "\" aria-expanded=\"" + String(isOpen) + "\">"
        + "<span class=\"catalog-filter-accordion-name\">" + core.escapeHtml(filter.label)
        + (selected.length ? "<b class=\"catalog-filter-accordion-count\">" + selected.length + "</b>" : "")
        + "</span>"
        + "<span class=\"catalog-filter-accordion-symbol\" aria-hidden=\"true\">" + (isOpen ? "−" : "+") + "</span>"
        + "</button>"
        + "<div class=\"catalog-filter-options\">" + optionsMarkup + "</div>"
        + "</section>";
    }).join("");

    dom.filters.innerHTML = renderSortSection() + groups;
  }

  function renderPageSizeOptions() {
    if (!dom.pageSize) return;
    const configuredSizes = Array.isArray(config.pageSizes) ? config.pageSizes : [state.pageSize];
    const uniqueSizes = configuredSizes
      .map(function (size) { return Number(size); })
      .filter(function (size, index, values) {
        return Number.isFinite(size) && size > 0 && values.indexOf(size) === index;
      });

    if (!uniqueSizes.includes(state.pageSize)) uniqueSizes.push(state.pageSize);
    uniqueSizes.sort(function (left, right) { return left - right; });

    dom.pageSize.innerHTML = uniqueSizes.map(function (size) {
      const selected = size === state.pageSize ? " selected" : "";
      return "<option value=\"" + size + "\"" + selected + ">" + size + "</option>";
    }).join("");

    if (dom.pageSizeLabel) dom.pageSizeLabel.textContent = labels.showResults || "Show:";
  }

  function syncSortControls() {
    const drawerSort = dom.filters.querySelector("#drawerCatalogSort");
    if (drawerSort && drawerSort.value !== state.sortKey) drawerSort.value = state.sortKey;
  }

  function sortHeader(label, key) {
    const active = state.sortKey === key ? " is-active" : "";
    const direction = state.sortKey === key ? " " + state.sortDirection : "";
    return "<button class=\"results-column-button" + active + "\" type=\"button\" data-column-sort=\""
      + core.escapeHtml(key) + "\" aria-label=\"Sort by " + core.escapeHtml(label) + direction + "\">"
      + core.escapeHtml(label) + "</button>";
  }

  function renderTableHead() {
    dom.tableHead.innerHTML = "<tr>"
      + "<th class=\"results-quick-column\">" + core.escapeHtml(labels.quickView || "Quick View") + "</th>"
      + "<th class=\"results-image-column\">" + core.escapeHtml(labels.image || "Image") + "</th>"
      + "<th class=\"results-model-column\">" + sortHeader(labels.model || "Model", "id") + "</th>"
      + tableColumns.map(function (column) {
        return "<th>" + (column.sortable ? sortHeader(column.label, column.key) : core.escapeHtml(column.label)) + "</th>";
      }).join("")
      + "<th class=\"results-action-column\"><span class=\"sr-only\">"
      + core.escapeHtml(labels.productDetails || "Product details") + "</span></th>"
      + "</tr>";
  }

  function quickViewButton(product) {
    return "<button class=\"results-quick-view\" type=\"button\" data-quick-view=\"" + core.escapeHtml(product.id)
      + "\" aria-label=\"Quick view " + core.escapeHtml(product.id) + "\"><span class=\"results-eye-icon\" aria-hidden=\"true\"></span></button>";
  }

  function tableRow(product) {
    const columns = tableColumns.map(function (column) {
      return "<td>" + core.escapeHtml(formatFieldValue(product, column)) + "</td>";
    }).join("");

    return "<tr>"
      + "<td>" + quickViewButton(product) + "</td>"
      + "<td>" + core.renderProductVisual(product, category, "results-product-image") + "</td>"
      + "<td><a class=\"results-model-link\" href=\"" + core.productUrl(product) + "\">" + core.escapeHtml(product.id) + "</a></td>"
      + columns
      + "<td><a class=\"results-detail-link\" href=\"" + core.productUrl(product) + "\" aria-label=\"View "
      + core.escapeHtml(product.id) + " details\">›</a></td>"
      + "</tr>";
  }

  function gridCard(product) {
    const meta = listMetaFields.map(function (field) {
      return "<span>" + core.escapeHtml(formatFieldValue(product, field)) + "</span>";
    }).join("");

    return "<article class=\"results-card\">"
      + quickViewButton(product)
      + core.renderProductVisual(product, category, "results-product-image")
      + "<div class=\"results-card-copy\">"
      + "<a class=\"results-model-link\" href=\"" + core.productUrl(product) + "\">" + core.escapeHtml(product.id) + "</a>"
      + "<p>" + core.escapeHtml(product.summary) + "</p>"
      + "<div class=\"results-card-meta\">" + meta + "</div>"
      + "</div>"
      + "<div class=\"results-card-actions\"><span>" + core.escapeHtml(titleCase(product.subcategory)) + "</span>"
      + "<a class=\"results-detail-link\" href=\"" + core.productUrl(product) + "\" aria-label=\"View "
      + core.escapeHtml(product.id) + " details\">›</a></div>"
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
      const colspan = tableColumns.length + 4;
      dom.tableBody.innerHTML = "<tr><td colspan=\"" + colspan
        + "\"><div class=\"catalog-empty-state\">No products match the current search and filters.</div></td></tr>";
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
    renderTableHead();
    renderResults();
  }

  function setView(view) {
    state.view = view === "list" ? "list" : "table";
    dom.tableWrap.hidden = state.view !== "table";
    dom.list.hidden = state.view !== "list";
    dom.tableWrap.classList.toggle("is-active-view", state.view === "table");
    dom.list.classList.toggle("is-active-view", state.view === "list");

    dom.viewButtons.forEach(function (button) {
      const active = button.getAttribute("data-catalog-view") === state.view;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setFilterDrawer(open) {
    document.body.classList.toggle("catalog-filter-open", Boolean(open));
    dom.filterDrawer.setAttribute("aria-hidden", String(!open));
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
    if (dom.headerSearch && dom.headerSearch.value !== state.search) dom.headerSearch.value = state.search;
    refreshFilterResults();
  }

  function renderPageIdentity() {
    const selectedSubcategories = selectedValues("subcategory");
    const selectedChild = selectedSubcategories.length === 1
      ? category.children.find(function (entry) { return entry.id === selectedSubcategories[0]; })
      : null;
    const pageTitle = selectedChild ? selectedChild.title + " " + category.title : category.title;

    document.title = pageTitle + " | SteamSelector Beta";
    dom.title.textContent = pageTitle;
    core.renderBreadcrumbs([
      { label: "Home", href: "index.html" },
      { label: category.title, href: core.categoryUrl(category.id) },
      ...(selectedChild ? [{ label: selectedChild.title }] : [])
    ]);
  }

  function clearSubcategoryFromUrl() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("type")) return;
    url.searchParams.delete("type");
    window.history.replaceState({}, "", url.pathname + (url.search || "") + url.hash);
  }

  function clearFilters() {
    state.page = 1;
    state.filters = emptyFilters();
    clearSubcategoryFromUrl();
    renderPageIdentity();
    refreshFilterResults();
  }

  function setSort(key) {
    state.sortKey = key;
    state.sortDirection = "asc";
    state.page = 1;
    refreshFilterResults();
  }

  function setSortDirection(direction) {
    if (!supportsSortDirection()) return;
    state.sortDirection = direction === "desc" ? "desc" : "asc";
    state.page = 1;
    refreshFilterResults();
  }

  function sortBy(key) {
    if (state.sortKey === key) {
      state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
    } else {
      state.sortKey = key;
      state.sortDirection = "asc";
    }

    state.page = 1;
    refreshFilterResults();
  }

  function updatePage(delta) {
    const products = filteredProducts();
    const nextPage = Math.min(Math.max(1, state.page + delta), pageCount(products));
    if (nextPage === state.page) return;

    state.page = nextPage;
    renderResults();
    const region = document.querySelector(".results-table-region");
    if (region) region.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function quickViewSpecMarkup(product) {
    return quickViewFields.map(function (field, index) {
      const icons = ["◫", "◌", "↔", "◷"];
      return "<div class=\"quick-view-spec\">"
        + "<span class=\"quick-view-spec-icon\" aria-hidden=\"true\">" + icons[index % icons.length] + "</span>"
        + "<div class=\"quick-view-spec-copy\"><span>" + core.escapeHtml(field.label) + "</span><strong>"
        + core.escapeHtml(formatFieldValue(product, field)) + "</strong></div>"
        + "</div>";
    }).join("");
  }

  function documentDefinition(product, key, fallbackTitle) {
    const documents = product.documents || {};
    const configured = documents[key] || {};
    const url = String(configured.url || product[key + "Url"] || "").trim();
    const title = configured.title || fallbackTitle;
    const meta = configured.meta || "";
    return { url: url, title: title, meta: meta };
  }

  function documentMarkup(definition) {
    const inactive = !definition.url;
    const common = "<span class=\"quick-view-document-pdf\" aria-hidden=\"true\">PDF</span>"
      + "<span class=\"quick-view-document-copy\"><strong>" + core.escapeHtml(definition.title) + "</strong>"
      + (definition.meta ? "<small>" + core.escapeHtml(definition.meta) + "</small>"
        : inactive ? "<small>Not available in this beta catalog</small>" : "")
      + "</span><span class=\"quick-view-document-action\" aria-hidden=\"true\">" + (inactive ? "—" : "⇩") + "</span>";

    if (inactive) {
      return "<div class=\"quick-view-document is-unavailable\" aria-disabled=\"true\">" + common + "</div>";
    }

    return "<a class=\"quick-view-document\" href=\"" + core.escapeHtml(definition.url)
      + "\" target=\"_blank\" rel=\"noopener\">" + common + "</a>";
  }

  function quickViewQuantityInput() {
    return dom.modal.querySelector("#quickViewQty");
  }

  function updateQuickViewAddLabel() {
    const quantityInput = quickViewQuantityInput();
    const addButton = dom.modal.querySelector("[data-quick-view-add]");
    if (!quantityInput || !addButton) return;

    const quantity = quantityApi.normalize(quantityInput.value);
    quantityInput.value = String(quantity);
    addButton.innerHTML = "<span class=\"quick-view-cart-mark\" aria-hidden=\"true\">⌑</span><span>Add "
      + quantity + " to Quote</span>";
  }

  function openQuickView(productId, trigger) {
    const product = productApi.getProductById(productId);
    if (!product) return;

    const productCategory = categoryApi.getCategoryById(product.category);
    const documents = labels.documents || {};
    const specSheet = documentDefinition(product, "specSheet", documents.specSheet || "Product Spec Sheet PDF");
    const manual = documentDefinition(product, "manual", documents.manual || "Manual PDF");
    state.lastFocus = trigger || document.activeElement;

    dom.modalContent.innerHTML = "<div class=\"quick-view-redesign\">"
      + "<div class=\"quick-view-hero\">"
      + "<div class=\"quick-view-media\">" + core.renderProductVisual(product, productCategory, "product-hero-visual") + "</div>"
      + "<div class=\"quick-view-copy\">"
      + "<p class=\"catalog-kicker\">" + core.escapeHtml(productCategory ? productCategory.title : "Products") + " · "
      + core.escapeHtml(product.series || product.id) + "</p>"
      + "<h2 id=\"quickViewTitle\">" + core.escapeHtml(product.id) + "</h2>"
      + "<p class=\"quick-view-summary\">" + core.escapeHtml(product.summary || "") + "</p>"
      + "<p class=\"quick-view-description\">" + core.escapeHtml(product.description || "") + "</p>"
      + "</div></div>"
      + "<div class=\"quick-view-details\">"
      + "<section class=\"quick-view-spec-section\"><h3 class=\"quick-view-section-title\">Key Specifications</h3>"
      + "<div class=\"quick-view-specs\">" + quickViewSpecMarkup(product) + "</div></section>"
      + "<section class=\"quick-view-quantity-section\"><h3 class=\"quick-view-section-title\">Quantity</h3>"
      + "<div class=\"quick-view-order-row\">" + quantityApi.markup("quickViewQty", "Quantity")
      + "<p class=\"quick-view-quote-status\" data-quick-view-status role=\"status\" aria-live=\"polite\"></p></div></section>"
      + "<section class=\"quick-view-documents-section\"><h3 class=\"quick-view-section-title\">Documents</h3>"
      + "<div class=\"quick-view-document-list\">" + documentMarkup(specSheet) + documentMarkup(manual) + "</div></section>"
      + "</div>"
      + "<div class=\"quick-view-actions\">"
      + "<button class=\"btn btn-primary\" type=\"button\" data-quick-view-add=\"" + core.escapeHtml(product.id) + "\">"
      + "<span class=\"quick-view-cart-mark\" aria-hidden=\"true\">⌑</span><span>Add 1 to Quote</span></button>"
      + "<a class=\"btn btn-secondary\" href=\"" + core.productUrl(product) + "\">View Full Product Page</a>"
      + "</div></div>";

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

  function addQuickViewProduct(productId) {
    const product = productApi.getProductById(productId);
    if (!product) return;

    const input = quickViewQuantityInput();
    const quantity = quantityApi.normalize(input ? input.value : 1);
    core.quote.add(product, quantity);

    const message = quantity === 1
      ? product.id + " was added to the quote list."
      : quantity + " × " + product.id + " were added to the quote list.";
    const confirmation = dom.modal.querySelector("[data-quick-view-status]");

    if (confirmation) confirmation.textContent = message;
    if (dom.status) dom.status.textContent = message;
  }

  renderPageIdentity();
  renderPageSizeOptions();
  renderFilterFields();
  renderTableHead();
  renderResults();
  setView(state.view);
  quantityApi.bind(document);

  if (dom.headerSearchForm) {
    dom.headerSearchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      updateSearch(dom.headerSearch ? dom.headerSearch.value : "");
    });
  }

  if (dom.headerSearch) {
    dom.headerSearch.addEventListener("input", function () {
      updateSearch(dom.headerSearch.value);
    });
  }

  dom.filters.addEventListener("click", function (event) {
    const accordion = event.target.closest("[data-filter-accordion]");
    if (accordion) {
      const key = accordion.getAttribute("data-filter-accordion");
      if (state.expandedFilterGroups.has(key)) state.expandedFilterGroups.delete(key);
      else state.expandedFilterGroups.add(key);
      renderFilterFields();
      return;
    }

    const directionButton = event.target.closest("[data-catalog-sort-direction]");
    if (directionButton && !directionButton.disabled) {
      setSortDirection(directionButton.getAttribute("data-catalog-sort-direction"));
    }
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
    if (key === "subcategory") renderPageIdentity();
    refreshFilterResults();
  });

  if (dom.pageSize) {
    dom.pageSize.addEventListener("change", function () {
      state.pageSize = Number(dom.pageSize.value) || Number(config.pageSize) || 25;
      state.page = 1;
      renderResults();
    });
  }

  if (dom.openFilters) dom.openFilters.addEventListener("click", function () { setFilterDrawer(true); });
  dom.closeFilters.forEach(function (button) {
    button.addEventListener("click", function () { setFilterDrawer(false); });
  });
  if (dom.filterBackdrop) dom.filterBackdrop.addEventListener("click", function () { setFilterDrawer(false); });
  if (dom.resetFilters) dom.resetFilters.addEventListener("click", clearFilters);
  dom.previousPage.addEventListener("click", function () { updatePage(-1); });
  dom.nextPage.addEventListener("click", function () { updatePage(1); });

  dom.viewButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setView(button.getAttribute("data-catalog-view"));
    });
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

    const addButton = event.target.closest("[data-quick-view-add]");
    if (addButton) addQuickViewProduct(addButton.getAttribute("data-quick-view-add"));
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeQuickView();
      setFilterDrawer(false);
    }
  });
})();
