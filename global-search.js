/* Shared global product search for SteamSelector Beta. */
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const productApi = window.SteamSelectorProducts;
  const categoryApi = window.SteamSelectorCategories;
  const overlay = document.getElementById("globalSearchOverlay");
  if (!core || !productApi || !categoryApi || !overlay) return;

  const config = window.SteamSelectorGlobalSearchConfig || {};
  const HISTORY_KEY = "steamselector_global_search_history_v1";
  const maxSuggestions = Number(config.maximumSuggestions) || 7;
  const maxProducts = Number(config.maximumProducts) || 6;
  const apiEndpoint = String(config.apiEndpoint || "").trim();
  const requestTimeoutMs = Number(config.requestTimeoutMs) || 2200;

  const input = document.getElementById("globalSearchInput");
  const clearButton = document.getElementById("globalSearchClear");
  const closeButtons = Array.from(overlay.querySelectorAll("[data-global-search-close]"));
  const content = document.getElementById("globalSearchContent");
  const status = document.getElementById("globalSearchStatus");
  const form = document.getElementById("globalSearchForm");
  const categories = categoryApi.getAllCategories();
  const products = productApi.getAllProducts();

  let activeDepartment = "all";
  let lastFocus = null;
  let debounceTimer = null;
  let requestSequence = 0;

  function escape(value) {
    return core.escapeHtml(value == null ? "" : value);
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function readable(value) {
    return String(value || "")
      .split("-")
      .filter(Boolean)
      .map(function (part) { return part.charAt(0).toUpperCase() + part.slice(1); })
      .join(" ");
  }

  function categoryById(id) {
    return categories.find(function (category) { return category.id === id; }) || null;
  }

  function categoryTitle(id) {
    const category = categoryById(id);
    return category ? category.title : "All Departments";
  }

  function productMatchesDepartment(product) {
    return activeDepartment === "all" || product.category === activeDepartment;
  }

  function productScore(product, query) {
    const value = normalize(query);
    if (!value) return 0;

    const id = normalize(product.id);
    const series = normalize(product.series);
    const category = normalize(categoryTitle(product.category));
    const subcategory = normalize(readable(product.subcategory));
    const summary = normalize(product.summary);
    const description = normalize(product.description);
    let score = 0;

    if (id === value) score += 1000;
    if (id.startsWith(value)) score += 700;
    if (series === value) score += 620;
    if (series.startsWith(value)) score += 500;
    if (subcategory.startsWith(value)) score += 420;
    if (category.startsWith(value)) score += 390;
    if (summary.startsWith(value)) score += 300;
    if (id.includes(value)) score += 200;
    if (series.includes(value)) score += 160;
    if (subcategory.includes(value) || category.includes(value)) score += 140;
    if (summary.includes(value)) score += 100;
    if (description.includes(value)) score += 70;
    return score;
  }

  function uniqueBy(items, key) {
    const seen = new Set();
    return items.filter(function (item) {
      const value = key(item);
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  function localSuggestions(query) {
    const normalized = normalize(query);
    const scopedProducts = products.filter(productMatchesDepartment);

    if (!normalized) {
      return { suggestions: [], products: [] };
    }

    const productMatches = scopedProducts
      .map(function (product) { return { product: product, score: productScore(product, normalized) }; })
      .filter(function (entry) { return entry.score > 0; })
      .sort(function (left, right) {
        return right.score - left.score || left.product.id.localeCompare(right.product.id, undefined, { numeric: true });
      })
      .slice(0, maxProducts)
      .map(function (entry) { return entry.product; });

    const termEntries = [];
    categories.forEach(function (category) {
      if (activeDepartment !== "all" && category.id !== activeDepartment) return;
      termEntries.push({ term: category.title, type: "Department" });
      category.children.forEach(function (child) {
        if (child.id !== "all") termEntries.push({ term: child.title, type: category.title });
      });
    });

    scopedProducts.forEach(function (product) {
      termEntries.push({ term: product.id, type: "Model" });
      termEntries.push({ term: product.series, type: "Series" });
      if (product.subcategory && product.subcategory !== "all") termEntries.push({ term: readable(product.subcategory), type: "Product Type" });
      const summaryPhrase = String(product.summary || "").replace(/[.]/g, "").trim();
      if (summaryPhrase) termEntries.push({ term: summaryPhrase, type: "Application" });
    });

    const suggestions = uniqueBy(termEntries, function (entry) { return normalize(entry.term); })
      .map(function (entry) {
        const score = normalize(entry.term).startsWith(normalized) ? 300 : normalize(entry.term).includes(normalized) ? 120 : 0;
        return Object.assign({}, entry, { score: score });
      })
      .filter(function (entry) { return entry.score > 0; })
      .sort(function (left, right) {
        return right.score - left.score || left.term.localeCompare(right.term, undefined, { numeric: true });
      })
      .slice(0, maxSuggestions);

    return { suggestions: suggestions, products: productMatches };
  }

  function normalizeRemotePayload(payload) {
    const data = payload && typeof payload === "object" ? payload : {};
    const remoteSuggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
    const remoteProducts = Array.isArray(data.products) ? data.products : [];

    return {
      suggestions: remoteSuggestions.slice(0, maxSuggestions).map(function (item) {
        return typeof item === "string"
          ? { term: item, type: "Suggestion" }
          : { term: item.term || item.label || item.value || "", type: item.type || "Suggestion" };
      }).filter(function (item) { return item.term; }),
      products: remoteProducts.slice(0, maxProducts).filter(function (product) { return product && product.id; })
    };
  }

  async function remoteSuggestions(query) {
    if (!apiEndpoint || !query) return null;

    const controller = typeof AbortController === "undefined" ? null : new AbortController();
    const timeout = controller ? window.setTimeout(function () { controller.abort(); }, requestTimeoutMs) : null;
    const url = new URL(apiEndpoint, window.location.origin);
    url.searchParams.set("q", query);
    if (activeDepartment !== "all") url.searchParams.set("category", activeDepartment);

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: controller ? controller.signal : undefined
      });
      if (!response.ok) throw new Error("Search API returned " + response.status);
      return normalizeRemotePayload(await response.json());
    } catch (error) {
      return null;
    } finally {
      if (timeout) window.clearTimeout(timeout);
    }
  }

  function loadHistory() {
    try {
      const values = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(values) ? values.filter(function (entry) { return entry && entry.query; }).slice(0, 8) : [];
    } catch (error) {
      return [];
    }
  }

  function saveHistory(query) {
    const term = String(query || "").trim();
    if (!term) return;

    const entries = loadHistory().filter(function (entry) { return normalize(entry.query) !== normalize(term); });
    entries.unshift({ query: term, department: activeDepartment, savedAt: Date.now() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 8)));
  }

  function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
    renderEmptyState();
  }

  function globalSearchUrl(query) {
    const parameters = new URLSearchParams();
    parameters.set("q", query);
    if (activeDepartment !== "all") parameters.set("category", activeDepartment);
    return "search.html?" + parameters.toString();
  }

  function rowButton(label, subtitle, attributes, className) {
    return "<button class=\"global-search-row " + (className || "") + "\" type=\"button\" " + attributes + ">"
      + "<span><strong>" + escape(label) + "</strong>" + (subtitle ? "<small>" + escape(subtitle) + "</small>" : "") + "</span>"
      + "<span class=\"global-search-row-icon\" aria-hidden=\"true\">↗</span>"
      + "</button>";
  }

  function productRow(product) {
    const category = categoryById(product.category);
    const subtitle = (category ? category.title : "Product") + " · " + (product.series || product.subcategory || "Model");
    return "<a class=\"global-search-row is-product\" href=\"" + escape(core.productUrl(product)) + "\" data-global-product=\"" + escape(product.id) + "\">"
      + "<span><strong>" + escape(product.id) + "</strong><small>" + escape(subtitle) + "</small><span>" + escape(product.summary || "") + "</span></span>"
      + "<span class=\"global-search-row-icon\" aria-hidden=\"true\">›</span>"
      + "</a>";
  }

  function scopeControls() {
    return "<section class=\"global-search-section\"><h2 class=\"global-search-section-heading\">Search In</h2>"
      + "<div class=\"global-search-scope\">"
      + "<button class=\"global-search-scope-button" + (activeDepartment === "all" ? " is-active" : "") + "\" type=\"button\" data-global-department=\"all\">All Departments</button>"
      + categories.map(function (category) {
        return "<button class=\"global-search-scope-button" + (activeDepartment === category.id ? " is-active" : "") + "\" type=\"button\" data-global-department=\"" + escape(category.id) + "\">" + escape(category.title) + "</button>";
      }).join("")
      + "</div></section>";
  }

  function departmentBrowser() {
    return "<section class=\"global-search-section\">"
      + "<div class=\"global-search-departments-title\"><span>Browse All Departments</span><span aria-hidden=\"true\">›</span></div>"
      + "<div class=\"global-search-department-grid\">"
      + categories.map(function (category) {
        return "<a class=\"global-search-department-card\" href=\"" + escape(core.categoryUrl(category.id)) + "\">"
          + "<span class=\"global-search-department-mark\">" + escape(category.icon) + "</span><strong>" + escape(category.title) + "</strong>"
          + "</a>";
      }).join("")
      + "</div></section>";
  }

  function renderEmptyState() {
    const history = loadHistory();
    const historyMarkup = history.length
      ? "<section class=\"global-search-section\"><h2 class=\"global-search-section-heading\">Search History</h2><div class=\"global-search-list\">"
        + history.map(function (entry) {
          const subtitle = entry.department && entry.department !== "all" ? categoryTitle(entry.department) : "All Departments";
          return rowButton(entry.query, subtitle, "data-global-history=\"" + escape(entry.query) + "\" data-global-history-department=\"" + escape(entry.department || "all") + "\"");
        }).join("")
        + "<div class=\"global-search-history-actions\"><button class=\"global-search-history-clear\" type=\"button\" data-global-clear-history>Clear Search History</button><button class=\"global-search-history-clear-icon\" type=\"button\" data-global-clear-history aria-label=\"Clear search history\">×</button></div></div></section>"
      : "<section class=\"global-search-section\"><div class=\"global-search-empty\">Search by model number, series, product type, or application.</div></section>";

    content.innerHTML = historyMarkup + departmentBrowser();
  }

  function renderSuggestions(query, payload) {
    const suggestions = payload.suggestions || [];
    const matchedProducts = payload.products || [];
    const suggestionMarkup = suggestions.length
      ? "<section class=\"global-search-section\"><h2 class=\"global-search-section-heading\">Suggestions</h2><div class=\"global-search-list\">"
        + suggestions.map(function (item) {
          return rowButton(item.term, item.type, "data-global-suggestion=\"" + escape(item.term) + "\"");
        }).join("")
        + "</div></section>"
      : "";
    const productMarkup = matchedProducts.length
      ? "<section class=\"global-search-section\"><h2 class=\"global-search-section-heading\">Matching Products</h2><div class=\"global-search-list\">"
        + matchedProducts.map(productRow).join("")
        + "</div></section>"
      : "";
    const emptyMarkup = !suggestions.length && !matchedProducts.length
      ? "<section class=\"global-search-section\"><div class=\"global-search-empty\">No public beta products match \"" + escape(query) + "\" in " + escape(categoryTitle(activeDepartment)) + ". Try another term or browse departments below.</div></section>"
      : "";

    content.innerHTML = scopeControls() + suggestionMarkup + productMarkup + emptyMarkup + departmentBrowser();
  }

  async function renderForQuery(query) {
    const term = String(query || "").trim();
    const requestId = ++requestSequence;
    clearButton.hidden = !term;

    if (!term) {
      status.textContent = "";
      renderEmptyState();
      return;
    }

    status.textContent = "Searching " + categoryTitle(activeDepartment) + "…";
    const remote = await remoteSuggestions(term);
    if (requestId !== requestSequence) return;
    const payload = remote || localSuggestions(term);
    renderSuggestions(term, payload);
    status.textContent = remote ? "Live suggestions" : "Suggestions from the public beta catalog";
  }

  function scheduleRender() {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(function () {
      renderForQuery(input.value);
    }, 120);
  }

  function openSearch(value, trigger) {
    lastFocus = trigger || document.activeElement;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-open");
    document.body.classList.add("global-search-open");
    input.value = String(value || "");
    clearButton.hidden = !input.value;
    renderForQuery(input.value);
    window.setTimeout(function () { input.focus(); }, 40);
  }

  function closeSearch() {
    overlay.classList.remove("is-open");
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("global-search-open");
    window.clearTimeout(debounceTimer);
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function submitSearch(query) {
    const term = String(query || "").trim();
    if (!term) {
      window.location.href = "index.html#browse-categories";
      return;
    }
    saveHistory(term);
    window.location.href = globalSearchUrl(term);
  }

  function showUnavailableMessage(label) {
    let toast = document.getElementById("globalSearchToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "globalSearchToast";
      toast.className = "global-search-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = label + " lookup is planned for a future SteamSelector release.";
    toast.hidden = false;
    window.clearTimeout(showUnavailableMessage.timer);
    showUnavailableMessage.timer = window.setTimeout(function () { toast.hidden = true; }, 2800);
  }

  function bindEntryInput(selector) {
    const entry = document.querySelector(selector);
    if (!entry) return;

    entry.addEventListener("focus", function () {
      if (window.matchMedia("(max-width: 760px)").matches) openSearch(entry.value, entry);
    });

    entry.addEventListener("click", function () {
      if (window.matchMedia("(max-width: 760px)").matches) openSearch(entry.value, entry);
    });
  }

  bindEntryInput("#catalogHeaderSearchInput");
  bindEntryInput("#modelSearchInput");

  document.addEventListener("click", function (event) {
    const openButton = event.target.closest("[data-global-search-open]");
    if (openButton) {
      event.preventDefault();
      openSearch("", openButton);
      return;
    }

    if (event.target.closest("[data-global-search-close]")) {
      closeSearch();
      return;
    }

    if (event.target.closest("[data-global-search-clear]")) {
      input.value = "";
      clearButton.hidden = true;
      renderForQuery("");
      input.focus();
      return;
    }

    const history = event.target.closest("[data-global-history]");
    if (history) {
      activeDepartment = history.getAttribute("data-global-history-department") || "all";
      input.value = history.getAttribute("data-global-history") || "";
      submitSearch(input.value);
      return;
    }

    const suggestion = event.target.closest("[data-global-suggestion]");
    if (suggestion) {
      const value = suggestion.getAttribute("data-global-suggestion") || "";
      input.value = value;
      submitSearch(value);
      return;
    }

    const department = event.target.closest("[data-global-department]");
    if (department) {
      activeDepartment = department.getAttribute("data-global-department") || "all";
      renderForQuery(input.value);
      return;
    }

    if (event.target.closest("[data-global-clear-history]")) {
      clearHistory();
      return;
    }

    const placeholder = event.target.closest("[data-global-search-placeholder]");
    if (placeholder) showUnavailableMessage(placeholder.getAttribute("data-global-search-placeholder"));
  });

  input.addEventListener("input", scheduleRender);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    submitSearch(input.value);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) closeSearch();
  });

  window.SteamSelectorGlobalSearch = {
    open: openSearch,
    close: closeSearch,
    search: submitSearch
  };
})();
