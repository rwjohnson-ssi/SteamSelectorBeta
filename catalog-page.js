/*
  One shared catalog controller for every product category.
  Route examples:
    category.html?id=steam-traps
    category.html?id=regulators&type=pilot-operated
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

  const dom = {
    title: document.getElementById("categoryTitle"),
    description: document.getElementById("categoryDescription"),
    filters: document.getElementById("catalogFilterFields"),
    search: document.getElementById("catalogSearch"),
    applyFilters: document.getElementById("applyCatalogFilters"),
    resetFilters: document.getElementById("resetCatalogFilters"),
    mobileFilters: document.getElementById("openCatalogFilters"),
    closeFilters: document.getElementById("closeCatalogFilters"),
    filterBackdrop: document.getElementById("catalogFilterBackdrop"),
    resultCount: document.getElementById("catalogResultCount"),
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

  if (!dom.title || !dom.filters || !dom.search || !dom.tableHead || !dom.tableBody || !dom.list || !dom.modal || !dom.modalContent) return;

  const initialSubcategory = query.get("type") || "all";
  const state = {
    view: config.defaultView || "table",
    page: 1,
    pageSize: config.pageSize || 10,
    search: "",
    filters: {
      subcategory: initialSubcategory,
      series: "all",
      size: "all",
      connection: "all",
      material: "all"
    },
    lastFocus: null
  };

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

  function filteredProducts() {
    return allCategoryProducts.filter(function (product) {
      if (!core.productMatches(product, state.search)) return false;

      return config.filters.every(function (filter) {
        const selected = state.filters[filter.key] || "all";
        return selected === "all" || product[filter.key] === selected;
      });
    });
  }

  function visibleProducts(products) {
    const start = (state.page - 1) * state.pageSize;
    return products.slice(start, start + state.pageSize);
  }

  function pageCount(products) {
    return Math.max(1, Math.ceil(products.length / state.pageSize));
  }

  function renderFilterFields() {
    dom.filters.innerHTML = config.filters
      .map(function (filter) {
        const options = core.uniqueValues(allCategoryProducts, filter.key);
        const currentValue = state.filters[filter.key] || "all";
        const isUseful = options.length > 1;

        if (!isUseful && filter.key !== "subcategory") return "";

        const optionMarkup = ["<option value=\"all\">All</option>"]
          .concat(options.map(function (option) {
            const selected = currentValue === option ? " selected" : "";
            return "<option value=\"" + core.escapeHtml(option) + "\"" + selected + ">" + core.escapeHtml(titleCase(option)) + "</option>";
          }))
          .join("");

        return "<label class=\"catalog-filter-field\">"
          + "<span>" + core.escapeHtml(filter.label) + "</span>"
          + "<select data-catalog-filter=\"" + core.escapeHtml(filter.key) + "\">" + optionMarkup + "</select>"
          + "</label>";
      })
      .join("");
  }

  function renderTableHead() {
    dom.tableHead.innerHTML = "<tr>"
      + "<th class=\"catalog-table-quick\"><span class=\"sr-only\">Quick View</span></th>"
      + "<th class=\"catalog-table-image\">Image</th>"
      + "<th>Model</th>"
      + config.tableColumns.map(function (column) { return "<th>" + core.escapeHtml(column.label) + "</th>"; }).join("")
      + "<th><span class=\"sr-only\">Product details</span></th>"
      + "</tr>";
  }

  function quickViewButton(product) {
    return "<button class=\"catalog-quick-button\" type=\"button\" data-quick-view=\"" + core.escapeHtml(product.id) + "\" aria-label=\"Quick view " + core.escapeHtml(product.id) + "\">+</button>";
  }

  function tableRow(product) {
    const visual = core.renderProductVisual(product, category, "product-thumb");
    const columnCells = config.tableColumns
      .map(function (column) {
        return "<td>" + core.escapeHtml(text(product[column.key])) + "</td>";
      })
      .join("");

    return "<tr>"
      + "<td>" + quickViewButton(product) + "</td>"
      + "<td>" + visual + "</td>"
      + "<td><a class=\"catalog-model-link\" href=\"" + core.productUrl(product) + "\">" + core.escapeHtml(product.id) + "</a><span class=\"mobile-product-summary\">" + core.escapeHtml(product.summary) + "</span></td>"
      + columnCells
      + "<td><a class=\"catalog-detail-link\" href=\"" + core.productUrl(product) + "\">Details</a></td>"
      + "</tr>";
  }

  function card(product) {
    return "<article class=\"catalog-card\">"
      + quickViewButton(product)
      + core.renderProductVisual(product, category, "product-thumb")
      + "<div class=\"catalog-card-copy\">"
      + "<div class=\"catalog-card-heading\"><a class=\"catalog-model-link\" href=\"" + core.productUrl(product) + "\">" + core.escapeHtml(product.id) + "</a><span class=\"catalog-card-series\">" + core.escapeHtml(product.series) + "</span></div>"
      + "<p>" + core.escapeHtml(product.summary) + "</p>"
      + "<div class=\"catalog-card-meta\"><span>" + core.escapeHtml(text(product.size)) + "</span><span>" + core.escapeHtml(text(product.connection)) + "</span><span>" + core.escapeHtml(text(product.material)) + "</span></div>"
      + "</div>"
      + "<a class=\"catalog-detail-link\" href=\"" + core.productUrl(product) + "\">Details ›</a>"
      + "</article>";
  }

  function renderPagination(products) {
    const totalPages = pageCount(products);
    const start = products.length ? (state.page - 1) * state.pageSize + 1 : 0;
    const end = Math.min(state.page * state.pageSize, products.length);

    dom.paginationSummary.textContent = "Showing " + start + "–" + end + " of " + products.length;
    dom.pageIndicator.textContent = "Page " + state.page + " of " + totalPages;
    dom.previousPage.disabled = state.page <= 1;
    dom.nextPage.disabled = state.page >= totalPages;
    dom.pagination.hidden = products.length <= state.pageSize;
  }

  function renderResults() {
    const products = filteredProducts();
    const totalPages = pageCount(products);
    if (state.page > totalPages) state.page = totalPages;
    const currentProducts = visibleProducts(products);

    dom.resultCount.textContent = products.length + " matching product" + (products.length === 1 ? "" : "s");

    if (!products.length) {
      const empty = "<tr><td colspan=\"" + (config.tableColumns.length + 4) + "\"><div class=\"catalog-empty-state\">No products match the current search and filters.</div></td></tr>";
      dom.tableBody.innerHTML = empty;
      dom.list.innerHTML = "<div class=\"catalog-empty-state\">No products match the current search and filters.</div>";
      renderPagination(products);
      return;
    }

    dom.tableBody.innerHTML = currentProducts.map(tableRow).join("");
    dom.list.innerHTML = currentProducts.map(card).join("");
    renderPagination(products);
  }

  function setView(nextView) {
    state.view = nextView === "list" ? "list" : "table";
    dom.tableWrap.hidden = state.view !== "table";
    dom.list.hidden = state.view !== "list";

    dom.viewButtons.forEach(function (button) {
      const active = button.getAttribute("data-catalog-view") === state.view;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function filterSummary(product) {
    return config.tableColumns
      .map(function (column) {
        return "<div class=\"quick-view-spec\"><span>" + core.escapeHtml(column.label) + "</span><strong>" + core.escapeHtml(text(product[column.key])) + "</strong></div>";
      })
      .join("");
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
      + "<div class=\"quick-view-order-row\">"
      + quantityApi.markup("quickViewQty", "Quantity")
      + "<p class=\"quick-view-quote-status\" data-quick-quote-status role=\"status\" aria-live=\"polite\"></p>"
      + "</div>"
      + "<div class=\"quick-view-actions\">"
      + "<button class=\"btn btn-primary\" type=\"button\" data-add-quote=\"" + core.escapeHtml(product.id) + "\">Add 1 to Quote</button>"
      + "<a class=\"btn btn-secondary\" href=\"" + core.productUrl(product) + "\">View Full Product Page</a>"
      + "</div>"
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

  function setFilterDrawer(open) {
    document.body.classList.toggle("catalog-filter-open", Boolean(open));
  }

  function resetFilters() {
    state.search = "";
    state.page = 1;
    config.filters.forEach(function (filter) {
      state.filters[filter.key] = filter.key === "subcategory" ? initialSubcategory : "all";
    });
    dom.search.value = "";
    renderFilterFields();
    renderResults();
  }

  function updatePage(delta) {
    const products = filteredProducts();
    const nextPage = Math.min(Math.max(1, state.page + delta), pageCount(products));
    if (nextPage === state.page) return;
    state.page = nextPage;
    renderResults();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  dom.title.textContent = category.title;
  dom.description.textContent = category.description;
  document.title = category.title + " | SteamSelector Beta";
  core.renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: category.title }]);
  renderFilterFields();
  renderTableHead();
  renderResults();
  setView(config.defaultView);

  quantityApi.bind(document);

  dom.search.addEventListener("input", function () {
    state.search = dom.search.value.trim();
    state.page = 1;
    renderResults();
  });

  dom.filters.addEventListener("change", function (event) {
    const control = event.target.closest("[data-catalog-filter]");
    if (!control) return;
    state.filters[control.getAttribute("data-catalog-filter")] = control.value;
    state.page = 1;
    renderResults();
  });

  dom.applyFilters.addEventListener("click", function () {
    state.page = 1;
    renderResults();
    setFilterDrawer(false);
  });

  dom.resetFilters.addEventListener("click", resetFilters);
  dom.mobileFilters.addEventListener("click", function () { setFilterDrawer(true); });
  dom.closeFilters.addEventListener("click", function () { setFilterDrawer(false); });
  dom.filterBackdrop.addEventListener("click", function () { setFilterDrawer(false); });
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

      const confirmation = dom.modal.querySelector("[data-quick-quote-status]");
      const message = quantity === 1
        ? product.id + " was added to the quote list."
        : quantity + " × " + product.id + " were added to the quote list.";

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
