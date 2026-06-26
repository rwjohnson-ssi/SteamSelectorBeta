(function () {
  "use strict";

  const categoryApi = window.SteamSelectorCategories;
  if (!categoryApi) return;

  const categories = categoryApi.getAllCategories();
  const mount = document.getElementById("siteHeaderMount");
  if (!mount) return;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function quoteCount() {
    try {
      const items = JSON.parse(localStorage.getItem("steamselector_beta_quote") || "[]");
      return Array.isArray(items) ? items.reduce(function (total, item) { return total + Math.max(1, Number(item.qty) || 1); }, 0) : 0;
    } catch (error) {
      return 0;
    }
  }

  function categoryMenu() {
    return categories.map(function (category) {
      const href = categoryApi.getCategoryHref(category.id);
      const children = category.children.length
        ? "<div class=\"nav-submenu\">" + category.children.map(function (child) {
            return "<a href=\"" + categoryApi.getCategoryHref(category.id, child.id) + "\">" + escapeHtml(child.title) + "</a>";
          }).join("") + "</div>"
        : "";
      return "<div class=\"nav-category\"><a href=\"" + href + "\">" + escapeHtml(category.title) + "</a>" + children + "</div>";
    }).join("");
  }

  mount.innerHTML = ""
    + "<header class=\"site-header\">"
    + "  <div class=\"page site-header-inner\">"
    + "    <a class=\"site-brand\" href=\"index.html\"><span class=\"brand-mark\">SS</span><span>SteamSelector <small>Beta</small></span></a>"
    + "    <nav class=\"desktop-nav\" aria-label=\"Primary navigation\">"
    + "      <a href=\"index.html\">Home</a><div class=\"nav-categories\"><button type=\"button\" data-nav-menu>Product Categories <span>⌄</span></button><div class=\"nav-dropdown\">" + categoryMenu() + "</div></div><a href=\"guided-selection.html\">Guided Selection</a><a href=\"quote.html\">Quote <span data-quote-count class=\"quote-badge\">0</span></a>"
    + "    </nav>"
    + "    <button class=\"mobile-menu-button\" type=\"button\" data-mobile-menu aria-expanded=\"false\">Menu</button>"
    + "  </div>"
    + "  <div class=\"mobile-menu\" data-mobile-panel hidden>"
    + "    <a href=\"index.html\">Home</a><a href=\"guided-selection.html\">Guided Selection</a><a href=\"quote.html\">Quote <span data-quote-count class=\"quote-badge\">0</span></a>"
    + "    <span class=\"mobile-menu-title\">Product Categories</span>"
    + categories.map(function (category) { return "<a href=\"" + categoryApi.getCategoryHref(category.id) + "\">" + escapeHtml(category.title) + "</a>"; }).join("")
    + "  </div>"
    + "</header>";

  const mobileButton = mount.querySelector("[data-mobile-menu]");
  const mobilePanel = mount.querySelector("[data-mobile-panel]");
  mobileButton.addEventListener("click", function () {
    const willOpen = mobilePanel.hidden;
    mobilePanel.hidden = !willOpen;
    mobileButton.setAttribute("aria-expanded", String(willOpen));
  });

  function updateQuoteCounts() {
    const count = quoteCount();
    mount.querySelectorAll("[data-quote-count]").forEach(function (element) {
      element.textContent = count;
      element.hidden = count === 0;
    });
  }

  window.SteamSelectorQuoteBadge = { update: updateQuoteCounts };
  updateQuoteCounts();
  window.addEventListener("storage", updateQuoteCounts);
})();
