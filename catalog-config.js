/*
  SteamSelector Beta catalog configuration.
  Shared filters, table columns, result count options, and default behavior live here.
*/
(function () {
  "use strict";

  const SHARED_CATALOG_CONFIG = {
    defaultView: "table",
    defaultSort: "best-match",
    pageSize: 25,
    pageSizes: [25, 50, 100],
    filters: [
      { key: "subcategory", label: "Type" },
      { key: "series", label: "Series" },
      { key: "size", label: "Size" },
      { key: "connection", label: "Connection" },
      { key: "material", label: "Body Material" }
    ],
    tableColumns: [
      { key: "subcategory", label: "Type", sortable: true },
      { key: "size", label: "Size", sortable: true },
      { key: "connection", label: "Connection", sortable: true },
      { key: "pmo", label: "Max Rating", sortable: true }
    ]
  };

  const CATEGORY_OVERRIDES = {
    "steam-traps": {
      tableColumns: [
        { key: "subcategory", label: "Type", sortable: true },
        { key: "size", label: "Size", sortable: true },
        { key: "connection", label: "Connection", sortable: true },
        { key: "pmo", label: "Max PMO", sortable: true }
      ]
    },
    regulators: {
      tableColumns: [
        { key: "subcategory", label: "Type", sortable: true },
        { key: "size", label: "Size", sortable: true },
        { key: "connection", label: "Connection", sortable: true },
        { key: "pmo", label: "Max Inlet", sortable: true }
      ]
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getCatalogConfig(categoryId) {
    const override = CATEGORY_OVERRIDES[categoryId] || {};
    const config = clone(SHARED_CATALOG_CONFIG);

    Object.keys(override).forEach(function (key) {
      config[key] = clone(override[key]);
    });

    return config;
  }

  window.SteamSelectorCatalogConfig = {
    getCatalogConfig: getCatalogConfig
  };
})();
