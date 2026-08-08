#!/usr/bin/env python3
"""Extract per-page SEO signals from crawled HTML into extraction.md."""
import html.parser
import json
import os
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))


class PageParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self._in_title = False
        self.meta_desc = None
        self.canonical = None
        self.h1s = []
        self.h2s = []
        self._tag_stack = []
        self._capture = None  # 'h1' or 'h2'
        self._capture_buf = []
        self.text_words = 0
        self._skip_depth = 0  # inside script/style/noscript
        self.jsonld_raw = []
        self._in_jsonld = False
        self._jsonld_buf = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self._tag_stack.append(tag)
        if tag in ("script", "style", "noscript"):
            self._skip_depth += 1
            if tag == "script" and attrs.get("type") == "application/ld+json":
                self._in_jsonld = True
                self._jsonld_buf = []
        if tag == "title":
            self._in_title = True
        if tag == "meta" and attrs.get("name", "").lower() == "description":
            self.meta_desc = attrs.get("content", "")
        if tag == "link" and attrs.get("rel", "") == "canonical":
            self.canonical = attrs.get("href", "")
        if tag in ("h1", "h2") and self._capture is None:
            self._capture = tag
            self._capture_buf = []

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self._skip_depth > 0:
            self._skip_depth -= 1
        if tag == "script" and self._in_jsonld:
            self._in_jsonld = False
            self.jsonld_raw.append("".join(self._jsonld_buf))
        if tag == "title":
            self._in_title = False
        if self._capture == tag:
            text = re.sub(r"\s+", " ", "".join(self._capture_buf)).strip()
            if self._capture == "h1":
                self.h1s.append(text)
            else:
                self.h2s.append(text)
            self._capture = None
        if self._tag_stack and self._tag_stack[-1] == tag:
            self._tag_stack.pop()

    def handle_data(self, data):
        if self._in_jsonld:
            self._jsonld_buf.append(data)
            return
        if self._in_title:
            self.title += data
        if self._skip_depth == 0:
            self.text_words += len(data.split())
            if self._capture:
                self._capture_buf.append(data)


def jsonld_types(raw_blocks):
    types = []

    def walk(node):
        if isinstance(node, dict):
            t = node.get("@type")
            if t:
                if isinstance(t, list):
                    types.extend(str(x) for x in t)
                else:
                    types.append(str(t))
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for i in node:
                walk(i)

    for raw in raw_blocks:
        raw = raw.strip()
        if not raw:
            continue
        try:
            walk(json.loads(raw))
        except json.JSONDecodeError:
            types.append("UNPARSEABLE_JSONLD")
    return types


def main():
    rows = []
    with open(os.path.join(BASE, "crawl-status.tsv")) as f:
        for line in f:
            code, url, fname = line.rstrip("\n").split("\t")
            if fname == "robots.txt":
                continue
            rows.append((code, url, fname))

    out = []
    out.append("# Extraction — live crawl 2026-08-08\n")
    out.append("Source: audit-evidence/live-2026-08-08 (sitemap.xml crawl, 78 pages)\n")

    titles = {}
    red_flags_global = []

    for code, url, fname in rows:
        path = os.path.join(BASE, fname)
        p = PageParser()
        try:
            with open(path, encoding="utf-8", errors="replace") as f:
                p.feed(f.read())
        except FileNotFoundError:
            out.append(f"## {url}\n- **FETCH FAILED / file missing: {fname}**\n")
            red_flags_global.append(f"{url}: fetch failed")
            continue
        title = re.sub(r"\s+", " ", p.title).strip()
        flags = []
        if code != "200":
            flags.append(f"HTTP {code}")
        if not title:
            flags.append("MISSING TITLE")
        if not p.meta_desc:
            flags.append("missing meta description")
        if not p.h1s:
            flags.append("NO H1")
        elif len(p.h1s) > 1:
            flags.append(f"MULTIPLE H1 ({len(p.h1s)})")
        if not p.canonical:
            flags.append("no canonical")
        if title:
            titles.setdefault(title, []).append(url)
        types = jsonld_types(p.jsonld_raw)
        for fl in flags:
            red_flags_global.append(f"{url}: {fl}")

        out.append(f"## {url}")
        out.append(f"- Status: {code} | Words (visible, stripped): {p.text_words}")
        out.append(f"- Title: {title or '(none)'}")
        out.append(f"- Meta description: {p.meta_desc or '(none)'}")
        out.append(f"- H1: {p.h1s[0] if p.h1s else '(none)'}"
                   + (f" [+{len(p.h1s)-1} more]" if len(p.h1s) > 1 else ""))
        out.append(f"- H2 ({len(p.h2s)}): {' | '.join(p.h2s) if p.h2s else '(none)'}")
        out.append(f"- Canonical: {p.canonical or '(none)'}")
        out.append(f"- JSON-LD @types: {', '.join(types) if types else '(none)'}")
        if flags:
            out.append(f"- **RED FLAGS: {'; '.join(flags)}**")
        out.append("")

    out.append("## Duplicate titles\n")
    any_dup = False
    for t, urls in sorted(titles.items()):
        if len(urls) > 1:
            any_dup = True
            out.append(f"- `{t}` used by {len(urls)} pages:")
            for u in urls:
                out.append(f"  - {u}")
    if not any_dup:
        out.append("- None.")

    out.append("\n## Red-flag summary\n")
    if red_flags_global:
        for fl in red_flags_global:
            out.append(f"- {fl}")
    else:
        out.append("- None.")

    with open(os.path.join(BASE, "extraction.md"), "w") as f:
        f.write("\n".join(out) + "\n")
    print(f"pages processed: {len(rows)}; red flags: {len(red_flags_global)}")


if __name__ == "__main__":
    main()
