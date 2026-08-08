# Beatrox Rentals — Complete Audit

_Audit date: 2026-07-22 · Auditor: Kimi (read-only, non-destructive) · Repo: `~/beatrox-rentals/beatrox-rentals/app` (GitHub `lxrxvci/beatrox-rentals`, private) · Live: `https://app-ruby-pi-32.vercel.app` · Screenshots: `reports/rentals-audit-screenshots/`_

## Executive summary

The rentals app is **far more complete than expected**: a real Vite + React 19 SPA with Vercel serverless functions, Neon Postgres inventory/orders, transactional order creation, contract PDF generation with e-signature, a full admin dashboard (orders, reservations, calendar, return manager, alerts), and a nearly complete Stripe integration with deposit holds and refunds. Code quality on the frontend is decent (tsc clean, build passes, git hygiene excellent).

However, **the app is not actually open for business in production**, and there is a **live payment-bypass flag** and several security gaps that must be closed before real money and scarce inventory flow through it:

1. 🔴 **No Stripe keys in production** — payments cannot work; the webhook handler crashes on a null Stripe client.
2. 🔴 **`EXTENSION_PAYMENT_BYPASS` is SET in production** — combined with a code path that honors client-supplied `bypass: true`, rental extensions are free right now.
3. 🔴 **Auth weaknesses** — `JWT_SECRET` dev fallback, admin-by-email without verification, no rate limiting.
4. 🟠 **Double-booking race (TOCTOU)** — availability checked outside the transaction; concurrent checkouts can overbook items with quantity 1–2.
5. 🟠 **SEO/domain incoherence** — all static canonicals/OG/sitemap point to `beatrox.com`, which still serves the old Squarespace site; runtime canonicals point to the preview domain; every unknown URL returns 200 (soft-404).
6. 🟠 **No analytics on the rentals funnel** — zero visibility into views → cart → checkout → payment.

Deployment itself is healthy: production == `origin/main` (`d7d7572`), latest deployment succeeded, git is clean.

---

## Phase 1 — Codebase & architecture

**Premise correction**: not Next.js — **Vite 7 + React 19 SPA** (react-router 7, client-side rendering) + Vercel serverless functions in `api/` (Web Request/Response style).

### Stack
- Frontend: Vite 7.2, React 19.2, react-router 7.6, TS ~5.9 strict, Tailwind 3.4 + ~30 Radix/shadcn components, lucide, sonner, lenis + gsap. Single bundle: **807 KB (236 KB gzip), no code splitting** — the 999-line admin dashboard ships to every visitor.
- Backend: `api/` Vercel functions — `@vercel/postgres` (Neon), `@vercel/blob` (contracts), `stripe` 17, `bcryptjs` + `jsonwebtoken`, `pdf-lib`, Resend via raw fetch.
- Unused deps: `three`, `recharts`, `embla-carousel-react`, `vaul`, `input-otp`, `react-resizable-panels`, `next-themes`, `cmdk` (only referenced by unused shadcn blocks).

