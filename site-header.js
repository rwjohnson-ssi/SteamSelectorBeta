/* Shared SteamSelector Beta site header. */
(function () {
  "use strict";

  const categoryApi = window.SteamSelectorCategories;
  const core = window.SteamSelectorCore;
  if (!categoryApi || !core) return;

  const categories = categoryApi.getAllCategories();
  const mount = document.getElementById("siteHeaderMount");
  if (!mount) return;

  const isCatalogPage = document.body.classList.contains("catalog-page");

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
      + "</header>"
      + "<nav class=\"catalog-bottom-nav\" aria-label=\"Mobile primary navigation\">"
      + "<a href=\"index.html\"><span class=\"bottom-nav-icon\">⌂</span><span>Home</span></a>"
      + "<a class=\"is-active\" href=\"" + core.categoryUrl("steam-traps") + "\"><span class=\"bottom-nav-icon\">◉</span><span>Products</span></a>"
      + "<a href=\"quote.html\"><span class=\"bottom-nav-icon\">▧</span><span>Quote List</span><b data-quote-count>0</b></a>"
      + "<a href=\"guided-selection.html\"><span class=\"bottom-nav-icon\">▤</span><span>Resources</span></a>"
      + "<button type=\"button\" class=\"bottom-nav-placeholder\" aria-label=\"Account features are not available in this beta\"><span class=\"bottom-nav-icon\">◯</span><span>Account</span></button>"
      + "</nav>";
  }

  if (isCatalogPage) renderCatalogHeader(); else renderStandardHeader();

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
