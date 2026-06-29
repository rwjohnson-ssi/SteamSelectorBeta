/*
  SteamSelector Beta shared core.
  Keep cross-page helpers, URL builders, product matching, product visual fallback,
  breadcrumbs, browser-only quote storage, and browser-only project storage here.
*/
(function () {
  "use strict";

  const QUOTE_KEY = "steamselector_beta_quote";
  const PROJECTS_KEY = "steamselector_beta_projects";

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function currentFile() {
    const file = window.location.pathname.split("/").pop();
    return file || "index.html";
  }

  function parameters() {
    return new URLSearchParams(window.location.search);
  }

  function getCategory(categoryId) {
    if (!window.SteamSelectorCategories) return null;
    return window.SteamSelectorCategories.getCategoryById(categoryId);
  }

  function getProduct(productId) {
    if (!window.SteamSelectorProducts) return null;
    return window.SteamSelectorProducts.getProductById(productId);
  }

  function categoryUrl(categoryId, subcategoryId) {
    if (!window.SteamSelectorCategories) return "category.html";
    return window.SteamSelectorCategories.getCategoryHref(categoryId, subcategoryId);
  }

  function productUrl(product) {
    const productId = typeof product === "string" ? product : product && product.id;
    return "product.html?model=" + encodeURIComponent(productId || "");
  }

  function productMatches(product, term) {
    const normalizedTerm = String(term || "").trim().toLowerCase();
    if (!normalizedTerm) return true;

    const haystack = [
      product.id,
      product.series,
      product.category,
      product.subcategory,
      product.size,
      product.connection,
      product.material,
      product.pmo,
      product.summary,
      product.description,
      Object.keys(product.specs || {}).join(" "),
      Object.keys(product.specs || {}).map(function (key) { return product.specs[key]; }).join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedTerm);
  }

  function uniqueValues(products, key) {
    const seen = new Set();

    return products
      .map(function (product) { return String(product[key] || "").trim(); })
      .filter(Boolean)
      .filter(function (value) {
        const token = value.toLowerCase();
        if (seen.has(token)) return false;
        seen.add(token);
        return true;
      })
      .sort(function (left, right) {
        return left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" });
      });
  }

  function productVisualTone(product) {
    const material = String(product && product.material ? product.material : "").toLowerCase();
    if (material.includes("stainless") || material.includes("aisi") || material.includes("steel")) return "product-visual-steel";
    if (material.includes("bronze")) return "product-visual-bronze";
    return "product-visual-blue";
  }

  function renderProductVisual(product, category, className) {
    const safeClass = className || "product-thumb";
    const image = String(product && product.image ? product.image : "").trim();
    const categoryIcon = category && category.icon ? category.icon : "SS";
    const label = product && (product.series || product.id) ? product.series || product.id : "Product";

    if (image) {
      return "<div class=\"" + safeClass + "\"><img src=\"" + escapeHtml(image) + "\" alt=\"" + escapeHtml(product.id || "Product") + "\" loading=\"lazy\" /></div>";
    }

    return "<div class=\"" + safeClass + " product-visual-fallback " + productVisualTone(product) + "\" aria-label=\"" + escapeHtml(product.id || "Product") + "\">"
      + "<span class=\"product-visual-icon\">" + escapeHtml(categoryIcon) + "</span>"
      + "<small>" + escapeHtml(label) + "</small>"
      + "</div>";
  }

  function renderBreadcrumbs(items) {
    const element = document.getElementById("breadcrumbs");
    if (!element) return;

    element.innerHTML = items
      .map(function (item, index) {
        const isLast = index === items.length - 1;
        if (isLast || !item.href) return "<span>" + escapeHtml(item.label) + "</span>";
        return "<a href=\"" + escapeHtml(item.href) + "\">" + escapeHtml(item.label) + "</a><span aria-hidden=\"true\">›</span>";
      })
      .join("");
  }

  function loadQuote() {
    try {
      const items = JSON.parse(localStorage.getItem(QUOTE_KEY) || "[]");
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
  }

  function notifyQuoteUpdated() {
    window.dispatchEvent(new CustomEvent("steamselector:quote-updated"));
  }

  function saveQuote(items) {
    const safeItems = Array.isArray(items) ? items : [];
    localStorage.setItem(QUOTE_KEY, JSON.stringify(safeItems));
    notifyQuoteUpdated();
  }

  function safeQuantity(value) {
    return Math.max(1, Math.floor(Number(value) || 1));
  }

  function addToQuote(product, quantity) {
    if (!product || !product.id) return;

    const items = loadQuote();
    const existing = items.find(function (item) { return item.id === product.id; });
    const qty = safeQuantity(quantity);

    if (existing) {
      existing.qty = safeQuantity(existing.qty + qty);
    } else {
      items.push({ id: product.id, qty: qty, notes: "" });
    }

    saveQuote(items);
  }

  function updateQuoteItem(productId, changes) {
    const items = loadQuote();
    const item = items.find(function (entry) { return entry.id === productId; });
    if (!item) return;

    if (Object.prototype.hasOwnProperty.call(changes, "qty")) item.qty = safeQuantity(changes.qty);
    if (Object.prototype.hasOwnProperty.call(changes, "notes")) item.notes = String(changes.notes || "").trim();
    saveQuote(items);
  }

  function removeFromQuote(productId) {
    saveQuote(loadQuote().filter(function (item) { return item.id !== productId; }));
  }

  function clearQuote() {
    saveQuote([]);
  }

  function quoteCount() {
    return loadQuote().reduce(function (total, item) {
      return total + safeQuantity(item.qty);
    }, 0);
  }

  /*
    Project List storage helpers.
    Project item records intentionally match Quote List records: { id, qty, notes }.
    Keep all project localStorage access in this section so a future database/API
    migration only needs to replace these helpers.
  */
  function createProjectId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "project-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function projectText(value, maxLength) {
    return String(value == null ? "" : value).trim().slice(0, maxLength);
  }

  function normalizeProjectItem(item) {
    if (!item || !projectText(item.id, 160)) return null;
    return {
      id: projectText(item.id, 160),
      qty: safeQuantity(item.qty),
      notes: projectText(item.notes, 600)
    };
  }

  function normalizeProject(project) {
    if (!project || !projectText(project.id, 160) || !projectText(project.name, 120)) return null;
    const seenProductIds = new Set();
    const items = Array.isArray(project.items) ? project.items : [];

    return {
      id: projectText(project.id, 160),
      name: projectText(project.name, 120),
      description: projectText(project.description, 600),
      createdAt: projectText(project.createdAt, 80) || new Date().toISOString(),
      items: items.map(normalizeProjectItem).filter(function (item) {
        if (!item || seenProductIds.has(item.id)) return false;
        seenProductIds.add(item.id);
        return true;
      })
    };
  }

  function cloneProject(project) {
    return normalizeProject(JSON.parse(JSON.stringify(project)));
  }

  function loadProjects() {
    try {
      const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
      return Array.isArray(projects) ? projects.map(normalizeProject).filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  function notifyProjectsUpdated() {
    window.dispatchEvent(new CustomEvent("steamselector:projects-updated"));
  }

  function saveProjects(projects) {
    const safeProjects = Array.isArray(projects) ? projects.map(normalizeProject).filter(Boolean) : [];
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(safeProjects));
    notifyProjectsUpdated();
    return safeProjects.map(cloneProject);
  }

  function getProject(projectId) {
    const id = projectText(projectId, 160);
    const project = loadProjects().find(function (entry) { return entry.id === id; });
    return project ? cloneProject(project) : null;
  }

  function createProject(input) {
    const name = projectText(input && input.name, 120);
    if (!name) return null;

    const project = {
      id: createProjectId(),
      name: name,
      description: projectText(input && input.description, 600),
      createdAt: new Date().toISOString(),
      items: []
    };

    const projects = loadProjects();
    projects.unshift(project);
    saveProjects(projects);
    return cloneProject(project);
  }

  function updateProject(projectId, changes) {
    const projects = loadProjects();
    const project = projects.find(function (entry) { return entry.id === projectText(projectId, 160); });
    if (!project) return null;

    if (Object.prototype.hasOwnProperty.call(changes || {}, "name")) {
      const name = projectText(changes.name, 120);
      if (!name) return null;
      project.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(changes || {}, "description")) {
      project.description = projectText(changes.description, 600);
    }

    saveProjects(projects);
    return cloneProject(project);
  }

  function removeProject(projectId) {
    const id = projectText(projectId, 160);
    const projects = loadProjects();
    const nextProjects = projects.filter(function (project) { return project.id !== id; });
    if (nextProjects.length === projects.length) return false;
    saveProjects(nextProjects);
    return true;
  }

  function addToProject(projectId, product, quantity) {
    if (!product || !projectText(product.id, 160)) return null;

    const projects = loadProjects();
    const project = projects.find(function (entry) { return entry.id === projectText(projectId, 160); });
    if (!project) return null;

    const existing = project.items.find(function (item) { return item.id === product.id; });
    const qty = safeQuantity(quantity);

    if (existing) {
      existing.qty = safeQuantity(existing.qty + qty);
    } else {
      project.items.push({ id: product.id, qty: qty, notes: "" });
    }

    saveProjects(projects);
    return cloneProject(project);
  }

  function updateProjectItem(projectId, productId, changes) {
    const projects = loadProjects();
    const project = projects.find(function (entry) { return entry.id === projectText(projectId, 160); });
    if (!project) return null;

    const item = project.items.find(function (entry) { return entry.id === projectText(productId, 160); });
    if (!item) return null;

    if (Object.prototype.hasOwnProperty.call(changes || {}, "qty")) item.qty = safeQuantity(changes.qty);
    if (Object.prototype.hasOwnProperty.call(changes || {}, "notes")) item.notes = projectText(changes.notes, 600);

    saveProjects(projects);
    return cloneProject(project);
  }

  function removeProjectItem(projectId, productId) {
    const projects = loadProjects();
    const project = projects.find(function (entry) { return entry.id === projectText(projectId, 160); });
    if (!project) return null;

    const nextItems = project.items.filter(function (item) { return item.id !== projectText(productId, 160); });
    if (nextItems.length === project.items.length) return cloneProject(project);

    project.items = nextItems;
    saveProjects(projects);
    return cloneProject(project);
  }

  function clearProjectItems(projectId) {
    const projects = loadProjects();
    const project = projects.find(function (entry) { return entry.id === projectText(projectId, 160); });
    if (!project) return null;

    project.items = [];
    saveProjects(projects);
    return cloneProject(project);
  }

  function projectItemCount(project) {
    const currentProject = typeof project === "string" ? getProject(project) : normalizeProject(project);
    if (!currentProject) return 0;
    return currentProject.items.reduce(function (total, item) { return total + safeQuantity(item.qty); }, 0);
  }

  window.SteamSelectorCore = {
    currentFile: currentFile,
    parameters: parameters,
    getCategory: getCategory,
    getProduct: getProduct,
    categoryUrl: categoryUrl,
    productUrl: productUrl,
    productMatches: productMatches,
    uniqueValues: uniqueValues,
    escapeHtml: escapeHtml,
    renderProductVisual: renderProductVisual,
    renderBreadcrumbs: renderBreadcrumbs,
    quote: {
      load: loadQuote,
      save: saveQuote,
      add: addToQuote,
      update: updateQuoteItem,
      remove: removeFromQuote,
      clear: clearQuote,
      count: quoteCount,
      safeQuantity: safeQuantity
    },
    projects: {
      key: PROJECTS_KEY,
      load: loadProjects,
      save: saveProjects,
      get: getProject,
      create: createProject,
      update: updateProject,
      remove: removeProject,
      addItem: addToProject,
      updateItem: updateProjectItem,
      removeItem: removeProjectItem,
      clearItems: clearProjectItems,
      itemCount: projectItemCount
    }
  };
})();
