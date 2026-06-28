/* Shared SteamSelector Beta site header, mobile navigation, and global search shell. */
(function () {
  "use strict";

  const categoryApi = window.SteamSelectorCategories;
  const core = window.SteamSelectorCore;
  if (!categoryApi || !core) return;

  const categories = categoryApi.getAllCategories();
  const mount = document.getElementById("siteHeaderMount");
  if (!mount) return;

  const isCatalogPage = document.body.classList.contains("catalog-page");

  function ensureMobileNavigationStyles() {
    if (document.getElementById("steamselector-mobile-bottom-nav-style")) return;

    const stylesheet = document.createElement("link");
    stylesheet.id = "steamselector-mobile-bottom-nav-style";
    stylesheet.rel = "stylesheet";
    stylesheet.href = "mobile-bottom-nav.css?v=global-mobile-nav-3";
    document.head.appendChild(stylesheet);
  }

  function appendScript(id, source, onReady) {
    const existing = document.getElementById(id);
    if (existing) {
      if (existing.dataset.loaded === "true") onReady();
      else existing.addEventListener("load", onReady, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = source;
    script.async = false;
    script.addEventListener("load", function () {
      script.dataset.loaded = "true";
      onReady();
    }, { once: true });
    document.head.appendChild(script);
  }

  function ensureGlobalSearchAssets() {
    if (!document.getElementById("steamselector-global-search-style")) {
      const stylesheet = document.createElement("link");
      stylesheet.id = "steamselector-global-search-style";
      stylesheet.rel = "stylesheet";
      stylesheet.href = "global-search.css?v=global-search-1";
      document.head.appendChild(stylesheet);
    }

    appendScript("steamselector-global-search-config", "global-search-config.js?v=global-search-1", function () {
      appendScript("steamselector-global-search-script", "global-search.js?v=global-search-1", function () {});
    });
  }

  function categoryMenu() {
    return categories.map(function (category) {
      const href = core.categoryUrl(category.id);
      const children = category.children.length
        ? "<div class=\"nav-submenu\">" + category.children.map(function (child) {
            return "<a href=\"" + core.categoryUrl(category.id, child.id) + "\">" + core.escapeHtml(child.title) + "</a>";
          }).join("") + "</div>"
        : "";

      return "<div class=\"nav-category\"><a href=\"" + href + "\">" + core.escapeHtml(category.title) + "</a>" + children + "</div>";
    }).join("");
  }

  function mobileMenuLinks() {
    return "<a href=\"index.html\">Home</a>"
      + "<a href=\"guided-selection.html\">Guided Selection</a>"
      + "<a href=\"quote.html\">Quote <span data-quote-count class=\"quote-badge\">0</span></a>"
      + "<span class=\"mobile-menu-title\">Product Categories</span>"
      + categories.map(function (category) {
          return "<a href=\"" + core.categoryUrl(category.id) + "\">" + core.escapeHtml(category.title) + "</a>";
        }).join("");
  }

  function icon(name) {
    const common = "class=\"mobile-bottom-nav-icon\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"";

    if (name === "home") {
      return "<svg " + common + "><path d=\"m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z\"/></svg>";
    }

    if (name === "products") {
      return "<svg " + common + "><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/></svg>";
    }

    if (name === "quote") {
      return "<svg " + common + "><path d=\"M6 3h8l4 4v14H6z\"/><path d=\"M14 3v5h5M9 12h6M9 16h6\"/><circle cx=\"19\" cy=\"19\" r=\"3\"/></svg>";
    }

    if (name === "resources") {
      return "<svg " + common + "><path d=\"M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z\"/></svg>";
    }

    return "<svg " + common + "><circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21c.8-4 3.4-6 8-6s7.2 2 8 6\"/></svg>";
  }

  function searchIcon() {
    return "<svg class=\"global-search-svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"10.8\" cy=\"10.8\" r=\"6.3\"/><path d=\"m15.5 15.5 4.3 4.3\"/></svg>";
  }

  function currentMobileSection() {
    const page = core.currentFile().toLowerCase();

    if (page === "index.html") return "home";
    if (page === "quote.html") return "quote";
    if (page === "guided-selection.html") return "resources";
    if (page === "category.html" || page === "product.html" || page === "search.html") return "products";
    return "";
  }

  function navLink(section, href, label, iconName, includesQuoteBadge) {
    const active = currentMobileSection() === section;
    const activeClass = active ? " is-active" : "";
    const current = active ? " aria-current=\"page\"" : "";
    const badge = includesQuoteBadge ? "<b class=\"mobile-bottom-nav-badge\" data-quote-count>0</b>" : "";

    return "<a class=\"mobile-bottom-nav-link" + activeClass + "\" href=\"" + href + "\"" + current + ">"
      + icon(iconName)
      + "<span>" + label + "</span>"
      + badge
      + "</a>";
  }

  function renderMobileBottomNavigation() {
    return "<nav class=\"mobile-bottom-nav\" aria-label=\"Mobile primary navigation\">"
      + navLink("home", "index.html", "Home", "home", false)
      + navLink("products", "index.html#browse-categories", "Products", "products", false)
      + navLink("quote", "quote.html", "Quote List", "quote", true)
      + navLink("resources", "guided-selection.html", "Resources", "resources", false)
      + "<button type=\"button\" aria-disabled=\"true\" aria-label=\"Account features are not available in this beta\">"
      + icon("account")
      + "<span>Account</span>"
      + "</button>"
      + "</nav>";
  }

  function renderGlobalSearchOverlay() {
    return "<div id=\"globalSearchOverlay\" class=\"global-search-overlay\" hidden aria-hidden=\"true\">"
      + "<section class=\"global-search-panel\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"globalSearchLabel\">"
      + "<header class=\"global-search-toolbar\">"
      + "<button class=\"global-search-close\" type=\"button\" data-global-search-close aria-label=\"Close search\">×</button>"
      + "<form id=\"globalSearchForm\" class=\"global-search-input-wrap\" role=\"search\">"
      + "<label id=\"globalSearchLabel\" class=\"sr-only\" for=\"globalSearchInput\">Search all products</label>"
      + "<input id=\"globalSearchInput\" class=\"global-search-input\" type=\"search\" placeholder=\"What can we help you find?\" autocomplete=\"off\" />"
      + "<button id=\"globalSearchClear\" class=\"global-search-clear\" type=\"button\" data-global-search-clear aria-label=\"Clear search\" hidden>×</button>"
      + "</form>"
      + "<div class=\"global-search-header-actions\">"
      + "<button class=\"global-search-icon-button\" type=\"button\" data-global-search-placeholder=\"Barcode\" aria-label=\"Barcode lookup placeholder\"><svg class=\"global-search-svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 4v16M7 4v16M10 4v16M14 4v16M17 4v16M20 4v16\"/><path d=\"M2 7h20M2 17h20\"/></svg></button>"
      + "<button class=\"global-search-icon-button\" type=\"button\" data-global-search-placeholder=\"Camera\" aria-label=\"Camera lookup placeholder\"><svg class=\"global-search-svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 7h4l1.5-2h5L16 7h4v12H4z\"/><circle cx=\"12\" cy=\"13\" r=\"3.5\"/></svg></button>"
      + "</div>"
      + "</header>"
      + "<div class=\"global-search-body\"><p id=\"globalSearchStatus\" class=\"global-search-status\" role=\"status\"></p><div id=\"globalSearchContent\"></div></div>"
      + "</section></div>";
  }

  function renderStandardHeader() {
    mount.innerHTML = ""
      + "<header class=\"site-header\">"
      + "<div class=\"page site-header-inner\">"
      + "<a class=\"site-brand\" href=\"index.html\"><span class=\"brand-mark\">SS</span><span>SteamSelector <small>Beta</small></span></a>"
      + "<nav class=\"desktop-nav\" aria-label=\"Primary navigation\">"
      + "<a href=\"index.html\">Home</a>"
      + "<div class=\"nav-categories\"><button type=\"button\">Product Categories <span>⌄</span></button><div class=\"nav-dropdown\">" + categoryMenu() + "</div></div>"
      + "<a href=\"guided-selection.html\">Guided Selection</a>"
      + "<a href=\"quote.html\">Quote <span data-quote-count class=\"quote-badge\">0</span></a>"
      + "</nav>"
      + "<button class=\"global-header-search-trigger\" type=\"button\" data-global-search-open aria-label=\"Search products\">" + searchIcon() + "</button>"
      + "<button class=\"mobile-menu-button\" type=\"button\" data-mobile-menu aria-expanded=\"false\">Menu</button>"
      + "</div>"
      + "<div class=\"mobile-menu\" data-mobile-panel hidden>" + mobileMenuLinks() + "</div>"
      + "</header>";
  }

  function renderCatalogHeader() {
    mount.innerHTML = ""
      + "<header class=\"catalog-site-header\">"
      + "<div class=\"catalog-site-header-inner page\">"
      + "<a class=\"catalog-brand\" href=\"index.html\"><span class=\"catalog-brand-mark\">SS</span><span>SteamSelector <small>BETA</small></span></a>"
      + "<div class=\"catalog-header-actions\">"
      + "<a class=\"catalog-header-quote\" href=\"quote.html\"><span class=\"catalog-action-icon\">▧</span><span>Quote</span><b data-quote-count>0</b></a>"
      + "<button class=\"catalog-header-menu\" type=\"button\" data-mobile-menu aria-expanded=\"false\"><span class=\"catalog-action-icon\">☰</span><span>Menu</span></button>"
      + "</div>"
      + "</div>"
      + "<form id=\"catalogHeaderSearchForm\" class=\"catalog-header-search page\" role=\"search\">"
      + "<label class=\"sr-only\" for=\"catalogHeaderSearchInput\">Search products</label>"
      + "<input id=\"catalogHeaderSearchInput\" type=\"search\" placeholder=\"Search model number, series, or product type...\" autocomplete=\"off\" />"
      + "<button type=\"submit\"><span aria-hidden=\"true\">⌕</span> Search</button>"
      + "</form>"
      + "<div class=\"catalog-header-mobile-menu\" data-mobile-panel hidden>" + mobileMenuLinks() + "</div>"
      + "</header>";
  }

  ensureMobileNavigationStyles();
  if (isCatalogPage) renderCatalogHeader(); else renderStandardHeader();
  mount.insertAdjacentHTML("beforeend", renderMobileBottomNavigation() + renderGlobalSearchOverlay());
  document.body.classList.add("mobile-bottom-nav-enabled");
  ensureGlobalSearchAssets();

  const mobileButton = mount.querySelector("[data-mobile-menu]");
  const mobilePanel = mount.querySelector("[data-mobile-panel]");

  if (mobileButton && mobilePanel) {
    mobileButton.addEventListener("click", function () {
      const willOpen = mobilePanel.hidden;
      mobilePanel.hidden = !willOpen;
      mobileButton.setAttribute("aria-expanded", String(willOpen));
    });
  }

  function updateQuoteCounts() {
    const count = core.quote.count();
    mount.querySelectorAll("[data-quote-count]").forEach(function (element) {
      element.textContent = count;
      element.hidden = count === 0;
    });
  }

  updateQuoteCounts();
  window.addEventListener("storage", updateQuoteCounts);
  window.addEventListener("steamselector:quote-updated", updateQuoteCounts);
})();
