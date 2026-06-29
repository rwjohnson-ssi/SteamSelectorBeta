/* Saved Project Lists controller for SteamSelector Beta. */
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const productApi = window.SteamSelectorProducts;
  const quantityApi = window.SteamSelectorQuantity;
  if (!core || !productApi || !quantityApi) return;

  const createForm = document.getElementById("projectCreateForm");
  const createName = document.getElementById("projectCreateName");
  const createDescription = document.getElementById("projectCreateDescription");
  const projectList = document.getElementById("projectList");
  const workspace = document.getElementById("projectWorkspace");
  const noWorkspace = document.getElementById("noProjectWorkspace");
  const editor = document.getElementById("projectEditor");
  const editName = document.getElementById("projectEditName");
  const editDescription = document.getElementById("projectEditDescription");
  const deleteButton = document.getElementById("deleteProjectButton");
  const summary = document.getElementById("projectSummary");
  const emptyState = document.getElementById("projectEmptyState");
  const tableBody = document.getElementById("projectTableBody");
  const tableWrap = tableBody ? tableBody.closest(".project-table-wrap") : null;
  const actions = document.getElementById("projectActions");
  const copyButton = document.getElementById("copyProjectButton");
  const clearItemsButton = document.getElementById("clearProjectItemsButton");
  const message = document.getElementById("projectMessage");

  if (!createForm || !projectList || !workspace || !noWorkspace || !editor || !tableBody || !message) return;

  let selectedProjectId = core.parameters().get("project") || "";

  core.renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Project Lists" }]);
  quantityApi.bind(tableBody);

  function escape(value) {
    return core.escapeHtml(value == null ? "" : value);
  }

  function displayDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Saved project";
    return "Created " + date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function setSelectedProject(projectId) {
    selectedProjectId = projectId || "";
    const url = new URL(window.location.href);
    if (selectedProjectId) url.searchParams.set("project", selectedProjectId);
    else url.searchParams.delete("project");
    window.history.replaceState({}, "", url);
  }

  function selectedProject(projects) {
    const allProjects = projects || core.projects.load();
    let project = allProjects.find(function (entry) { return entry.id === selectedProjectId; });

    if (!project && allProjects.length) {
      project = allProjects[0];
      setSelectedProject(project.id);
    }

    return project || null;
  }

  function projectRow(item, project) {
    const product = productApi.getProductById(item.id);
    if (!product) return "";
    const category = core.getCategory(product.category);
    const quantityId = "projectQty-" + project.id + "-" + product.id.replace(/[^a-zA-Z0-9_-]/g, "-");
    const stepper = quantityApi.markup(quantityId, "Quantity").replace("value=\"1\"", "value=\"" + core.quote.safeQuantity(item.qty) + "\"");

    return "<tr data-project-item=\"" + escape(product.id) + "\">"
      + "<td>" + core.renderProductVisual(product, category, "product-thumb") + "</td>"
      + "<td><a class=\"catalog-model-link\" href=\"" + core.productUrl(product) + "\">" + escape(product.id) + "</a><br /><small>" + escape(product.summary) + "</small></td>"
      + "<td>" + stepper + "</td>"
      + "<td><input class=\"project-notes-input\" type=\"text\" data-project-notes placeholder=\"Optional notes\" value=\"" + escape(item.notes || "") + "\" /></td>"
      + "<td><button class=\"project-remove-button\" type=\"button\" data-remove-project-item>Remove</button></td>"
      + "</tr>";
  }

  function renderProjectList(projects) {
    if (!projects.length) {
      projectList.innerHTML = "<div class=\"catalog-empty-state\">No saved projects yet.</div>";
      return;
    }

    projectList.innerHTML = projects.map(function (project) {
      const isActive = project.id === selectedProjectId;
      const count = core.projects.itemCount(project);
      return "<button class=\"project-list-item" + (isActive ? " is-active" : "") + "\" type=\"button\" data-project-open=\"" + escape(project.id) + "\" aria-pressed=\"" + String(isActive) + "\">"
        + "<span><strong>" + escape(project.name) + "</strong><small>" + escape(project.description || displayDate(project.createdAt)) + "</small></span>"
        + "<span class=\"project-list-item-count\">" + count + "</span>"
        + "</button>";
    }).join("");
  }

  function renderWorkspace(project) {
    const validItems = project.items.filter(function (item) { return productApi.getProductById(item.id); });
    const itemCount = core.projects.itemCount(project);

    workspace.hidden = false;
    noWorkspace.hidden = true;
    editName.value = project.name;
    editDescription.value = project.description || "";
    summary.textContent = itemCount + " product" + (itemCount === 1 ? "" : "s") + " saved in this project · " + displayDate(project.createdAt);
    emptyState.hidden = validItems.length > 0;
    if (tableWrap) tableWrap.hidden = validItems.length === 0;
    actions.hidden = validItems.length === 0;
    tableBody.innerHTML = validItems.map(function (item) { return projectRow(item, project); }).join("");
  }

  function render() {
    const projects = core.projects.load();
    const project = selectedProject(projects);
    renderProjectList(projects);

    if (!project) {
      workspace.hidden = true;
      noWorkspace.hidden = false;
      return;
    }

    renderWorkspace(project);
  }

  function clipboardText(project) {
    const lines = project.items.map(function (item) {
      const product = productApi.getProductById(item.id);
      if (!product) return "";
      return core.quote.safeQuantity(item.qty) + " ea - " + product.id + " - " + product.summary + (item.notes ? " | Notes: " + item.notes : "");
    }).filter(Boolean);

    return "SteamSelector Beta Project List\n" + project.name
      + (project.description ? "\n" + project.description : "")
      + "\n\n" + lines.join("\n");
  }

  createForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const project = core.projects.create({ name: createName.value, description: createDescription.value });
    if (!project) {
      message.textContent = "Enter a project name before creating the project.";
      createName.focus();
      return;
    }

    setSelectedProject(project.id);
    createForm.reset();
    message.textContent = project.name + " was created.";
    render();
  });

  projectList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-project-open]");
    if (!button) return;
    setSelectedProject(button.getAttribute("data-project-open"));
    message.textContent = "";
    render();
  });

  editor.addEventListener("submit", function (event) {
    event.preventDefault();
    const updated = core.projects.update(selectedProjectId, {
      name: editName.value,
      description: editDescription.value
    });

    if (!updated) {
      message.textContent = "A project name is required.";
      editName.focus();
      return;
    }

    message.textContent = "Project details saved.";
    render();
  });

  deleteButton.addEventListener("click", function () {
    const project = core.projects.get(selectedProjectId);
    if (!project) return;

    if (!window.confirm("Delete \"" + project.name + "\" and all items saved in it?")) return;
    core.projects.remove(project.id);
    setSelectedProject("");
    message.textContent = "Project deleted.";
    render();
  });

  tableBody.addEventListener("change", function (event) {
    const row = event.target.closest("[data-project-item]");
    if (!row || !event.target.matches("[data-project-notes]")) return;
    core.projects.updateItem(selectedProjectId, row.getAttribute("data-project-item"), { notes: event.target.value });
    message.textContent = "Item notes saved.";
  });

  tableBody.addEventListener("click", function (event) {
    const removeButton = event.target.closest("[data-remove-project-item]");
    if (!removeButton) return;
    const row = removeButton.closest("[data-project-item]");
    core.projects.removeItem(selectedProjectId, row.getAttribute("data-project-item"));
    message.textContent = "Item removed from the project.";
    render();
  });

  document.addEventListener("steamselector:quantity-change", function (event) {
    const input = event.target;
    const row = input && input.closest ? input.closest("[data-project-item]") : null;
    if (!row || !tableBody.contains(row)) return;

    core.projects.updateItem(selectedProjectId, row.getAttribute("data-project-item"), { qty: input.value });
    message.textContent = "Project quantity updated.";
    render();
  });

  clearItemsButton.addEventListener("click", function () {
    const project = core.projects.get(selectedProjectId);
    if (!project || !project.items.length) return;
    if (!window.confirm("Clear every product from \"" + project.name + "\"?")) return;

    core.projects.clearItems(project.id);
    message.textContent = "Project items cleared.";
    render();
  });

  copyButton.addEventListener("click", function () {
    const project = core.projects.get(selectedProjectId);
    if (!project) return;
    const text = clipboardText(project);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        message.textContent = "Project list copied to your clipboard.";
      }).catch(function () {
        message.textContent = "Unable to copy automatically. Please select and copy the list manually.";
      });
      return;
    }

    message.textContent = text;
  });

  window.addEventListener("storage", function (event) {
    if (event.key === core.projects.key) render();
  });

  window.addEventListener("steamselector:projects-updated", render);
  render();
})();
