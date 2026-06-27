/*
  SteamSelector Beta catalog configuration.
  Update shared filters, table columns, labels, and default behavior here.
  Category-specific overrides can be added below without copying page controllers.
*/
(function () {
  "use strict";

  const SHARED_CATALOG_CONFIG = {
    defaultView: "table",
    pageSize: 10,
    filters: [
      { key: "subcategory", label: "Subcategory" },
      { key: "series", label: "Series" },
      { key: "size", label: "Size" },
      { key: "connection", label: "Connection" },
      { key: "material", label: "Body Material" }
    ],
    tableColumns: [
      { key: "subcategory", label: "Type" },
      { key: "series", label: "Series" },
      { key: "size", label: "Size" },
      { key: "connection", label: "Connection" },
      { key: "material", label: "Body" },
      { key: "pmo", label: "Max Rating" }
    ]
  };

  const CATEGORY_OVERRIDES = {
    "steam-traps": {
      tableColumns: [
        { key: "subcategory", label: "Trap Type" },
        { key: "series", label: "Series" },
        { key: "size", label: "Size" },
        { key: "connection", label: "Connection" },
        { key: "material", label: "Body" },
        { key: "pmo", label: "Max PMO" }
      ]
    },
    regulators: {
      tableColumns: [
        { key: "subcategory", label: "Regulator Type" },
        { key: "series", label: "Series" },
        { key: "size", label: "Size" },
        { key: "connection", label: "Connection" },
        { key: "material", label: "Body" },
        { key: "pmo", label: "Max Inlet" }
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