### App map
- Public: `/` (landing), `/category/:slug` (sound, dj, led-wall, lights-lasers), `/product/:slug` (date/time picker + availability), `/cart`, `/checkout`, `/contract/:orderId` (PDF + canvas signature), `/payment/:orderId` (Stripe Elements), `/confirmation/:orderId`, `/orders` + `/orders/:orderId` (self-service extension/cancel), `/auth`.
- Admin: `/admin` (999-line tabbed dashboard: orders, reservations w/ discount/comp, quotes, calendar, return manager, alerts).
- API: auth (login/register/me), inventory (+availability), cart (guest session or user), orders (transactional create, cancel w/ refund, extensions), contracts (generate/sign), payments (create-intent, confirm, webhook), contact/quote, admin/* (orders, deposit capture/refund, reservations, calendar, returns, alerts), `setup.ts` (one-time schema+seed, gated by `x-setup-secret`).

### Data layer
- Inventory: Postgres `inventory` table, seeded from `api/_lib/seed.sql` (50 products). Rich product copy (specs/FAQs) is **triple-duplicated at 97 KB each**: `src/data/productDetails.ts` (bundled), `src/data/productDetails.json` (**dead**), `api/_lib/productDetails.json` (fs-read at runtime — `includeFiles` only configured for `setup.ts`, likely fragile on Vercel).
- Orders/bookings: Postgres, transactional creation (`withTransaction`).
- Auth: custom JWT (localStorage, 7d) + bcrypt; admin via `users.is_admin` OR `ADMIN_EMAILS` env match. Guests: client-generated `x-session-id`. **No email verification, no password policy, no rate limiting, no token invalidation.**
- Email: Resend via fetch — fully wired, 10 templates; no-ops when `RESEND_API_KEY` unset (it is unset in prod — see Phase 2).
- Payments: Stripe — rental PaymentIntent + manual-capture deposit hold, refunds, webhook. Bypass flags exist for dev.

### Code health
- `tsc --noEmit`: **0 errors** — but `api/` is **excluded from type-checking**; ad-hoc check shows 2 real errors (`api/payments/webhook.ts:18` null-stripe crash, `api/_lib/availability.ts:107`).
- Lint: 4 errors (unused vars, prefer-const), 5 react-hooks/exhaustive-deps warnings.
- Build: passes (2.2s). No TODO/FIXME. No hardcoded secrets. `.gitignore` solid; no `.env*` tracked.
- Dead code: `src/data/productDetails.json`, `api/admin/bookings.ts`, `api/admin/migrate-portal.ts` (migration leftovers), 8+ unused `ui/` components. Two `time.ts` copies already drifting.
- Git: clean, `main` == origin, single branch, no binaries committed beyond product JPEGs (~280 KB max).

### Security findings (code)

| # | Severity | Finding |
|---|---|---|
| 1.1 | 🔴 critical | `api/_lib/auth.ts:5` — `JWT_SECRET \|\| 'dev-secret-change-me'`: if env is unset, anyone can forge admin JWTs. Hard-fail at boot instead. |
| 1.2 | 🔴 critical | Admin status via `ADMIN_EMAILS` email match with **no email verification** — registering with a listed admin email grants instant admin. |
| 1.3 | 🔴 critical | `api/payments/confirm.ts` — honors client `bypass: true` when bypass envs are set; also verifies only `intent.status === 'succeeded'` without checking `metadata.orderId` or `amount` — replay/cross-order payment reuse possible. |
| 1.4 | 🟠 high | TOCTOU double-booking (`api/orders/index.ts:54-64`): availability checked before the transaction; no exclusion constraint/lock. Concurrent checkouts overbook quantity-1 items. |
| 1.5 | 🟠 high | `api/` outside type-checking — real null-stripe crash in `webhook.ts:18` ships unchecked. |
| 1.6 | 🟠 high | Guest order access keyed on unrotated client-set `x-session-id` — PII + order control hinge on a localStorage string. |
| 1.7 | 🟡 medium | No late-return cron — alerts only fire when a return is recorded; nothing proactively flags overdue gear. |
| 1.8 | 🟡 medium | `AdminPage.tsx` 999-line god component; `OrderDetailPage.tsx` 563 ln; `ProductPage.tsx` 541 ln. No tests anywhere. |
| 1.9 | 🔵 polish | JWT in localStorage (XSS-exfiltratable, no CSP); CORS `*` on all `/api/*`; guest `cart_items` never purged; package name "my-app". |

---

## Phase 2 — GitHub & Vercel deployment

- GitHub: private repo, `main` default; local == origin (`d7d7572`, 2026-07-15). Latest 3 production deployments all succeeded; **production == origin/main**.
- Vercel project `app` — framework `vite`, SPA rewrites, `.vercel` linked locally.
- **Production env vars (names only)**: 19 Neon/Postgres vars + `SETUP_SECRET`, `JWT_SECRET`, `EXTENSION_PAYMENT_BYPASS`.

| # | Severity | Finding |
|---|---|---|
| 2.1 | 🔴 critical | **`EXTENSION_PAYMENT_BYPASS` is set in Production** (7d ago) — activates the free-extension bypass from 1.3. Remove it or gate the code path off in production. |
| 2.2 | 🔴 critical | **No `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / publishable key** — payments are dead in prod; `webhook.ts` would crash if called. |
| 2.3 | 🟠 high | **No `RESEND_API_KEY`** — all transactional emails (order confirmations, contracts, quotes) silently log instead of sending. |
| 2.4 | 🟡 medium | **No `ADMIN_EMAILS`** — admin access only via DB `is_admin` flag (fine, but confirms no email-based admin path is active). |
| 2.5 | 🟡 medium | App lives on a random-name Vercel URL; no custom domain configured. |

---

## Phase 3 — Functional audit (live)

All non-destructive. Page matrix: every route 200 (SPA shell); `/api/inventory` clean (50 items); availability endpoint validates input properly (400 with message, no stack trace); `/api/me` 401; `/api/admin/orders` 403. **No raw errors anywhere.**

- Inventory: 50 products — sound 12, dj 12, led-wall 12, lights-lasers 14; day rates $25–$3,500 (median $75–$150). All 50 product image URLs verified **200 image/jpeg — zero broken images**.
- Booking flow: pickup/return 24h calc, availability checks, order creation, contract, payment — all present in code and reachable; no test orders placed (per scope).

| # | Severity | Finding |
|---|---|---|
| 3.1 | 🟠 high | **Soft-404**: `/nonexistent-page` returns 200 — every unknown URL is a soft-404 (SEO + analytics noise). |
| 3.2 | 🟡 medium | `led-corner-section.jpg` and `led-ground-support.jpg` are byte-identical size — same photo for two products. |
| 3.3 | 🔵 polish | `/confirmation/test-id` handled gracefully (no raw error). |

---

## Phase 4 — Front-end / visual aesthetic audit

Screenshots: `reports/rentals-audit-screenshots/` (desktop 1440 + mobile 390 for home, category, product, cart, checkout, auth + main-site comparison).

**Overall**: visually coherent with the Beatrox brand — dark + lime, Inter/Space Grotesk, triangle mark in footer. Category cards and product pages are strong; mobile is clean (hamburger nav, single-column grids, large tap targets, no overflow).

| # | Severity | Finding |
|---|---|---|
| 4.1 | 🟠 high | Below-fold home content uses scroll-reveal — without an IntersectionObserver (some bots, print, old browsers) the page below the hero is **~3,500px of solid black**. Verified sections render after scripted scroll. |
| 4.2 | 🟡 medium | **Footer template remnants**: Privacy Policy / Terms of Service / Sitemap all link to `#`; About Us/Locations/Careers/Blog/Partners point to nonexistent `/#…` anchors; "Packages" and "Wireless & Mics" both link to `/category/sound`; Facebook/Twitter icons go to generic facebook.com/twitter.com homepages. |
| 4.3 | 🟡 medium | Category-card date dropdowns and filter selects have **no accessible labels**; heading order skips H1→H3. |
| 4.4 | 🟡 medium | No "back to main site" link in header/footer — only an inline body link to the **preview domain** (`beatrox-website.vercel.app`). |
| 4.5 | 🔵 polish | Hero is a generic stock/AI warehouse photo; CTA says "EXPLORE OUR SERVICES" (main-site language — should be rental language); header logo is plain text vs main site's triangle+wordmark; small floating product thumbnails on category cards; mobile breadcrumb wraps awkwardly; empty `/checkout` is visually thin. |

---

## Phase 5 — Integration & SEO

| # | Severity | Finding |
|---|---|---|
| 5.1 | 🟠 high | **Domain incoherence**: static shell canonical, `og:url`, `og:image`, robots.txt sitemap URL, and all sitemap `<loc>`s point to `https://beatrox.com/` — which **301s to the live Squarespace site**. Runtime `SEO.tsx` rewrites canonical to the `app-ruby-pi-32.vercel.app` preview domain. Canonical disagrees between raw HTML and post-JS DOM. |
| 5.2 | 🟠 high | **Pure CSR** — every route serves the identical 4 KB shell; product/category content, Product/FAQ JSON-LD exist only for JS-executing crawlers. Sitemap has only 5 URLs (home + 4 categories), no products, wrong domain. |
| 5.3 | 🟠 high | **No analytics** — no GA/gtag, no Vercel Analytics, nothing. The entire rentals funnel is unmeasured. (Main site has GA+Vercel wired; rentals reports into nothing.) |
| 5.4 | 🟡 medium | Main site `/rentals` redirect is **307 Temporary** — passes no link equity; should be 301/308 if permanent. |
| 5.5 | 🟡 medium | Back-link from rentals to main site: one inline body link to the preview domain; nothing in nav/footer. |
| 5.6 | 🔵 polish | Main site shell also lacks gtag in raw HTML (CSP whitelists GTM; runtime injection unconfirmed). |

---

## Prioritized fix roadmap

### Do first (business-critical, small effort)
1. **Remove `EXTENSION_PAYMENT_BYPASS` from production env** (or hard-disable bypass code paths in prod builds).
2. Decide payments go-live: add `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + publishable key, fix `webhook.ts` null guard, and fix `confirm.ts` (verify `metadata.orderId` + `amount`, delete bypass honoring).
3. Add `RESEND_API_KEY` so transactional email actually sends.
4. Fix auth hardening: remove `JWT_SECRET` fallback (fail fast), require email verification before `ADMIN_EMAILS` grants admin, add rate limiting on auth endpoints.

### Next (integrity + measurement)
5. Fix the double-booking race: move availability check inside the transaction + add a Postgres exclusion constraint on `bookings (item_id, date_range)`.
6. Add analytics (GA4 with the same property as the main site, or Vercel Analytics) + wire funnel events.
7. Fix soft-404 (SPA fallback that returns real 404 status via a catch-all serverless route or Vercel `cleanUrls`/404 config).
8. Add `api/` to type-checking (`tsconfig.api.json` in build); fix the 2 known errors; remove dead endpoints/data files.

### Then (SEO + polish)
9. Resolve the domain strategy (this is the same beatrox.com cutover conversation as the main site): until then, make static canonical/OG/robots/sitemap point to the live app URL, expand sitemap to products, and align runtime vs static canonicals.
10. Footer cleanup (dead `#` links, mis-targeted category links, real social URLs), accessible labels on selects, back-to-main-site nav link, 301/308 for `/rentals`.
11. Code-split the admin bundle out of the public chunk; late-return cron job; replace hero stock photo with real inventory/event imagery.
