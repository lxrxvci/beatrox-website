#!/usr/bin/env python3
"""
Normalize Payload project slugs from prefixed format (work/<slug>)
to canonical short format (<slug>) and create redirect rows for
legacy generated URLs.
"""

from __future__ import annotations

import argparse
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def normalize_slug(value: str) -> str:
    slug = value.strip().lower().lstrip("/")
    if slug.startswith("work/"):
        slug = slug[len("work/") :]
    slug = "-".join(part for part in slug.replace("_", "-").split("-") if part)
    return slug


def iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def upsert_redirect(cur: sqlite3.Cursor, from_path: str, to_path: str, note: str) -> None:
    existing = cur.execute("SELECT id FROM redirects WHERE \"from\" = ? LIMIT 1", (from_path,)).fetchone()
    now = iso_now()
    if existing:
        cur.execute(
            """
            UPDATE redirects
            SET "to" = ?, status_code = '301', is_enabled = 1, note = ?, updated_at = ?
            WHERE id = ?
            """,
            (to_path, note, now, existing[0]),
        )
    else:
        cur.execute(
            """
            INSERT INTO redirects ("from", "to", status_code, is_enabled, note, created_at, updated_at)
            VALUES (?, ?, '301', 1, ?, ?, ?)
            """,
            (from_path, to_path, note, now, now),
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrate Payload project slugs to canonical short format.")
    parser.add_argument(
        "--db",
        default="site/.cms-data/payload.db",
        help="Path to Payload SQLite DB (default: site/.cms-data/payload.db)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Show planned changes without writing.")
    args = parser.parse_args()

    db_path = Path(args.db).resolve()
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found: {db_path}")

    con = sqlite3.connect(str(db_path))
    cur = con.cursor()

    rows = cur.execute(
        """
        SELECT id, slug
        FROM projects
        WHERE slug LIKE 'work/%' OR slug LIKE '/work/%'
        ORDER BY id
        """
    ).fetchall()

    if not rows:
        print("No prefixed project slugs found. Nothing to migrate.")
        return 0

    updates = []
    for project_id, old_slug in rows:
        canonical = normalize_slug(old_slug or "")
        if not canonical:
            continue

        duplicate = cur.execute(
            "SELECT id FROM projects WHERE slug = ? AND id != ? LIMIT 1",
            (canonical, project_id),
        ).fetchone()
        if duplicate:
            print(
                f"SKIP id={project_id}: canonical slug '{canonical}' already used by project id={duplicate[0]}"
            )
            continue

        updates.append((project_id, old_slug, canonical))

    if not updates:
        print("No safe updates to apply.")
        return 0

    print(f"Planned updates: {len(updates)}")
    for project_id, old_slug, canonical in updates:
        print(f" - id={project_id}: {old_slug} -> {canonical}")

    if args.dry_run:
        print("Dry run complete. No changes written.")
        return 0

    now = iso_now()
    for project_id, old_slug, canonical in updates:
        cur.execute(
            "UPDATE projects SET slug = ?, updated_at = ? WHERE id = ?",
            (canonical, now, project_id),
        )
        legacy_path = f"/{(old_slug or '').lstrip('/')}"
        canonical_path = f"/work/{canonical}"
        if legacy_path != canonical_path:
            note = "Auto-created by migrate-cms-project-slugs.py"
            upsert_redirect(cur, legacy_path, canonical_path, note)

    con.commit()
    print("Migration complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
