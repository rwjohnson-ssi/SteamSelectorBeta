/*
  SteamSelector Beta catalog configuration.
  This file is the single source of truth for the shared catalog's
  labels, filters, table columns, sort choices, Quick View fields,
  result-card metadata, and paging defaults.
*/
(function () {
  "use strict";

  const SHARED_CATALOG_CONFIG = {
    defaultView: "table",
    defaultSort: "best-match",
    pageSize: 25,
    pageSizes: [25, 50, 100],

    labels: {
      model: "Model",
      productType: "Product Type",
      quickView: "Quick View",
      image: "Image",
      productDetails: "Product details",
      sortResults: "Sort Results",
      sortDirection: "Sort direction",
      showResults: "Show:",
      documents: {
        specSheet: "Product Spec Sheet PDF",
        manual: "Manual PDF"
      }
    },

    filters: [
      { key: "subcategory", label: "Product Type", format: "title-case" },
      { key: "series", label: "Series" },
      { key: "size", label: "Size" },
      { key: "connection", label: "Connection" },
      { key: "material", label: "Body Material" }
    ],

    tableColumns: [
      { key: "subcategory", label: "Type", sortable: true, format: "title-case" },
      { key: "size", label: "Size", sortable: true },
      { key: "connection", label: "Connection", sortable: true },
      { key: "pmo", label: "Max Rating", sortable: true }
    ],

    quickViewFields: [
      { key: "subcategory", label: "Type", format: "title-case" },
      { key: "size", label: "Size" },
      { key: "connection", label: "Connection" },
      { key: "pmo", label: "Max Rating" }
    ],

    listMetaFields: [
      { key: "size", label: "Size" },
      { key: "connection", label: "Connection" },
      { key: "pmo", label: "Max Rating" }
    ],

    sortOptions: [
      { value: "best-match", label: "Best Match" },
      { value: "id", label: "Model Number" },
      { value: "subcategory", label: "Product Type" },
      { value: "size", label: "Size" },
      { value: "connection", label: "Connection" },
      { value: "pmo", label: "Max Rating" }
    ]
  };

  const CATEGORY_OVERRIDES = {
    "steam-traps": {
      tableColumns: [
        { key: "subcategory", label: "Type", sortable: true, format: "title-case" },
        { key: "size", label: "Size", sortable: true },
        { key: "connection", label: "Connection", sortable: true },
        { key: "pmo", label: "Max PMO", sortable: true }
      ],
      quickViewFields: [
        { key: "subcategory", label: "Type", format: "title-case" },
        { key: "size", label: "Size" },
        { key: "connection", label: "Connection" },
        { key: "pmo", label: "Max PMO" }
      ],
      listMetaFields: [
        { key: "size", label: "Size" },
        { key: "connection", label: "Connection" },
        { key: "pmo", label: "Max PMO" }
      ],
      sortOptions: [
        { value: "best-match", label: "Best Match" },
        { value: "id", label: "Model Number" },
        { value: "subcategory", label: "Product Type" },
        { value: "size", label: "Size" },
        { value: "connection", label: "Connection" },
        { value: "pmo", label: "Max PMO" }
      ]
    },

    regulators: {
      tableColumns: [
        { key: "subcategory", label: "Type", sortable: true, format: "title-case" },
        { key: "size", label: "Size", sortable: true },
        { key: "connection", label: "Connection", sortable: true },
        { key: "pmo", label: "Max Inlet", sortable: true }
      ],
      quickViewFields: [
        { key: "subcategory", label: "Type", format: "title-case" },
        { key: "size", label: "Size" },
        { key: "connection", label: "Connection" },
        { key: "pmo", label: "Max Inlet" }
      ],
      listMetaFields: [
        { key: "size", label: "Size" },
        { key: "connection", label: "Connection" },
        { key: "pmo", label: "Max Inlet" }
      ],
      sortOptions: [
        { value: "best-match", label: "Best Match" },
        { value: "id", label: "Model Number" },
        { value: "subcategory", label: "Product Type" },
        { value: "size", label: "Size" },
        { value: "connection", label: "Connection" },
        { value: "pmo", label: "Max Inlet" }
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
