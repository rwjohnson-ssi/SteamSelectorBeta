/* Shared product-detail controller for every SteamSelector Beta product. */
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const productApi = window.SteamSelectorProducts;
  const quantityApi = window.SteamSelectorQuantity;

  if (!core || !productApi || !quantityApi) return;

  const model = core.parameters().get("model");
  const product = productApi.getProductById(model);
  const detail = document.getElementById("productDetail");
  const related = document.getElementById("relatedProducts");
  const status = document.getElementById("productStatus");

  if (!detail || !related || !status) return;

  function installProductDetailQuantityStyles() {
    if (document.getElementById("productDetailQuantityStyles")) return;

    const style = document.createElement("style");
    style.id = "productDetailQuantityStyles";
    style.textContent = ""
      + ".product-page .product-action-row.product-action-row-redesign{display:grid;grid-template-columns:1fr;gap:10px;width:100%;margin-top:20px;}"
      + ".product-page .product-detail-quantity{display:grid;gap:9px;width:100%;}"
      + ".product-page .product-detail-quantity-title{margin:0;color:#4f5a68;font-size:13px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;}"
      + ".product-page .product-detail-quantity .quantity-control{width:100%;}"
      + ".product-page .product-detail-quantity .quantity-control-label{display:none;}"
      + ".product-page .product-detail-quantity .quantity-stepper{display:grid;width:100%;height:50px;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr) minmax(0,1fr);border-radius:7px;}"
      + ".product-page .product-detail-quantity .quantity-stepper-button,.product-page .product-detail-quantity .quantity-stepper-input{width:auto;height:50px;}"
      + ".product-page .product-detail-quantity .quantity-stepper-button{font-size:18px;}"
      + ".product-page .product-detail-quantity .quantity-stepper-input{font-size:17px;}"
      + ".product-page .product-detail-quantity-help{margin:0;color:#687486;font-size:12px;font-weight:650;line-height:1.35;}"
      + ".product-page .product-action-row-redesign .btn{display:inline-flex;align-items:center;justify-content:center;width:100%;min-height:50px;}";
    document.head.appendChild(style);
  }

  if (!product) {
    core.renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Product Not Found" }]);
    detail.innerHTML = "<section class=\"product-section\"><h1>Product not found</h1><p class=\"product-doc-note\">That model is not in the public beta catalog.</p><div class=\"product-action-row\"><a class=\"btn btn-primary\" href=\"index.html\">Back to Home</a></div></section>";
    related.hidden = true;
    return;
  }

  const category = core.getCategory(product.category);

  function renderSpecs() {
    return Object.keys(product.specs || {}).map(function (key) {
      return "<div class=\"product-spec\"><span>" + core.escapeHtml(key) + "</span><strong>" + core.escapeHtml(product.specs[key]) + "</strong></div>";
    }).join("");
  }

  function renderRelatedCard(item) {
    return "<a class=\"related-product\" href=\"" + core.productUrl(item) + "\">"
      + "<strong>" + core.escapeHtml(item.id) + "</strong>"
      + "<span>" + core.escapeHtml(item.summary) + "</span>"
      + "<small>View product ›</small>"
      + "</a>";
  }

  function updateAddButtonLabel() {
    const quantityInput = document.getElementById("productQty");
    const addButton = document.getElementById("addProductToQuote");
    const projectButton = document.getElementById("toggleProductProject");
    if (!quantityInput) return;

    const quantity = quantityApi.normalize(quantityInput.value);
    quantityInput.value = String(quantity);
    if (addButton) addButton.textContent = "Add " + quantity + " to Quote";
    if (projectButton) projectButton.textContent = "Add " + quantity + " to Project";
  }

  function projectOptions(selectedId) {
    const projects = core.projects.load();
    if (!projects.length) return "<option value=\"\">No saved projects yet</option>";

    return "<option value=\"\">Select a saved project</option>" + projects.map(function (project) {
      const selected = project.id === selectedId ? " selected" : "";
      return "<option value=\"" + core.escapeHtml(project.id) + "\"" + selected + ">" + core.escapeHtml(project.name) + "</option>";
    }).join("");
  }

  function refreshProjectPicker() {
    const select = document.getElementById("productProjectSelect");
    if (!select) return;
    const selectedId = select.value;
    select.innerHTML = projectOptions(selectedId);
  }

  function projectStatus(text) {
    const projectMessage = document.getElementById("productProjectStatus");
    if (projectMessage) projectMessage.textContent = text;
  }

  installProductDetailQuantityStyles();
  document.title = product.id + " | SteamSelector Beta";
  core.renderBreadcrumbs([
    { label: "Home", href: "index.html" },
    { label: category.title, href: core.categoryUrl(category.id) },
    { label: product.id }
  ]);

  detail.innerHTML = "<div class=\"product-layout\">"
    + "<section class=\"product-gallery\">" + core.renderProductVisual(product, category, "product-hero-visual") + "</section>"
    + "<section class=\"product-summary-panel\">"
    + "<p class=\"catalog-kicker\">" + core.escapeHtml(category.title) + " · " + core.escapeHtml(product.series) + "</p>"
    + "<div class=\"product-heading\"><h1>" + core.escapeHtml(product.id) + "</h1></div>"
    + "<p class=\"product-summary\">" + core.escapeHtml(product.summary) + "</p>"
    + "<p class=\"product-description\">" + core.escapeHtml(product.description) + "</p>"
    + "<div class=\"product-specs\">" + renderSpecs() + "</div>"
    + "<div class=\"product-action-row product-action-row-redesign\">"
    + "<section class=\"product-detail-quantity\"><h2 class=\"product-detail-quantity-title\">Quantity</h2>"
    + quantityApi.markup("productQty", "Quantity")
    + "<p class=\"product-detail-quantity-help\">Quantity applies to both Quote and Project.</p></section>"
    + "<button id=\"addProductToQuote\" class=\"btn btn-primary\" type=\"button\">Add 1 to Quote</button>"
    + "<button id=\"toggleProductProject\" class=\"btn btn-secondary\" type=\"button\" aria-expanded=\"false\" aria-controls=\"productProjectPanel\">Add 1 to Project</button>"
    + "<a class=\"btn btn-secondary\" href=\"quote.html\">View Quote</a>"
    + "</div>"
    + "<section id=\"productProjectPanel\" class=\"product-project-panel\" hidden>"
    + "<div class=\"product-project-panel-heading\"><div><h3>Add " + core.escapeHtml(product.id) + " to a Project</h3><p>Use the same quantity selected above.</p></div><a class=\"text-link\" href=\"projects.html\">Manage Projects</a></div>"
    + "<div class=\"project-field\"><label for=\"productProjectSelect\">Saved project</label><select id=\"productProjectSelect\">" + projectOptions("") + "</select></div>"
    + "<div class=\"product-project-panel-actions\"><button id=\"addToSelectedProject\" class=\"btn btn-primary\" type=\"button\">Add to Selected Project</button></div>"
    + "<div class=\"product-project-divider\"><span>or create a new project</span></div>"
    + "<div class=\"project-field\"><label for=\"productNewProjectName\">New project name</label><input id=\"productNewProjectName\" type=\"text\" maxlength=\"120\" placeholder=\"Boiler Room Upgrade\" /></div>"
    + "<div class=\"project-field\"><label for=\"productNewProjectDescription\">Description <span class=\"muted\">(optional)</span></label><input id=\"productNewProjectDescription\" type=\"text\" maxlength=\"600\" placeholder=\"Steam equipment selection\" /></div>"
    + "<div class=\"product-project-panel-actions\"><button id=\"createProjectAndAdd\" class=\"btn btn-secondary\" type=\"button\">Create Project and Add Product</button></div>"
    + "<p id=\"productProjectStatus\" class=\"product-project-status\" role=\"status\" aria-live=\"polite\"></p>"
    + "</section>"
    + "</section>"
    + "</div>"
    + "<div class=\"product-sections\">"
    + "<section class=\"product-section\"><h2>Description</h2><p class=\"product-doc-note\">" + core.escapeHtml(product.description) + "</p></section>"
    + "<section class=\"product-section\"><h2>Documents</h2><p class=\"product-doc-note\">Public beta documents are not included in this test repository. Approved product documents can later be added to each product record once this repository is private.</p></section>"
    + "</div>";

  const relatedProducts = productApi.getProductsByCategory(product.category)
    .filter(function (item) { return item.series === product.series && item.id !== product.id; })
    .slice(0, 3);

  related.innerHTML = relatedProducts.length
    ? "<section class=\"product-section\"><h2>Related Series Products</h2><div class=\"related-products\">" + relatedProducts.map(renderRelatedCard).join("") + "</div></section>"
    : "<section class=\"product-section\"><h2>Related Series Products</h2><p class=\"product-doc-note\">No additional public beta models are available for this series yet.</p></section>";

  quantityApi.bind(document);
  updateAddButtonLabel();

  document.addEventListener("steamselector:quantity-change", function (event) {
    if (event.target && event.target.id === "productQty") updateAddButtonLabel();
  });

  document.getElementById("addProductToQuote").addEventListener("click", function () {
    const quantity = quantityApi.normalize(document.getElementById("productQty").value);
    core.quote.add(product, quantity);
    status.textContent = quantity === 1
      ? product.id + " was added to the quote list."
      : quantity + " × " + product.id + " were added to the quote list.";
  });

  document.getElementById("toggleProductProject").addEventListener("click", function () {
    const panel = document.getElementById("productProjectPanel");
    const isOpening = panel.hidden;
    panel.hidden = !isOpening;
    this.setAttribute("aria-expanded", String(isOpening));
    if (isOpening) refreshProjectPicker();
  });

  document.getElementById("addToSelectedProject").addEventListener("click", function () {
    const projectId = document.getElementById("productProjectSelect").value;
    if (!projectId) {
      projectStatus("Choose a saved project or create a new project below.");
      return;
    }

    const quantity = quantityApi.normalize(document.getElementById("productQty").value);
    const project = core.projects.addItem(projectId, product, quantity);
    if (!project) {
      projectStatus("That project is no longer available. Refresh the project list and try again.");
      refreshProjectPicker();
      return;
    }

    projectStatus(quantity === 1
      ? product.id + " was added to \"" + project.name + "\"."
      : quantity + " × " + product.id + " were added to \"" + project.name + "\".");
  });

  document.getElementById("createProjectAndAdd").addEventListener("click", function () {
    const nameInput = document.getElementById("productNewProjectName");
    const descriptionInput = document.getElementById("productNewProjectDescription");
    const project = core.projects.create({ name: nameInput.value, description: descriptionInput.value });

    if (!project) {
      projectStatus("Enter a new project name before creating it.");
      nameInput.focus();
      return;
    }

    const quantity = quantityApi.normalize(document.getElementById("productQty").value);
    core.projects.addItem(project.id, product, quantity);
    nameInput.value = "";
    descriptionInput.value = "";
    refreshProjectPicker();
    document.getElementById("productProjectSelect").value = project.id;
    projectStatus("Created \"" + project.name + "\" and added " + product.id + ".");
  });

  window.addEventListener("steamselector:projects-updated", function () {
    const panel = document.getElementById("productProjectPanel");
    if (panel && !panel.hidden) refreshProjectPicker();
  });
})();
