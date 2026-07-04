# Deployment Notes

SteamSelector Beta is published as a static GitHub Pages site from the repository root.

- GitHub Pages should publish from `main` and `/(root)` when branch deployment is selected.
- `.nojekyll` keeps the site on direct static-file publishing.
- The `Validate Local Assets` workflow checks browser-loaded local CSS and JavaScript references before release.
