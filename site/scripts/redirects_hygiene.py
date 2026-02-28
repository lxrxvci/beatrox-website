#!/usr/bin/env python3
import argparse
import json
import sqlite3
from pathlib import Path


def normalize_path(value: str) -> str:
    v = (value or "").strip()
    if not v:
        return "/"
    if v.startswith("http://") or v.startswith("https://"):
        return v
    return v if v.startswith("/") else f"/{v}"


def trace_destination(start_from: str, by_from: dict[str, tuple[int, str]]) -> tuple[str, list[str], bool]:
    cursor = start_from
    seen = {start_from}
    path = [start_from]
    while True:
        row = by_from.get(cursor)
        if not row:
            return cursor, path, False
        next_to = normalize_path(row[1])
        path.append(next_to)
        if next_to in seen:
            return next_to, path, True
        seen.add(next_to)
        cursor = next_to


def load_rows(cur: sqlite3.Cursor):
    rows = cur.execute(
        """
        SELECT id, "from", "to", status_code, is_enabled
        FROM redirects
        ORDER BY "from" ASC
        """
    ).fetchall()
    return [
        {
            "id": row[0],
            "from": normalize_path(row[1] or ""),
            "to": normalize_path(row[2] or ""),
            "status_code": row[3] or "301",
            "is_enabled": bool(row[4]) if row[4] is not None else True,
        }
        for row in rows
    ]


def analyze(rows):
    enabled = [r for r in rows if r["is_enabled"]]
    by_from = {r["from"]: (r["id"], r["to"]) for r in enabled}
    issues = []
    for row in enabled:
        frm = row["from"]
        to = row["to"]
        if frm == to:
            issues.append(
                {
                    "kind": "self_redirect",
                    "id": row["id"],
                    "from": frm,
                    "to": to,
                    "resolution": "delete",
                }
            )
            continue

        terminal, path, has_loop = trace_destination(frm, by_from)
        if has_loop:
            issues.append(
                {
                    "kind": "loop_risk",
                    "id": row["id"],
                    "from": frm,
                    "to": to,
                    "path": path,
                    "resolution": "manual_review",
                }
            )
            continue

        if terminal != to:
            issues.append(
                {
                    "kind": "chain_flatten",
                    "id": row["id"],
                    "from": frm,
                    "to": to,
                    "suggested_to": terminal,
                    "path": path,
                    "resolution": "update",
                }
            )
    return issues


def apply_fixes(cur: sqlite3.Cursor, issues):
    deleted = 0
    updated = 0
    for issue in issues:
        if issue["kind"] == "self_redirect":
            cur.execute("DELETE FROM redirects WHERE id = ?", (issue["id"],))
            deleted += 1
        elif issue["kind"] == "chain_flatten":
            cur.execute("UPDATE redirects SET \"to\" = ? WHERE id = ?", (issue["suggested_to"], issue["id"]))
            updated += 1
    return deleted, updated


def main():
    parser = argparse.ArgumentParser(description="Redirect hygiene check/fix for Payload redirects table")
    parser.add_argument("--db", default=".cms-data/payload.db", help="Path to Payload SQLite db")
    parser.add_argument("--apply", action="store_true", help="Apply safe fixes (self and chain flatten)")
    args = parser.parse_args()

    db_path = Path(args.db).resolve()
    if not db_path.exists():
        raise FileNotFoundError(f"DB not found: {db_path}")

    con = sqlite3.connect(str(db_path))
    cur = con.cursor()
    rows = load_rows(cur)
    issues = analyze(rows)

    deleted = 0
    updated = 0
    if args.apply:
        deleted, updated = apply_fixes(cur, issues)
        con.commit()

    summary = {
        "scanned": len(rows),
        "applied": bool(args.apply),
        "deleted": deleted,
        "updated": updated,
        "self_redirects": len([i for i in issues if i["kind"] == "self_redirect"]),
        "chain_flatten_candidates": len([i for i in issues if i["kind"] == "chain_flatten"]),
        "loop_risks": len([i for i in issues if i["kind"] == "loop_risk"]),
    }
    print(json.dumps(summary, indent=2))
    if issues:
        print("\nIssues:")
        for issue in issues:
            line = f"- [{issue['kind']}] {issue['from']} -> {issue['to']}"
            if issue.get("suggested_to"):
                line += f" => {issue['suggested_to']}"
            if issue.get("path"):
                line += f" ({' -> '.join(issue['path'])})"
            print(line)

    if not args.apply:
        print("\nDry run complete. Use --apply to write safe fixes.")


if __name__ == "__main__":
    main()
