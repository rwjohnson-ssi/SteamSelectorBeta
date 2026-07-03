/* Quote List redesign controller. Scoped to the qlx- markup in quote.html. */
(function () {
  "use strict";

  const core = window.SteamSelectorCore;
  const productApi = window.SteamSelectorProducts;
  const SAVED_STORAGE_KEY = "steamselector:saved-quote-items";
  const VIEW_STORAGE_KEY = "steamselector:quote-layout-v3";

  if (!core || !productApi) return;

  const activeList = document.getElementById("quoteTableBody");
  const savedList = document.getElementById("savedQuoteTableBody");
  const emptyState = document.getElementById("quoteEmptyState");
  const activeSection = document.getElementById("activeQuoteSection");
  const savedSection = document.getElementById("savedQuoteSection");
  const actions = document.getElementById("quoteActions");
  const summary = document.getElementById("quoteSummary");
  const message = document.getElementById("quoteMessage");
  const activeCount = document.getElementById("activeQuoteCount");
  const savedCount = document.getElementById("savedQuoteCount");
  const totalItems = document.getElementById("quoteTotalItems");
  const viewContainer = document.getElementById("quoteViewContainer");
  const viewButtons = Array.from(document.querySelectorAll("[data-quote-view]"));

  if (!activeList || !savedList || !emptyState || !activeSection || !savedSection || !actions
    || !summary || !message || !activeCount || !savedCount || !totalItems || !viewContainer) return;

  let confirmation = null;
  let confirmationTimer = null;

  core.renderBreadcrumbs([{ label: "Home", href: "index.html" }, { label: "Quote List" }]);

  function safeQuantity(value) {
    return core.quote.safeQuantity(value);
  }

  function getStoredView() {
    try {
      return window.localStorage.getItem(VIEW_STORAGE_KEY) === "table" ? "table" : "card";
    } catch (error) {
      return "card";
    }
  }

  function applyView(view, persist) {
    const selectedView = view === "table" ? "table" : "card";
    const isCardView = selectedView === "card";

    viewContainer.classList.toggle("is-card-view", isCardView);
    viewContainer.classList.toggle("is-table-view", !isCardView);

    viewButtons.forEach(function (button) {
      const active = button.getAttribute("data-quote-view") === selectedView;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (persist) {
      try {
        window.localStorage.setItem(VIEW_STORAGE_KEY, selectedView);
      } catch (error) {
        // The layout still changes even when browser storage is unavailable.
      }
    }
  }

  function icon(name) {
    const common = "viewBox=\"0 0 24 24\" aria-hidden=\"true\"";

    if (name === "trash") {
      return "<svg " + common + "><path d=\"M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5\"/></svg>";
    }
    if (name === "minus") {
      return "<svg " + common + "><path d=\"M5 12h14\"/></svg>";
    }
    if (name === "plus") {
      return "<svg " + common + "><path d=\"M12 5v14M5 12h14\"/></svg>";
    }
    if (name === "bookmark") {
      return "<svg " + common + "><path d=\"M6 3h12v18l-6-4-6 4V3Z\"/></svg>";
    }
    return "";
  }

  function getSavedItems() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(SAVED_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function setSavedItems(items) {
    try {
      window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      // Nothing else is required here; the active Quote List remains usable.
    }
  }

  function validItems(items) {
    return items.filter(function (item) {
      return item && item.id && productApi.getProductById(item.id);
    }).map(function (item) {
      return { id: item.id, qty: safeQuantity(item.qty), notes: item.notes || "" };
    });
  }

  function itemCount(items) {
    return items.reduce(function (total, item) {
      return total + safeQuantity(item.qty);
    }, 0);
  }

  function renderItem(item, source) {
    const product = productApi.getProductById(item.id);
    if (!product) return "";

    const category = core.getCategory(product.category);
    const quantity = safeQuantity(item.qty);
    const isSaved = source === "saved";
    const isSingle = quantity === 1;
    const lowerAction = isSingle ? "remove" : "decrease";
    const lowerLabel = isSingle ? "Remove " + product.id : "Decrease " + product.id + " quantity";
    const lowerIcon = isSingle ? icon("trash") : icon("minus");
    const movementAction = isSaved ? "move-to-active" : "save-for-later";
    const movementLabel = isSaved ? "Move to list" : "Save for later";
    const hasConfirmation = confirmation && confirmation.id === product.id && confirmation.source === source;

    return "<article class=\"qlx-item\" role=\"row\" data-quote-source=\"" + source + "\" data-quote-item=\"" + core.escapeHtml(product.id) + "\">"
      + "<div class=\"qlx-cell qlx-item__photo\" role=\"cell\">" + core.renderProductVisual(product, category, "product-thumb") + "</div>"
      + "<div class=\"qlx-cell qlx-item__qty\" role=\"cell\"><div class=\"qlx-quantity-stack\">"
      + "<div class=\"quantity-stepper\">"
      + "<button class=\"quantity-stepper-button\" type=\"button\" data-quote-action=\"" + lowerAction + "\" aria-label=\"" + core.escapeHtml(lowerLabel) + "\">" + lowerIcon + "</button>"
      + "<span class=\"quantity-stepper-input\" aria-label=\"Quantity\">" + quantity + "</span>"
      + "<button class=\"quantity-stepper-button\" type=\"button\" data-quote-action=\"increase\" aria-label=\"Increase " + core.escapeHtml(product.id) + " quantity\">" + icon("plus") + "</button>"
      + (hasConfirmation ? "<span class=\"quantity-stepper-confirmation\" aria-label=\"Quantity updated\">✓</span>" : "")
      + "</div>"
      + "<button class=\"qlx-save-button\" type=\"button\" data-quote-action=\"" + movementAction + "\">"
      + icon("bookmark") + movementLabel + "</button>"
      + "</div></div>"
      + "<div class=\"qlx-cell qlx-item__model\" role=\"cell\"><a class=\"catalog-model-link\" href=\"" + core.productUrl(product) + "\">" + core.escapeHtml(product.id) + "</a></div>"
      + "<div class=\"qlx-cell qlx-item__description\" role=\"cell\"><p>" + core.escapeHtml(product.summary) + "</p></div>"
      + "</article>";
  }

  function showConfirmation(id, source) {
    confirmation = { id: id, source: source };
    window.clearTimeout(confirmationTimer);
    confirmationTimer = window.setTimeout(function () {
      confirmation = null;
      render();
    }, 1100);
  }

  function render() {
    const currentActive = core.quote.load();
    const currentSaved = getSavedItems();
    const active = validItems(currentActive);
    const saved = validItems(currentSaved);

    if (active.length !== currentActive.length) core.quote.save(active);
    if (saved.length !== currentSaved.length) setSavedItems(saved);

    activeList.innerHTML = active.map(function (item) { return renderItem(item, "active"); }).join("");
    savedList.innerHTML = saved.map(function (item) { return renderItem(item, "saved"); }).join("");

    const activeTotal = itemCount(active);
    const hasAnyItems = active.length > 0 || saved.length > 0;

    emptyState.hidden = hasAnyItems;
    activeSection.hidden = active.length === 0;
    savedSection.hidden = saved.length === 0;
    summary.hidden = active.length === 0;
    actions.hidden = active.length === 0;
    activeCount.textContent = "(" + active.length + ")";
    savedCount.textContent = "(" + saved.length + ")";
    totalItems.textContent = activeTotal + (activeTotal === 1 ? " item" : " items");
  }

  function updateActiveItem(id, quantity) {
    core.quote.update(id, { qty: quantity });
    window.dispatchEvent(new Event("steamselector:quote-updated"));
  }

  function updateSavedItem(id, quantity) {
    setSavedItems(getSavedItems().map(function (item) {
      return item.id === id ? { id: item.id, qty: quantity, notes: item.notes || "" } : item;
    }));
  }

  function moveToSaved(id) {
    const active = core.quote.load();
    const sourceItem = active.find(function (item) { return item.id === id; });
    if (!sourceItem) return;

    const saved = getSavedItems();
    const existing = saved.find(function (item) { return item.id === id; });
    if (existing) existing.qty = safeQuantity(existing.qty) + safeQuantity(sourceItem.qty);
    else saved.push({ id: id, qty: safeQuantity(sourceItem.qty), notes: sourceItem.notes || "" });

    setSavedItems(saved);
    core.quote.remove(id);
    window.dispatchEvent(new Event("steamselector:quote-updated"));
    message.textContent = "Item saved for later.";
  }

  function moveToActive(id) {
    const saved = getSavedItems();
    const sourceItem = saved.find(function (item) { return item.id === id; });
    if (!sourceItem) return;

    const active = core.quote.load();
    const existing = active.find(function (item) { return item.id === id; });
    if (existing) {
      core.quote.update(id, { qty: safeQuantity(existing.qty) + safeQuantity(sourceItem.qty) });
    } else {
      core.quote.save(active.concat([{ id: id, qty: safeQuantity(sourceItem.qty), notes: sourceItem.notes || "" }]));
    }

    setSavedItems(saved.filter(function (item) { return item.id !== id; }));
    window.dispatchEvent(new Event("steamselector:quote-updated"));
    message.textContent = "Item moved to your quote list.";
  }

  function removeSaved(id) {
    setSavedItems(getSavedItems().filter(function (item) { return item.id !== id; }));
    message.textContent = "Item removed from saved items.";
  }

  function buildClipboardText() {
    return validItems(core.quote.load()).map(function (item) {
      const product = productApi.getProductById(item.id);
      return safeQuantity(item.qty) + " ea - " + product.id + " - " + product.summary;
    }).join("\n");
  }

  document.addEventListener("click", function (event) {
    const actionButton = event.target.closest("[data-quote-action]");
    if (!actionButton) return;

    const itemElement = actionButton.closest("[data-quote-item]");
    if (!itemElement) return;

    const id = itemElement.getAttribute("data-quote-item");
    const source = itemElement.getAttribute("data-quote-source");
    const action = actionButton.getAttribute("data-quote-action");
    const items = source === "saved" ? getSavedItems() : core.quote.load();
    const item = items.find(function (entry) { return entry.id === id; });
    if (!item) return;

    const quantity = safeQuantity(item.qty);

    if (action === "increase") {
      const nextQuantity = quantity + 1;
      if (source === "saved") updateSavedItem(id, nextQuantity);
      else updateActiveItem(id, nextQuantity);
      showConfirmation(id, source);
      render();
      return;
    }

    if (action === "decrease") {
      const nextQuantity = Math.max(1, quantity - 1);
      if (source === "saved") updateSavedItem(id, nextQuantity);
      else updateActiveItem(id, nextQuantity);
      render();
      return;
    }

    if (action === "remove") {
      if (source === "saved") removeSaved(id);
      else {
        core.quote.remove(id);
        window.dispatchEvent(new Event("steamselector:quote-updated"));
        message.textContent = "Item removed from the quote list.";
      }
      render();
      return;
    }

    if (action === "save-for-later") {
      moveToSaved(id);
      render();
      return;
    }

    if (action === "move-to-active") {
      moveToActive(id);
      render();
    }
  });

  viewButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyView(button.getAttribute("data-quote-view"), true);
    });
  });

  document.getElementById("clearQuoteButton").addEventListener("click", function () {
    core.quote.clear();
    window.dispatchEvent(new Event("steamselector:quote-updated"));
    message.textContent = "Your active quote list was cleared.";
    render();
  });

  document.getElementById("copyQuoteButton").addEventListener("click", function () {
    const text = "SteamSelector Beta Quote List\n\n" + buildClipboardText();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        message.textContent = "Quote list copied to your clipboard.";
      }).catch(function () {
        message.textContent = "Unable to copy automatically. Please select and copy the list manually.";
      });
      return;
    }

    message.textContent = text;
  });

  document.getElementById("printQuoteButton").addEventListener("click", function () {
    window.print();
  });

  document.getElementById("emailQuoteButton").addEventListener("click", function () {
    const subject = encodeURIComponent("SteamSelector Quote List");
    const body = encodeURIComponent(buildClipboardText());
    window.location.href = "mailto:?subject=" + subject + "&body=" + body;
  });

  document.getElementById("submitQuoteButton").addEventListener("click", function () {
    message.textContent = "Quote request submission will be available in the next RFQ workflow step.";
  });

  applyView(getStoredView(), false);
  render();
})();
