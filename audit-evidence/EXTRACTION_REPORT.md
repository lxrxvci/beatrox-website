# Beatrox Local SEO — Evidence Extraction Report
Crawled 2026-08-07 against https://beatrox-website.vercel.app. Raw artifacts in this directory.

## Crawl integrity
All main pages REAL CONTENT (200, full SSR HTML, no challenge walls). /rentals is a permanent 308 redirect off-site to https://app-ruby-pi-32.vercel.app/ (separate rental app). No WALL pages encountered.

## Per-page signals
| page | status | words | H1 | canonical | JSON-LD |
|---|---|---|---|---|---|
| / | 200 | ~338 | "Beatrox Experiential and Event Production" | https://www.beatrox.com | Organization, LocalBusiness |
| /services | 200 | ~834 | "What We Do" | .../services | Org, LocalBusiness, ItemList |
| /contact | 200 | ~269 | "Contact Us" | .../contact | Org, LocalBusiness |
| /about | 200 | ~633 | "The Team Behind the Tech" | .../about | Org, LocalBusiness |
| /work | 200 | ~563 | "Our Work" | .../work | Org, LocalBusiness |
| /book | 200 | ~183 | "Book a Consultation" | MISSING | Org, LocalBusiness |
| /team | 200 | ~462 | "Our Team" | .../team | Org, LocalBusiness |
| 4 service pages | 200 | 859–1161 | 1 each | present | Org, LocalBusiness, Service, BreadcrumbList, FAQPage |
| /rentals | 308→200 external | shell only | none | self (app-ruby-pi-32) | 1 block |

Titles use em dashes; "Services — BEATROX | BEATROX" has duplicated brand suffix.

## Key findings
- Canonical/sitemap/robots all point to https://www.beatrox.com while crawled on vercel.app staging host.
- LocalBusiness JSON-LD: injected in site/app/(site)/layout.tsx:97-98 via site/lib/schema.ts (buildLocalBusinessSchema). No openingHours, no geo, no aggregateRating. telephone "+15035154715".
- schema/schema-beatrox-locbiz.jsonld is ORPHANED — zero references in codebase.
- /book missing canonical (book/page.tsx generateMetadata has no canonicalPath).
- GA4 env-gated (layout.tsx:123 NEXT_PUBLIC_GA_MEASUREMENT_ID); NOT present in live HTML → env unset on deployment. Vercel Analytics is present.
- No Google Map embed on /contact; no business hours anywhere; no openingHours.
- /rentals redirect defined in site/next.config (redirects(), permanent) — in-repo rentals page.tsx is dead code on live.
- Footer NAP: "1313 SE 3rd Ave Portland , OR 97214", hello@beatrox.com, "(503) 515-4715" (source: site/content/contact.json:19-29).
- /services links only 15 service pages (not 45+); sitemap has 79 URLs, 15 /services/, 31 /tech/.
- content_lint exit 1 (1205 violations — mostly false positives: Tailwind "--" classes, code comments); nap_parity exit 1 (mostly false positives from digit strings in shader code/reports; real issues: name case "BEATROX" vs "Beatrox", phone format "+15035154715" vs "(503) 515-4715").
