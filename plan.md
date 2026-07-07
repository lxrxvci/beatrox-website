# Beatrox Website Remediation Plan

## Source Document

This remediation plan is driven by the findings in **`beatrox_expanded_audit.md`** (July 7, 2026 — Complete Front-End, Back-End & Architecture Audit). The audit assigns the site an overall grade of **C+ (Needs Immediate Attention)** and identifies critical failures in lead capture, staging/production divergence, security, performance, and architecture.

> **Reference:** See `beatrox_expanded_audit.md` for full audit details, schema designs, API architecture, security recommendations, SEO analysis, performance audit, accessibility audit, risk analysis, and the 16-week implementation roadmap.

---

## Project Overview

Beatrox LLC website — Next.js 16 + Payload CMS v3. The project has evolved from a static JSON-driven site to a CMS-first application, but the audit reveals that significant backend, conversion, and infrastructure work is still required to support revenue goals.

## Current State

- **Stack:** Next.js 16.2, Payload CMS 3.85, React 19, Tailwind CSS v4, TypeScript
- **DB:** PostgreSQL (`@payloadcms/db-postgres`) — adapter configured
- **CMS:** Payload collections for `projects`, `case-studies`, `pages`, `services`, `team`, `redirects`, `media`
- **Content:** JSON fallbacks still present for some domains; CMS is source of truth for projects
- **Services:** 8 service pages exist at `/services/[slug]`
- **Portfolio:** Work pages at `/work/[slug]` plus tag routes at `/work/tag/[tag]`
- **Rentals:** Page exists at `/rentals` with equipment catalog
- **Case Studies:** New `/case-studies` index + detail routes
- **Site:** Static export build (`output: 'export'` inferred from .next/server)
- **Preview:** Admin live/preview links enabled

## Critical Issues from Audit

1. **CRITICAL — Contact form is 100% non-functional** (`formspree.io/f/placeholder` returns "Form not found"). Zero lead capture.
2. **CRITICAL — Staging/production data divergence:** different addresses, missing contact info on staging, different navigation.
3. **HIGH — No analytics** (GA4, GTM, Meta Pixel, Vercel Analytics).
4. **HIGH — Missing security headers** (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy).
5. **HIGH — No functional backend/API layer** beyond Payload CMS internals.
6. **HIGH — Poor performance** (large unoptimized images, no lazy loading, estimated 3–5s LCP, 5–10MB pages).
7. **MEDIUM — Hardcoded/static content** limits CMS-driven dynamic experiences.
8. **MEDIUM — Accessibility gaps** (no skip links, reduced motion, focus indicators unchecked).

## Work Items with Missing Images (no verified/portfolio images)

1. `disenchantment` — only deck images
2. `cnn-road-to-270` — only deck images
3. `the-great-escape` — only deck images
4. `el-camino` — only deck images
5. `g-man-experiential-campaign` — only deck images
6. `dubai-360-spherical-projection-theatre` — only deck images (many)
7. `projecting-change-racing-extinction` — only deck images

---

## Stage 1 — Infrastructure & Foundation (Parallel)

### Sub-Agent 1: Backend_Admin
**Mission:** Migrate Payload CMS from SQLite to PostgreSQL + Prisma
- Update `site/payload.config.ts` to use `@payloadcms/db-postgres` adapter ✅
- Add `DATABASE_URI` env var handling for Postgres ✅
- Ensure Prisma schema generation is configured
- Update any related scripts or configs
- **Deliverable:** Updated `payload.config.ts`

### Sub-Agent 2: CSS_Padding_Fixer
**Mission:** Fix CSS padding problems across all pages
- Audit `globals.css` for inconsistent padding values
- Fix page-specific padding issues in all `page.tsx` files
- Ensure consistent section spacing (`.section` utility is 5.5rem/7rem)
- Check for overlapping/missing padding on mobile
- Fix any hero section padding issues
- **Deliverable:** Updated `globals.css` and patched page files

