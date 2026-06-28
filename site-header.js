/* Shared SteamSelector Beta site header and mobile navigation. */
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
    stylesheet.href = "mobile-bottom-nav.css?v=global-mobile-nav-2";
    document.head.appendChild(stylesheet);
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
  mount.insertAdjacentHTML("beforeend", renderMobileBottomNavigation());
  document.body.classList.add("mobile-bottom-nav-enabled");

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
