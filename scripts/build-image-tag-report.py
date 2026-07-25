#!/usr/bin/env python3
"""Build an HTML review report for proposed per-image service/tech tags.

Reads reports/image-tags/manifest.json + per-project proposal JSONs and emits
reports/image-tags/report.html: per project, each contact sheet followed by a
tag table for the indices on that sheet (confidence color-coded), plus a
summary header. Review BEFORE running apply-image-tags.mjs --apply.

Usage: .venv/bin/python scripts/build-image-tag-report.py
"""
import html
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "reports" / "image-tags"
OUT = BASE / "report.html"

manifest = json.loads((BASE / "manifest.json").read_text())


def esc(s: str) -> str:
    return html.escape(str(s), quote=True)


parts = [
    """<!doctype html><html><head><meta charset="utf-8"><title>Image tag proposals</title>
<style>
body{background:#0a0a0a;color:#eee;font:14px/1.5 -apple-system,system-ui,sans-serif;margin:0;padding:24px}
h1{font-size:22px} h2{margin:40px 0 8px;font-size:18px;color:#c8ff00;border-top:1px solid #333;padding-top:24px}
h3{margin:16px 0 4px;font-size:13px;color:#999}
img.sheet{max-width:100%;border:1px solid #333;display:block}
table{border-collapse:collapse;width:100%;margin:8px 0 24px}
td,th{border:1px solid #333;padding:4px 8px;text-align:left;font-size:12px;vertical-align:top}
th{color:#999;text-transform:uppercase;letter-spacing:.08em}
.s{color:#7fd4ff} .t{color:#ffb86b} .hi{color:#8f8} .med{color:#fc6}
.summary td{font-size:13px}
code{background:#1a1a1a;padding:1px 4px;border-radius:2px}
</style></head><body><h1>Per-image tag proposals — review before apply</h1>"""
]

# Summary
svc_counts: Counter[str] = Counter()
tech_counts: Counter[str] = Counter()
total = tagged = 0
proposals: dict[str, list[dict]] = {}
for slug in manifest:
    rows = json.loads((BASE / f"{slug}.json").read_text())
    proposals[slug] = rows
    for r in rows:
        total += 1
        if r.get("serviceSlugs") or r.get("techSlugs"):
            tagged += 1
        svc_counts.update(r.get("serviceSlugs", []))
        tech_counts.update(r.get("techSlugs", []))

parts.append(f"<p><b>{total}</b> images, <b>{tagged}</b> tagged, {total-tagged} untagged.</p>")
parts.append('<table class="summary"><tr><th>Service slug</th><th>Images</th><th>Tech slug</th><th>Images</th></tr>')
svc_rows = svc_counts.most_common()
tech_rows = tech_counts.most_common()
for i in range(max(len(svc_rows), len(tech_rows))):
    a = f"<td class='s'>{esc(svc_rows[i][0])}</td><td>{svc_rows[i][1]}</td>" if i < len(svc_rows) else "<td></td><td></td>"
    b = f"<td class='t'>{esc(tech_rows[i][0])}</td><td>{tech_rows[i][1]}</td>" if i < len(tech_rows) else "<td></td><td></td>"
    parts.append(f"<tr>{a}{b}</tr>")
parts.append("</table>")

PER_SHEET = 9
for slug in manifest:
    rows = proposals[slug]
    n_tagged = sum(1 for r in rows if r.get("serviceSlugs") or r.get("techSlugs"))
    parts.append(f"<h2>{esc(slug)} — {n_tagged}/{len(rows)} tagged</h2>")
    n_sheets = (len(rows) + PER_SHEET - 1) // PER_SHEET
    for s in range(n_sheets):
        parts.append(f'<img class="sheet" src="sheets/{esc(slug)}-{s}.jpg">')
        parts.append("<table><tr><th>Index</th><th>File</th><th>Services</th><th>Tech</th><th>Conf</th><th>Note</th></tr>")
        for r in rows[s * PER_SHEET : (s + 1) * PER_SHEET]:
            conf = r.get("confidence", "")
            conf_cls = "hi" if conf == "high" else "med"
            svc = " ".join(f"<code class='s'>{esc(x)}</code>" for x in r.get("serviceSlugs", [])) or "—"
            tech = " ".join(f"<code class='t'>{esc(x)}</code>" for x in r.get("techSlugs", [])) or "—"
            parts.append(
                f"<tr><td>{r['index']}</td><td>{esc(Path(r['url']).name)}</td>"
                f"<td>{svc}</td><td>{tech}</td><td class='{conf_cls}'>{esc(conf)}</td>"
                f"<td>{esc(r.get('note',''))}</td></tr>"
            )
        parts.append("</table>")

parts.append("</body></html>")
OUT.write_text("\n".join(parts))
print(f"wrote {OUT}")
