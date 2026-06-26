/*
  SteamSelector Beta category configuration.
  Keep category-specific labels and navigation here so all pages use the same structure.
*/
(function () {
  "use strict";

  const CATEGORY_DEFINITIONS = [
    {
      id: "steam-traps",
      title: "Steam Traps",
      description: "Drain condensate while preventing unnecessary live steam loss.",
      icon: "ST",
      children: [
        { id: "all", title: "All Steam Traps" },
        { id: "float-thermostatic", title: "Float & Thermostatic" },
        { id: "inverted-bucket", title: "Inverted Bucket" },
        { id: "thermodynamic", title: "Thermodynamic" },
        { id: "thermostatic", title: "Thermostatic" }
      ]
    },
    {
      id: "pumps",
      title: "Pumps",
      description: "Return condensate where gravity drainage alone is not practical.",
      icon: "PU",
      children: []
    },
    {
      id: "regulators",
      title: "Regulators",
      description: "Reduce or control pressure, temperature, and process conditions.",
      icon: "RG",
      children: [
        { id: "all", title: "All Regulators" },
        { id: "direct-operated", title: "Direct Operated" },
        { id: "temperature-regulator", title: "Temperature Regulators" },
        { id: "pilot-operated", title: "Pilot Operated" },
        { id: "dome-loaded", title: "Dome Loaded" }
      ]
    },
    {
      id: "control-valves",
      title: "Control Valves",
      description: "Modulate flow, pressure, temperature, or level in a process.",
      icon: "CV",
      children: []
    },
    {
      id: "liquid-drainers",
      title: "Liquid Drainers",
      description: "Remove condensate or liquid from compressed-air and gas systems.",
      icon: "LD",
      children: []
    },
    {
      id: "heat-exchangers",
      title: "Heat Exchangers",
      description: "Transfer heat efficiently between steam, water, and process fluids.",
      icon: "HX",
      children: []
    },
    {
      id: "pipeline-accessories",
      title: "Pipeline Accessories",
      description: "Support reliable steam-system installation, isolation, and measurement.",
      icon: "PA",
      children: []
    },
    {
      id: "repair-kits",
      title: "Repair Kits",
      description: "Maintain installed equipment with the right replacement components.",
      icon: "RK",
      children: []
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getAllCategories() {
    return clone(CATEGORY_DEFINITIONS);
  }

  function getCategoryById(categoryId) {
    const result = CATEGORY_DEFINITIONS.find(function (category) {
      return category.id === categoryId;
    });
    return result ? clone(result) : null;
  }

  function getCategoryHref(categoryId, childId) {
    const parameters = new URLSearchParams({ id: categoryId });
    if (childId && childId !== "all") parameters.set("type", childId);
    return "category.html?" + parameters.toString();
  }

  window.SteamSelectorCategories = {
    getAllCategories: getAllCategories,
    getCategoryById: getCategoryById,
    getCategoryHref: getCategoryHref
  };
})();
