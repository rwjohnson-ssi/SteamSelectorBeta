/* Steam Trap-only Quick View cleanup for long model text and unavailable documents. */
(function () {
  "use strict";

  const parameters = new URLSearchParams(window.location.search);
  if (parameters.get("id") !== "steam-traps") return;

  document.body.classList.add("steam-traps-catalog");

  function simplifyUnavailableDocuments() {
    const root = document.querySelector("#quickViewContent .quick-view-redesign");
    if (!root) return;

    const documents = Array.from(root.querySelectorAll(".quick-view-document"));
    const unavailable = documents.filter(function (documentItem) {
      return documentItem.classList.contains("is-unavailable");
    });

    if (!documents.length || unavailable.length !== documents.length) return;

    const section = root.querySelector(".quick-view-documents-section");
    const list = root.querySelector(".quick-view-document-list");
    if (!section || !list || section.dataset.compactUnavailable === "true") return;

    section.dataset.compactUnavailable = "true";
    section.classList.add("quick-view-documents-unavailable");
    list.innerHTML = "<p class=\"quick-view-documents-empty\">Documents are not available in this public beta catalog.</p>";
  }

  const contentMount = document.getElementById("quickViewContent");
  if (!contentMount) return;

  const observer = new MutationObserver(simplifyUnavailableDocuments);
  observer.observe(contentMount, { childList: true, subtree: true });
  simplifyUnavailableDocuments();
})();
