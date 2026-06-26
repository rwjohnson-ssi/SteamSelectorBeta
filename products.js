/*
  Public-safe beta product data.
  This file intentionally excludes prices, customer information, supplier net costs, and internal quote data.
  Replace these sample records only with data approved for a public repository.
*/
(function () {
  "use strict";

  const PRODUCTS = [
    { id: "FT600-450-17-N", category: "steam-traps", subcategory: "float-thermostatic", series: "FT600", size: "2 in.", connection: "NPT", material: "Cast Iron", pmo: "450 PSIG", summary: "Float & thermostatic steam trap for process condensate drainage.", description: "A float and thermostatic steam trap designed for continuous condensate removal on process applications.", specs: { "Trap Type": "Float & Thermostatic", "Connection": "NPT", "Body Material": "Cast Iron", "Maximum Operating Pressure": "450 PSIG" } },
    { id: "WFT-200", category: "steam-traps", subcategory: "float-thermostatic", series: "WFT", size: "1 in.", connection: "NPT", material: "Ductile Iron", pmo: "200 PSIG", summary: "Compact float and thermostatic trap for process and HVAC applications.", description: "A compact float and thermostatic trap with continuous discharge characteristics.", specs: { "Trap Type": "Float & Thermostatic", "Connection": "NPT", "Body Material": "Ductile Iron", "Maximum Operating Pressure": "200 PSIG" } },
    { id: "IB1031", category: "steam-traps", subcategory: "inverted-bucket", series: "IB", size: "3/4 in.", connection: "NPT", material: "Cast Iron", pmo: "250 PSIG", summary: "Inverted bucket steam trap for drip and process service.", description: "An inverted bucket trap commonly used on drip legs and selected process applications.", specs: { "Trap Type": "Inverted Bucket", "Connection": "NPT", "Body Material": "Cast Iron", "Maximum Operating Pressure": "250 PSIG" } },
    { id: "TD52L", category: "steam-traps", subcategory: "thermodynamic", series: "TD", size: "1/2 in.", connection: "NPT", material: "Stainless Steel", pmo: "600 PSIG", summary: "Thermodynamic disc trap for high-pressure drip service.", description: "A compact thermodynamic disc trap suited for steam main and tracing drainage where operating conditions fit the model.", specs: { "Trap Type": "Thermodynamic", "Connection": "NPT", "Body Material": "Stainless Steel", "Maximum Operating Pressure": "600 PSIG" } },
    { id: "TS-3-150", category: "steam-traps", subcategory: "thermostatic", series: "TS", size: "3/4 in.", connection: "NPT", material: "Stainless Steel", pmo: "150 PSIG", summary: "Balanced-pressure thermostatic trap for light process loads.", description: "A thermostatic trap designed to discharge subcooled condensate according to its operating element.", specs: { "Trap Type": "Thermostatic", "Connection": "NPT", "Body Material": "Stainless Steel", "Maximum Operating Pressure": "150 PSIG" } },

    { id: "MCP-30", category: "pumps", subcategory: "all", series: "MCP", size: "30 gal.", connection: "Flanged", material: "Carbon Steel", pmo: "N/A", summary: "Electric condensate pump package for collecting and returning condensate.", description: "A condensate return package for applications where gravity drainage is insufficient.", specs: { "Equipment Type": "Electric Condensate Pump", "Receiver": "30 gallon", "Connection": "Flanged", "Construction": "Carbon Steel" } },
    { id: "PPT-2-125", category: "pumps", subcategory: "all", series: "PPT", size: "2 in.", connection: "NPT", material: "Ductile Iron", pmo: "125 PSIG", summary: "Pressure-powered pump trap for stalled heat-transfer equipment.", description: "A pressure-powered pump trap intended for applications that can stall under varying pressure conditions.", specs: { "Equipment Type": "Pressure-Powered Pump", "Connection": "NPT", "Body Material": "Ductile Iron", "Maximum Operating Pressure": "125 PSIG" } },

    { id: "HD-150-1", category: "regulators", subcategory: "pilot-operated", series: "HD", size: "1 in.", connection: "NPT", material: "Ductile Iron", pmo: "250 PSIG", summary: "Pilot-operated pressure-reducing valve for steam service.", description: "A pilot-operated regulator designed for stable steam-pressure reduction when sized to actual load and pressure conditions.", specs: { "Regulator Type": "Pilot Operated PRV", "Connection": "NPT", "Body Material": "Ductile Iron", "Maximum Inlet Pressure": "250 PSIG" } },
    { id: "W91-05-08S15", category: "regulators", subcategory: "temperature-regulator", series: "W91", size: "1-1/2 in.", connection: "NPT", material: "Stainless Steel", pmo: "70 PSIG", summary: "Self-operated temperature regulator for heating or cooling service.", description: "A self-operated thermal regulator that responds to the remote sensing bulb temperature.", specs: { "Regulator Type": "Temperature Regulator", "Connection": "NPT", "Body Material": "Stainless Steel", "Maximum Operating Pressure": "70 PSIG" } },
    { id: "DPRV-075", category: "regulators", subcategory: "direct-operated", series: "DPRV", size: "3/4 in.", connection: "NPT", material: "Bronze", pmo: "250 PSIG", summary: "Direct-operated pressure regulator for lower-capacity duty.", description: "A compact direct-operated pressure reducing valve for applications within its capacity range.", specs: { "Regulator Type": "Direct Operated PRV", "Connection": "NPT", "Body Material": "Bronze", "Maximum Inlet Pressure": "250 PSIG" } },
    { id: "DOME-150-2", category: "regulators", subcategory: "dome-loaded", series: "DOME", size: "2 in.", connection: "Flanged", material: "Cast Steel", pmo: "300 PSIG", summary: "Dome-loaded regulator for demanding pressure-control duty.", description: "A dome-loaded pressure regulator intended for process conditions requiring responsive control.", specs: { "Regulator Type": "Dome Loaded", "Connection": "Flanged", "Body Material": "Cast Steel", "Maximum Inlet Pressure": "300 PSIG" } },

    { id: "HB-2-42", category: "control-valves", subcategory: "all", series: "HB", size: "2 in.", connection: "PN16 Flanged", material: "Cast Iron", pmo: "230 PSIG", summary: "Three-way control valve for mixing or diverting process flow.", description: "A three-way globe control valve platform used for mixing or diverting, depending on port arrangement and actuator selection.", specs: { "Valve Type": "Three-Way Globe", "Nominal Cv": "42", "Connection": "PN16 Flanged", "Body Material": "Cast Iron" } },
    { id: "SVF-150-1", category: "control-valves", subcategory: "all", series: "SVF", size: "1 in.", connection: "NPT", material: "Stainless Steel", pmo: "150 PSIG", summary: "Automated ball valve for on/off process isolation.", description: "A stainless-steel ball valve platform that can be configured with an electric or pneumatic actuator.", specs: { "Valve Type": "Automated Ball Valve", "Connection": "NPT", "Body Material": "Stainless Steel", "Maximum Operating Pressure": "150 PSIG" } },

    { id: "WLD1414-N-065", category: "liquid-drainers", subcategory: "all", series: "WLD1400", size: "1 in.", connection: "NPT", material: "Ductile Iron", pmo: "65 PSIG", summary: "Float-type liquid drainer for compressed-air and gas service.", description: "A float-type liquid drainer for removing accumulated liquid from suitable non-steam service applications.", specs: { "Drainer Type": "Float Type", "Connection": "NPT", "Body Material": "Ductile Iron", "Maximum Operating Pressure": "65 PSIG" } },
    { id: "WLDE-200-17-N", category: "liquid-drainers", subcategory: "all", series: "WLDE", size: "2 in.", connection: "NPT", material: "Ductile Iron", pmo: "200 PSIG", summary: "Parallel-port float-type liquid drainer.", description: "A heavy-duty liquid drainer with a parallel-port connection pattern for selected drainage installations.", specs: { "Drainer Type": "Float Type", "Connection": "NPT", "Body Material": "Ductile Iron", "Maximum Operating Pressure": "200 PSIG" } },

    { id: "YULA-40", category: "heat-exchangers", subcategory: "all", series: "YULA", size: "39.7 sq. ft.", connection: "3 in. Flanged", material: "Stainless Steel", pmo: "150 PSIG", summary: "Gasketed plate heat exchanger for water-to-water heat transfer.", description: "A gasketed plate heat exchanger configuration for an engineered liquid heat-transfer application.", specs: { "Exchanger Type": "Gasketed Plate", "Heat Transfer Area": "39.7 sq. ft.", "Connection": "3 in. Flanged", "Plate Material": "Stainless Steel" } },
    { id: "TS6-MFG", category: "heat-exchangers", subcategory: "all", series: "TS6", size: "11.1 sq. ft.", connection: "3 in. Flanged", material: "AISI 316", pmo: "150 PSIG", summary: "Gasketed plate heat exchanger package.", description: "A compact gasketed plate heat exchanger family for liquid heat-transfer applications.", specs: { "Exchanger Type": "Gasketed Plate", "Heat Transfer Area": "11.1 sq. ft.", "Connection": "3 in. Flanged", "Plate Material": "AISI 316" } },

    { id: "Y-STR-150-2", category: "pipeline-accessories", subcategory: "all", series: "Y-STR", size: "2 in.", connection: "Flanged", material: "Cast Steel", pmo: "150 PSIG", summary: "Y-strainer for pipeline protection.", description: "A pipeline strainer intended to protect downstream equipment from debris.", specs: { "Accessory Type": "Y-Strainer", "Connection": "Flanged", "Body Material": "Cast Steel", "Pressure Class": "150 lb." } },
    { id: "VSI-300-1", category: "pipeline-accessories", subcategory: "all", series: "VSI", size: "1 in.", connection: "NPT", material: "Stainless Steel", pmo: "300 PSIG", summary: "Steam-system isolation valve.", description: "A manually operated isolation valve suitable for selected steam-system service.", specs: { "Accessory Type": "Isolation Valve", "Connection": "NPT", "Body Material": "Stainless Steel", "Maximum Operating Pressure": "300 PSIG" } },

    { id: "W-KIT-82-14", category: "repair-kits", subcategory: "all", series: "W-KIT", size: "1 in. / 1-1/4 in.", connection: "N/A", material: "Mixed", pmo: "N/A", summary: "Service kit for selected pressure regulator models.", description: "A repair kit configuration intended to restore serviceable components in compatible regulator models.", specs: { "Kit Type": "Regulator Service Kit", "Compatible Size": "1 in. / 1-1/4 in.", "Application": "Repair and maintenance", "Price": "Contact SSI Services" } },
    { id: "FT600-RK-17", category: "repair-kits", subcategory: "all", series: "FT600", size: "2 in.", connection: "N/A", material: "Mixed", pmo: "N/A", summary: "Maintenance kit for selected FT600 steam traps.", description: "A repair-kit record used as a public-safe placeholder for a compatible steam-trap maintenance package.", specs: { "Kit Type": "Steam Trap Repair Kit", "Compatible Series": "FT600", "Compatible Size": "2 in.", "Price": "Contact SSI Services" } }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getAllProducts() {
    return clone(PRODUCTS);
  }

  function getProductById(productId) {
    const product = PRODUCTS.find(function (item) { return item.id.toLowerCase() === String(productId || "").toLowerCase(); });
    return product ? clone(product) : null;
  }

  function getProductsByCategory(categoryId) {
    return PRODUCTS.filter(function (item) { return item.category === categoryId; }).map(clone);
  }

  window.SteamSelectorProducts = {
    getAllProducts: getAllProducts,
    getProductById: getProductById,
    getProductsByCategory: getProductsByCategory
  };
})();
