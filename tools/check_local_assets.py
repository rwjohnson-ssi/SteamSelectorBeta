#!/usr/bin/env python3
"""Fail when a locally referenced browser CSS or JavaScript file is missing.

The SteamSelector Beta site is published directly from the repository root.
This check protects against successful deployments that load with missing styles
or scripts because a linked asset was renamed, deleted, or not committed.
"""

from __future__ import annotations

import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
ASSET_SUFFIXES = {".css", ".js"}
NON_BROWSER_DIRECTORIES = {".git", ".github", "server", "tools"}


class HtmlAssetParser(HTMLParser):
    """Collect stylesheet and script references from an HTML document."""

    def __init__(self) -> None:
        super().__init__()
        self.references: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key.lower(): value or "" for key, value in attrs}
        if tag.lower() == "script" and attributes.get("src"):
            self.references.append(attributes["src"])
        if tag.lower() == "link" and "stylesheet" in attributes.get("rel", "").lower().split():
            if attributes.get("href"):
                self.references.append(attributes["href"])


def is_local_asset(reference: str) -> bool:
    """Return True only for local CSS or JavaScript asset paths."""
    value = reference.strip()
    if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
        return False

    parts = urlsplit(value)
    if parts.scheme or parts.netloc:
        return False

    return Path(parts.path).suffix.lower() in ASSET_SUFFIXES


def resolve_asset(source_file: Path, reference: str) -> Path:
    """Resolve a site-relative or source-relative asset to a repository path."""
    path = urlsplit(reference).path
    if path.startswith("/"):
        return ROOT / path.lstrip("/")
    return source_file.parent / path


def is_browser_source(path: Path) -> bool:
    """Exclude backend examples and build tooling from browser asset inspection."""
    relative_parts = path.relative_to(ROOT).parts
    return not any(part in NON_BROWSER_DIRECTORIES for part in relative_parts)


def inspect_html_file(path: Path) -> list[tuple[Path, str]]:
    parser = HtmlAssetParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return [(path, reference) for reference in parser.references if is_local_asset(reference)]


def inspect_js_file(path: Path) -> list[tuple[Path, str]]:
    # This catches assets dynamically assigned to `src` / `href` and files passed
    # as literal strings to helpers such as appendScript(). Only browser-facing
    # JavaScript is inspected; server examples are not loaded by GitHub Pages.
    text = path.read_text(encoding="utf-8")
    quoted_asset = re.compile(r"[\"']([^\"']+\.(?:css|js)(?:[?#][^\"']*)?)[\"']", re.IGNORECASE)
    return [(path, match.group(1)) for match in quoted_asset.finditer(text) if is_local_asset(match.group(1))]


def main() -> int:
    references: list[tuple[Path, str]] = []
    references.extend(
        reference
        for html_file in ROOT.rglob("*.html")
        if is_browser_source(html_file)
        for reference in inspect_html_file(html_file)
    )
    references.extend(
        reference
        for js_file in ROOT.rglob("*.js")
        if is_browser_source(js_file)
        for reference in inspect_js_file(js_file)
    )

    missing: list[str] = []
    checked: set[tuple[Path, str]] = set()
    for source_file, reference in references:
        key = (source_file, reference)
        if key in checked:
            continue
        checked.add(key)

        target = resolve_asset(source_file, reference)
        if not target.is_file():
            relative_source = source_file.relative_to(ROOT)
            relative_target = target.relative_to(ROOT) if target.is_relative_to(ROOT) else target
            missing.append(f"{relative_source}: {reference} -> {relative_target}")

    if missing:
        print("Missing local CSS/JS assets found:\n")
        print("\n".join(f"- {item}" for item in missing))
        return 1

    print(f"Validated {len(checked)} local CSS/JS references. All referenced assets exist.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
