/*
  Category route guard.
  Steam Traps is a normal category, not the fallback destination.
*/
(function () {
  "use strict";

  const categoryApi = window.SteamSelectorCategories;
  if (!categoryApi) return;

  const params = new URLSearchParams(window.location.search);
  const categoryId = String(params.get("id") || "").trim();
  const validCategory = categoryId && categoryApi.getCategoryById(categoryId);

  if (!validCategory) {
    window.location.replace("index.html#browse-categories");
  }
})();
