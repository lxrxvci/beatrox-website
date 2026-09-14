# Email draft — Matthew → Nathan (2026-09-14)

**To:** nathanjenkins@beatrox.com
**Subject:** All three priorities shipped or in motion — legal pages live, rentals rebuilt for search, and the short list we need from you

---

Hi Nathan,

Quick rundown on the three priorities from your Sep 9 email. The short version: the main site was healthier than we thought, the rentals site had the real problem (now fixed), and the Front/Twilio path is validated and unblocked. Details below, then the list of what we need from you.

## 1. SEO / indexing — main site is clean, fixes shipped

We audited beatrox.com against your whole checklist, live and in code:

- **Legacy Squarespace URLs**: all 26 real legacy slugs already 301 to the right destinations, and we added `/portfolio/*` coverage. Nothing obsolete in the sitemap.
- **Canonicals, titles, H1s, address**: already consistent sitewide. There are zero "Halsey" references anywhere in the shipped site — 1313 SE 3rd Ave is the only address in the code, schema, and footer. Any old-address sightings are in Google's cached snippets and off-site directories, which clear as Google recrawls and as we update citations.
- **Shipped this week**: legal pages (`/terms`, `/privacy`, `/sms-terms` — your Terms text verbatim), sitemap `lastmod` dates, crawler exclusions for admin/preview routes, richer structured data (WebSite, CreativeWork, VideoObject), and **real conversion tracking** — GA4 was recording pageviews only; it now tracks form submissions, phone clicks, and rental click-throughs.
- **Search Console**: most errors you're seeing are likely stale Squarespace-era reports or the rentals subdomain (below). To validate and close them out we need GSC access (see request list).

## 2. rentals.beatrox.com — the actual fire, now fixed

The rental site was serving an empty shell to Google for every URL — real pages and nonexistent ones alike. That's what was generating the soft-404 and not-indexed clusters. Fixed and deployed:

- **All 88 pages now serve full crawler-readable HTML** (titles, descriptions, specs, pricing schema, FAQs) without requiring JavaScript.
- Removed the live $1 "Test Item" from the sitemap (one admin action left for you, below).
- LocalBusiness schema fixed (phone, geo, correct price range).
- **New landing pages live**: Corporate AV Rental Portland and Wireless Microphone Rental Portland — full pages with real inventory, specs, dry-vs-operated options, delivery info, FAQs, and service area. The four existing categories (LED, sound, DJ, lighting) were expanded the same way, and the LED page now features the Artfox Pro Flex Outdoor P3.91 panels by name.
- **Keyword map**: we've mapped every keyword on your list (plus five high-value variants that weren't on it — "speaker rental Portland", "AV rental Portland", etc.) to exactly one page across the two sites so they complement instead of compete. Rentals owns "rental" terms; beatrox.com owns "production" terms — the LED and sound service pages on the main site were reframed accordingly, with deliberate hand-off links down to rentals. Full document ready for your review (ask and I'll send it).
- **Held pending your answer**: Stage Rental, Projector Rental, and Backline Rental pages. We don't publish thin pages for gear you don't stock — do you carry staging, projectors/screens, and backline for dry hire, or are those operated-only? Also need Artfox panel **quantity and day/week/month pricing** to make it a bookable product.

## 3. Front + Twilio — validated, unblocked, ready to start

Your setup process checks out against current Twilio/Front docs, with a few corrections:

- Registration runs through Twilio's **Trust Hub**, and there's a fourth step people miss: the number must be attached to the Messaging Service's sender pool after campaign approval.
- We'll register as a **Low-Volume Standard Brand + Low-Volume Mixed campaign** (cheapest tier, fits operational messaging): ~$20 one-time + ~$1.50/mo.
- **Carrier vetting currently takes 10–15 days**, and rejections reset the clock — so we want the first submission clean.
- As of this summer, Twilio **requires live privacy-policy and SMS-terms pages before campaign approval** — that's now satisfied (both are live on beatrox.com and rentals.beatrox.com). Note: the Privacy Policy and SMS Terms are our drafts written to carrier spec — please review the wording.
- Realistic budget: **~$205–215/mo** total (Front Professional, 3 seats + Twilio number + campaign + messages) and ~$20 one-time. Timeline: 2–3 weeks end-to-end, mostly carrier waiting.
- One honest flag: if you only wanted shared SMS without email in the same inbox, Quo (formerly OpenPhone) does it for ~$45/mo. Front+Twilio is the right call if email consolidation matters — your call.
- Oregon note: HB 3865 (2025) treats texts as telephone solicitation. Consented operational crew messaging is fine — another reason to keep marketing strictly off this number.

## What we need from you

**Legal / content review**
1. Review the Privacy Policy and SMS Terms drafts (live at beatrox.com/privacy and /sms-terms — wording edits welcome, they exist to satisfy carrier vetting).
2. Sign off on the keyword map — especially the inventory question: do you stock **staging, projectors/screens, backline** for dry hire?
3. Artfox Pro Flex Outdoor P3.91: **quantity owned + day/week/month pricing** (we'll pull public specs).

**Twilio / Front**
4. Create the Twilio account under Beatrox LLC yourself (billing identity), add a card, upgrade from trial, then grant us admin access.
5. **EIN + legal business name exactly as filed with the IRS** (e.g. confirm it's "Beatrox LLC" with the suffix — a mismatch here is the #1 cause of registration rejection), entity type, and the physical address on file.
6. **Opt-in method decision**: recommend adding an SMS-consent checkbox/signature line to freelancer/vendor onboarding paperwork — one signed sample is what carriers want as opt-in proof. Also: how do you collect crew numbers today?
7. **2–5 sample texts in your voice** (availability ask, booking confirmation, call-time reminder, schedule change, logistics) — each including "Beatrox" and "Reply STOP to opt out", with placeholders instead of real names.
8. Monthly message volume estimate, and yes/no: will this number **ever** send marketing? (Recommend no.)
9. Front: workspace admin invite, billing, and the names/emails for the 3 seats. Area code preference — **971 recommended** (503 inventory is largely exhausted; same Portland geography).

**Quick admin actions (5 minutes, rentals site)**
10. In the rentals admin: deactivate **"Test Item ($1)"** — it's still bookable until you do (or we can run the migration if you give us DB access).
11. In Vercel for the rentals project: set `ADMIN_EMAILS` (order-approval and late-return alerts currently email nobody), set `VITE_GA_MEASUREMENT_ID` to the GA4 property ID, and delete the old `EXTENSION_PAYMENT_BYPASS` variable (the code no longer reads it).

**Access**
12. Google Search Console access for both properties so we can validate the indexing fixes and close out the error reports.

Once 4–9 land we'll kick off the 10DLC registration the same day — the carrier clock is the long pole, so the sooner that starts, the sooner production comms move off your phone.

Thanks,
Matthew
Agentic PNW
