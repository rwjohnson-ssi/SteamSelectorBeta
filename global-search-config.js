/*
  Global search configuration.

  Leave apiEndpoint blank while SteamSelector Beta is served from GitHub Pages.
  The global search then uses the public product catalog in products.js.

  When a backend is deployed, set this to a same-origin route or full API URL,
  for example: "/api/search/suggestions".
*/
window.SteamSelectorGlobalSearchConfig = {
  apiEndpoint: "",
  requestTimeoutMs: 2200,
  maximumSuggestions: 7,
  maximumProducts: 6
};
