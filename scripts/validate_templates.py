#!/usr/bin/env python3
"""
Validate every shipped template against the v1 contract.

Run from the repository root:

    python scripts/validate_templates.py

Exits non-zero on any of the following problems:

  - templates/manifest.json missing or unparseable
  - a template directory missing template.json
  - a template.json missing required keys (schema, id, kind, name, slots, files)
  - a `files[]` entry pointing at a path that does not exist on disk
  - a directory under templates/{scaffolds,themes,examples}/ that the manifest
    does not list, or vice versa
  - duplicate template ids across kinds
  - slot definitions missing `name` / `kind`
  - placeholder references in source files that no slot defines

This is the script the template-validation CI runs and the source of truth
for the "templates: passing" badge in the README.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"
MANIFEST_PATH = TEMPLATES / "manifest.json"

REQUIRED_TPL_KEYS = {"schema", "id", "kind", "name", "description", "slots", "files"}
VALID_KINDS = {"scaffold", "theme", "example"}
VALID_SLOT_KINDS = {
    "string", "multiline", "number", "boolean",
    "enum", "url", "color", "slug",
}
PLACEHOLDER_RE = re.compile(r"\{\{([A-Z_][A-Z0-9_]*)\}\}")

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def validate_template_json(tpl_path: Path) -> dict | None:
    try:
        data = json.loads(tpl_path.read_text(encoding="utf-8"))
    except Exception as e:
        err(f"{tpl_path.relative_to(ROOT)}: cannot parse JSON: {e}")
        return None

    missing = REQUIRED_TPL_KEYS - set(data.keys())
    if missing:
        err(f"{tpl_path.relative_to(ROOT)}: missing keys {sorted(missing)}")

    if data.get("kind") not in VALID_KINDS:
        err(f"{tpl_path.relative_to(ROOT)}: invalid kind {data.get('kind')!r}")

    slots = data.get("slots", [])
    if not isinstance(slots, list):
        err(f"{tpl_path.relative_to(ROOT)}: slots must be a list")
        slots = []

    slot_names: set[str] = set()
    for i, slot in enumerate(slots):
        if not isinstance(slot, dict):
            err(f"{tpl_path.relative_to(ROOT)}: slot[{i}] must be an object")
            continue
        name = slot.get("name")
        kind = slot.get("kind")
        if not name:
            err(f"{tpl_path.relative_to(ROOT)}: slot[{i}] missing name")
            continue
        if kind not in VALID_SLOT_KINDS:
            err(f"{tpl_path.relative_to(ROOT)}: slot {name!r} has invalid kind {kind!r}")
        if name in slot_names:
            err(f"{tpl_path.relative_to(ROOT)}: duplicate slot {name!r}")
        slot_names.add(name)

    files = data.get("files", [])
    if not isinstance(files, list):
        err(f"{tpl_path.relative_to(ROOT)}: files must be a list")
        files = []

    tpl_dir = tpl_path.parent
    for rel in files:
        if not isinstance(rel, str):
            err(f"{tpl_path.relative_to(ROOT)}: files[] must contain strings")
            continue
        full = tpl_dir / rel
        if not full.exists():
            err(f"{tpl_path.relative_to(ROOT)}: file not found on disk: {rel}")
            continue
        # Check placeholders only reference declared slots.
        if full.is_file() and full.suffix in {".json", ".html", ".js", ".css", ".md", ".yml", ".yaml", ".toml"}:
            try:
                body = full.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            for match in PLACEHOLDER_RE.findall(body):
                if match not in slot_names:
                    warn(f"{tpl_path.relative_to(ROOT)}: file {rel} references {{{{{match}}}}} but no slot of that name")

    return data


def discover_dirs(kind_dir: Path) -> Iterable[Path]:
    if not kind_dir.exists():
        return []
    return sorted(p for p in kind_dir.iterdir() if p.is_dir())


def main() -> int:
    if not MANIFEST_PATH.exists():
        err(f"manifest not found: {MANIFEST_PATH.relative_to(ROOT)}")
        return finish()

    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        err(f"manifest unparseable: {e}")
        return finish()

    seen_ids: dict[str, str] = {}

    for kind, dir_name, key in (
        ("scaffold", "scaffolds", "scaffolds"),
        ("theme", "themes", "themes"),
        ("example", "examples", "examples"),
    ):
        kind_dir = TEMPLATES / dir_name
        listed = manifest.get(key, [])
        listed_paths = {entry["path"] for entry in listed if isinstance(entry, dict)}

        for tpl_dir in discover_dirs(kind_dir):
            rel = tpl_dir.relative_to(TEMPLATES).as_posix()
            tpl_json = tpl_dir / "template.json"
            if not tpl_json.exists():
                err(f"templates/{rel}: missing template.json")
                continue

            data = validate_template_json(tpl_json)
            if data is None:
                continue

            tpl_id = data.get("id")
            if tpl_id in seen_ids:
                err(f"duplicate template id {tpl_id!r} ({rel} vs {seen_ids[tpl_id]})")
            elif tpl_id:
                seen_ids[tpl_id] = rel

            if data.get("kind") != kind:
                err(f"templates/{rel}: kind mismatch ({data.get('kind')!r} vs directory {kind!r})")

            # manifest paths are relative to templates/
            if rel not in listed_paths:
                err(f"templates/{rel}: directory not listed in manifest.json under '{key}'")

        for entry in listed:
            if not isinstance(entry, dict):
                continue
            entry_path = TEMPLATES / entry.get("path", "")
            if not entry_path.exists():
                err(f"manifest.json: entry path does not exist: templates/{entry.get('path')}")

    return finish()


def finish() -> int:
    print()
    if warnings:
        print(f"[warn] {len(warnings)} warnings:")
        for w in warnings:
            print(f"  {w}")
        print()
    if errors:
        print(f"[fail] {len(errors)} errors:")
        for e in errors:
            print(f"  {e}")
        print()
        return 1
    print("[ok] all templates valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