### Sub-Agent 3: Image_Scraper
**Mission:** Retrieve missing images from www.beatrox.com
- For each imageless work slug, fetch the live page at `https://www.beatrox.com/work/{slug}`
- Extract image URLs from the HTML
- Download images to `site/public/images/verified/work/{slug}/`
- Update the corresponding JSON in `site/content/portfolio/{slug}.json` to add verified images to the `images` array
- **Deliverable:** New image files + updated portfolio JSON files

### Sub-Agent 4: Critical_Fixes
**Mission:** Address immediate audit-critical items
- Replace broken Formspree contact form with a working endpoint or Payload form submission
- Reconcile staging vs production business info (address, email, phone, copyright)
- Add Vercel Analytics + GA4
- Add security headers via `vercel.json`
- **Deliverable:** Working contact form, consistent site data, analytics, security headers

---

## Stage 2 — Content & Features (Parallel)

### Sub-Agent 5: Rentals_Developer
**Mission:** Create dedicated rentals page with equipment specifications
- Create `site/app/(site)/rentals/page.tsx` ✅
- Create `site/content/rentals.json` with equipment data based on existing services (LED walls, sound, DJ, backline, lighting, laser, drone) ✅
- Create a structured equipment catalog with categories, specs, and pricing tiers where applicable
- Add link to Nav and Footer
- Update `site/app/(site)/sitemap.ts` to include `/rentals`
- **Deliverable:** New rentals page, content JSON, updated Nav/Footer/sitemap

### Sub-Agent 6: CTA_Developer
**Mission:** Add call-to-action elements on every page
- Add prominent CTAs to: about, team, contact, videos, case-studies, work index, work detail pages
- Ensure every page has a clear "Book a Consultation" or "Get a Quote" CTA
- Use existing `btn-primary` / `btn-ghost` classes
- Add a reusable `CTASection` component if needed
- **Deliverable:** Updated page.tsx files + new component if needed

### Sub-Agent 7: Sitemap_SEO_Updater
**Mission:** Update site architecture for SEO
- Update `site/app/(site)/sitemap.ts` to include rentals page and any new routes
- Add proper `alternates` and `canonical` metadata where missing
- Add structured data (JSON-LD) for services and organization
- Ensure all pages have proper `generateMetadata` exports
- Add `robots.txt` enhancements if needed
- **Deliverable:** Updated `sitemap.ts`, metadata exports, JSON-LD component

### Sub-Agent 8: Service_Funnel_Enhancer
**Mission:** Convert service pages into sales funnels
- Enhance existing 8 service pages with more compelling sales copy
- Add social proof sections (client logos, testimonials)
- Add package/pricing tiers or "Request Custom Quote" flow
- Add FAQ sections per service
- Add trust badges (years of experience, notable clients)
- Ensure every service has a strong closing CTA
- **Deliverable:** Updated service JSON files with enhanced body content

---

## Stage 3 — Backend Architecture Expansion (From Audit)

### Sub-Agent 9: API_Foundation
**Mission:** Build the backend API layer
- Set up Hono HTTP server with tRPC middleware
- Configure Prisma ORM and schema (`prisma/schema.prisma`)
- Create tRPC routers: `auth`, `project`, `service`, `rental`, `contact`, `consultation`, `quote`, `analytics`, `settings`, `admin`
- Add Zod validation and public/admin procedures
- **Deliverable:** Working tRPC API layer, Prisma schema, auth middleware

### Sub-Agent 10: Contact_CRM
**Mission:** Functional lead capture and CRM
- Build `contact.submit` tRPC mutation
- Store submissions in PostgreSQL `contacts` table
- Add admin list/query endpoint
- Send notification emails via Resend
- Add rate limiting and CAPTCHA
- **Deliverable:** Working contact form, CRM data model, admin lead view

