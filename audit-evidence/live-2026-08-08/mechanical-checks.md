# Mechanical checks — interpreted verdicts (2026-08-08)

## content_lint.py (em-dash scan) — raw log: `content_lint.log`
- Raw result: **FAILED, 472 violations**.
- Classification:
  - **126 violations are in evidence artifacts** (`extraction.md`, `legacy-urls.txt`, `_extract.py` — my own crawl outputs quoting page titles; not site content).
  - **343 violations in crawled page HTML** (78 pages + rendered-homepage copy):
    - All 78 crawled pages contain at least one real em dash. Sitewide source: the `<title>` pattern "X — BEATROX ..." and meta descriptions "…Portland, OR — …" on all 41 service/tech pages.
    - **47 of 78 crawled pages have em dashes in body copy beyond line 1** (visible content, not just metadata).
    - "double hyphen as em dash" hits at line 1 are **false positives**: asset hashes (`2i--loj9o95vd`), React SSR comments (`<!--$-->`), CSS custom properties (`--brand-primary`), Tailwind arbitrary values, BEM modifiers (`layer--bottom`). Verified by inspecting match context in `index.html`.
- **Interpreted verdict: FAIL.** Em dashes are pervasive in rendered pages — titles sitewide, meta descriptions on all service/tech pages, and body copy on 47 pages. Remediation must happen in site content/metadata, then re-crawl.

## nap_parity.py — raw log: `nap_parity.log`
- Raw result: 238 FAIL lines / 85 OK lines.
- Interpretation (gate = NAME / ADDRESS / visible-phone exact match):
  - **ADDRESS: PASS.** `1313 SE 3rd Ave, Portland, OR 97214` exact string present in all 78 crawled pages (footer), and LocalBusiness JSON-LD on the homepage has matching PostalAddress components.
  - **Visible phone: PASS.** `(503) 515-4715` exact string present in all 78 crawled pages. PHONE FAIL lines are false positives: E.164 `+15035154715` (schema `telephone` + `tel:` links — same number, normalized digits match), geo coordinates (`45.5903988, -122.6629198` parsed as `590-3988912` / `122.6629198`), and RSC-payload digit runs (`3000000000`, `6000000000`, `6099286962`, `944-5854120`). No conflicting real phone number found anywhere.
  - **NAME: PASS with a schema-quality caveat.** Homepage + rendered homepage NAME OK ("Beatrox", LocalBusiness JSON-LD `name: "Beatrox"`). The 46 NAME FAIL lines are all service/tech pages where the script compared the `Service` schema's `name` (e.g. "Drone Light Shows") against the GBP name. Each of those Service blocks correctly references `provider: {"@type":"Organization","@id":"https://www.beatrox.com/#localbusiness","name":"Beatrox"}` — proper schema practice, not NAP drift. Minor caveat: only the homepage carries the full LocalBusiness block; service pages rely on the `@id` reference, which is valid but invisible to naive scrapers.
- **Interpreted verdict: PASS (NAP parity holds).** One improvement suggestion: consolidate E.164 vs display phone if the audit demands a single format; not a parity failure.

## GA4
- `G-CQMP5KHQ5S` present in all 78 crawled pages (0 missing). **PASS.**

## Host duplication
- `https://beatrox-website.vercel.app` → **HTTP 200, serves full duplicate content, no 301/308** to www.beatrox.com.
- Mitigation confirmed: every crawled page (and the vercel.app homepage itself) carries `<link rel="canonical" href="https://www.beatrox.com/...">`. Apex `beatrox.com` correctly 308s to `https://www.beatrox.com/`.
- **Verdict: duplicate host live, canonical-mitigated. Recommended fix: redirect the vercel.app host to www at the platform level.**
