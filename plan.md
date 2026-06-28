# Beatrox Website Implementation Plan

## Project Overview
Next.js 16 + Payload CMS v3 website for Beatrox LLC. Currently using SQLite, needs migration to Postgres. Multiple content and structural improvements needed.

## Current State
- **Stack**: Next.js 16.2, Payload CMS 3.77, React 19, Tailwind CSS v4, TypeScript
- **DB**: SQLite (`@payloadcms/db-sqlite`)
- **Content**: JSON-driven (services, portfolio, homepage, about, team, contact)
- **Services**: 8 service pages exist at `/services/[slug]`
- **Portfolio**: 18 work/case-study pages at `/work/[slug]`
- **Site**: Static export build (`output: 'export'` inferred from .next/server)
- **Missing**: Rentals page, custom fabrication service page, some CTAs

## Work Items with Missing Images (no verified/portfolio images)
1. `disenchantment` — only deck images
2. `cnn-road-to-270` — only deck images
3. `the-great-escape` — only deck images
4. `el-camino` — only deck images
5. `g-man-experiential-campaign` — only deck images
6. `dubai-360-spherical-projection-theatre` — only deck images (many)
7. `projecting-change-racing-extinction` — only deck images

## Stage 1 — Infrastructure & Foundation (Parallel)

### Sub-Agent 1: Backend_Admin
**Mission**: Migrate Payload CMS from SQLite to PostgreSQL + Prisma
- Update `site/payload.config.ts` to use `@payloadcms/db-postgres` adapter
- Add `DATABASE_URI` env var handling for Postgres
- Ensure Prisma schema generation is configured
- Update any related scripts or configs
- **Deliverable**: Updated `payload.config.ts`

### Sub-Agent 2: CSS_Padding_Fixer
**Mission**: Fix CSS padding problems across all pages
- Audit `globals.css` for inconsistent padding values
- Fix page-specific padding issues in all `page.tsx` files
- Ensure consistent section spacing (`.section` utility is 5.5rem/7rem)
- Check for overlapping/missing padding on mobile
- Fix any hero section padding issues
- **Deliverable**: Updated `globals.css` and patched page files

### Sub-Agent 3: Image_Scraper
**Mission**: Retrieve missing images from www.beatrox.com
- For each imageless work slug, fetch the live page at `https://www.beatrox.com/work/{slug}`
- Extract image URLs from the HTML
- Download images to `site/public/images/verified/work/{slug}/`
- Update the corresponding JSON in `site/content/portfolio/{slug}.json` to add verified images to the `images` array
- **Deliverable**: New image files + updated portfolio JSON files

## Stage 2 — Content & Features (Parallel)

### Sub-Agent 4: Rentals_Developer
**Mission**: Create dedicated rentals page with equipment specifications
- Create `site/app/(site)/rentals/page.tsx`
- Create `site/content/rentals.json` with equipment data based on existing services (LED walls, sound, DJ, backline, lighting, laser, drone)
- Create a structured equipment catalog with categories, specs, and pricing tiers where applicable
- Add link to Nav and Footer
- Update `site/app/(site)/sitemap.ts` to include `/rentals`
- **Deliverable**: New rentals page, content JSON, updated Nav/Footer/sitemap

### Sub-Agent 5: CTA_Developer
**Mission**: Add call-to-action elements on every page
- Add prominent CTAs to: about, team, contact, videos, case-studies, work index, work detail pages
- Ensure every page has a clear "Book a Consultation" or "Get a Quote" CTA
- Use existing `btn-primary` / `btn-ghost` classes
- Add a reusable `CTASection` component if needed
- **Deliverable**: Updated page.tsx files + new component if needed

### Sub-Agent 6: Sitemap_SEO_Updater
**Mission**: Update site architecture for SEO
- Update `site/app/(site)/sitemap.ts` to include rentals page and any new routes
- Add proper `alternates` and `canonical` metadata where missing
- Add structured data (JSON-LD) for services and organization
- Ensure all pages have proper `generateMetadata` exports
- Add `robots.txt` enhancements if needed
- **Deliverable**: Updated `sitemap.ts`, metadata exports, JSON-LD component

### Sub-Agent 7: Service_Funnel_Enhancer
**Mission**: Convert service pages into sales funnels
- Enhance existing 8 service pages with more compelling sales copy
- Add social proof sections (client logos, testimonials)
- Add package/pricing tiers or "Request Custom Quote" flow
- Add FAQ sections per service
- Add trust badges (years of experience, notable clients)
- Ensure every service has a strong closing CTA
- **Deliverable**: Updated service JSON files with enhanced body content

## Stage 3 — Integration & Verification
- Merge all sub-agent outputs
- Verify build passes (`npm run build`)
- Verify all pages render correctly
- Ensure no broken image references
- Final QA

## File Propagation (A2A)
- Stage 1 outputs → Stage 2 inputs
- All JSON content updates → Stage 3 integration
- New components → Stage 3 integration
- Updated config → Stage 3 integration

## Success Criteria
- [ ] Backend uses PostgreSQL adapter
- [ ] Missing images populated for imageless work slugs
- [ ] Rentals page exists and is linked in navigation
- [ ] Every page has a clear CTA
- [ ] Sitemap includes all dynamic routes with proper SEO
- [ ] CSS padding is consistent across all pages
- [ ] Service pages have enhanced sales funnel content
- [ ] Build passes without errors