### Sub-Agent 11: Scheduling_System
**Mission:** Integrated consultation booking
- Design scheduling data model (`consultation_types`, `consultation_slots`, `consultations`, `availability_rules`, `blackout_dates`)
- Integrate Cal.com or Google Calendar for availability
- Build booking UI and admin calendar view
- Implement confirmation/reminder notifications
- **Deliverable:** Self-service scheduling on `/book` or embedded in contact flow

---

## Stage 4 — Sales Funnels & Subdomains (From Audit)

### Sub-Agent 12: Sales_Funnel_Pilot
**Mission:** Implement first service sales funnel
- Pilot with one service (recommended: LED Video Wall Rentals)
- Build interactive service configurator UI
- Add pricing calculator / tiers
- Build quote request system
- Track funnel events in database
- **Deliverable:** First end-to-end sales funnel

### Sub-Agent 13: Subdomain_Strategy
**Mission:** Prepare subdomain architecture
- Evaluate monorepo vs single-app subdomain routing
- Configure DNS records for `services.beatrox.com`, `rentals.beatrox.com`, `book.beatrox.com`, `admin.beatrox.com`
- Set up Vercel project/domain config
- Ensure shared auth, components, and database across subdomains
- **Deliverable:** Subdomain routing plan + initial DNS/Vercel config

---

## Stage 5 — Performance, Accessibility & Polish (From Audit)

### Sub-Agent 14: Performance_Optimizer
**Mission:** Fix performance issues
- Convert/serve images as WebP/AVIF with `next/image` ✅ (`site/next.config.ts` already enables `image/avif` + `image/webp`)
- Implement responsive images and lazy loading ✅ (all `<Image>` components use `sizes`; non-priority images lazy-load by default)
- Remove unused uploaded image artifacts ✅ (deleted 1,534 unused files in `site/public/uploads/`, ~487 MB; moved Payload `staticDir` to `site/public/media`)
- Add blur placeholders for LCP images
- Optimize fonts and third-party scripts
- Configure edge caching and Cache-Control headers
- **Deliverable:** LCP < 2.5s, page weight < 3MB

### Sub-Agent 15: Accessibility_Auditor
**Mission:** Close accessibility gaps
- Add skip-to-content link
- Verify keyboard navigation and focus indicators
- Implement `prefers-reduced-motion`
- Add ARIA landmarks and live regions
- Verify color contrast ratios
- **Deliverable:** WCAG 2.1 AA compliance check passing

---

## Stage 6 — Integration & Verification

- Merge all sub-agent outputs
- Reconcile staging/production data
- Verify build passes (`npm run build`)
- Verify all pages render correctly
- Ensure no broken image references
- Run redirect hygiene (`npm run redirects:hygiene`)
- Run security header check
- Run performance audit
- Final QA

## File Propagation (A2A)

- Stage 1 outputs → Stage 2 inputs
- Stage 2 content updates → Stage 3 backend integration
- Stage 3 API/schema → Stage 4 funnels/scheduling
- New components → Stage 6 integration
- Updated config → Stage 6 integration

## Success Criteria

- [ ] Backend uses PostgreSQL adapter
- [ ] Missing images populated for imageless work slugs
- [ ] Rentals page exists and is linked in navigation
- [ ] Every page has a clear CTA
- [ ] Sitemap includes all dynamic routes with proper SEO
- [ ] CSS padding is consistent across pages
- [ ] Service pages have enhanced sales funnel content
- [ ] Contact form is functional and stores leads
- [ ] Staging/production business data is consistent
- [ ] Security headers are configured
- [ ] Analytics (Vercel + GA4) are collecting data
- [ ] tRPC + Prisma backend foundation is in place
- [ ] Scheduling system allows self-service booking
- [ ] First sales funnel is live
- [ ] Performance targets met (LCP < 2.5s, < 3MB page weight)
- [ ] Accessibility WCAG 2.1 AA compliance verified
- [ ] Build passes without errors
