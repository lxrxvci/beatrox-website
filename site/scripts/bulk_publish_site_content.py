#!/usr/bin/env python3
import argparse
import json
import sqlite3
from pathlib import Path

TARGET_TABLES = ["projects", "services", "pages", "team"]


def table_columns(cur: sqlite3.Cursor, table: str) -> set[str]:
    return {row[1] for row in cur.execute(f"PRAGMA table_info({table})").fetchall()}


def main():
    parser = argparse.ArgumentParser(description="Bulk publish site-facing Payload content tables.")
    parser.add_argument("--db", default=".cms-data/payload.db", help="Path to payload sqlite db")
    parser.add_argument("--apply", action="store_true", help="Apply updates")
    args = parser.parse_args()

    db = Path(args.db).resolve()
    if not db.exists():
        raise FileNotFoundError(f"Database not found: {db}")

    con = sqlite3.connect(str(db))
    cur = con.cursor()

    summary: dict[str, dict[str, int]] = {}
    for table in TARGET_TABLES:
        cols = table_columns(cur, table)
        total = cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        updated_status = 0
        updated_payload_status = 0
        updated_enabled = 0

        if args.apply:
            if "status" in cols:
                cur.execute(f"UPDATE {table} SET status='published' WHERE status IS NULL OR status != 'published'")
                updated_status = cur.rowcount
            if "_status" in cols:
                cur.execute(f"UPDATE {table} SET _status='published' WHERE _status IS NULL OR _status != 'published'")
                updated_payload_status = cur.rowcount
            if "is_enabled" in cols:
                cur.execute(f"UPDATE {table} SET is_enabled=1 WHERE is_enabled IS NULL OR is_enabled != 1")
                updated_enabled = cur.rowcount

        status_breakdown = []
        payload_status_breakdown = []
        if "status" in cols:
            status_breakdown = cur.execute(f"SELECT status, COUNT(*) FROM {table} GROUP BY status").fetchall()
        if "_status" in cols:
            payload_status_breakdown = cur.execute(f"SELECT _status, COUNT(*) FROM {table} GROUP BY _status").fetchall()

        summary[table] = {
            "total": total,
            "updated_status": updated_status,
            "updated_payload_status": updated_payload_status,
            "updated_is_enabled": updated_enabled,
            "status_breakdown": status_breakdown,
            "payload_status_breakdown": payload_status_breakdown,
        }

    if args.apply:
        con.commit()

    print(
        json.dumps(
            {
                "applied": bool(args.apply),
                "tables": summary,
            },
            indent=2,
        )
    )

    if not args.apply:
        print("\nDry run complete. Use --apply to write changes.")


if __name__ == "__main__":
    main()
