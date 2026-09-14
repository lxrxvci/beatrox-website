# Email draft — Matthew → Nathan (2026-09-14, v2)

**To:** nathanjenkins@beatrox.com
**Subject:** Twilio resubmission unblocked — privacy policy + terms are live (plus SEO & rentals shipped)

---

Hi Nathan,

Good news on the Twilio denial: the two things it was rejected for are now live. The Privacy Policy and Terms are published on both sites, so the campaign can be resubmitted today — details in section 3. Also shipped this week: the SEO cleanup and the rentals rebuild. Rundown below, then the short list we need from you.

## 1. SEO / indexing — main site is clean, fixes shipped

We audited beatrox.com against your whole checklist, live and in code:

- **Legacy Squarespace URLs**: all 26 real legacy slugs already 301 to the right destinations, and we added `/portfolio/*` coverage. Nothing obsolete in the sitemap.
- **Canonicals, titles, H1s, address**: already consistent sitewide. There are zero "Halsey" references anywhere in the shipped site — 1313 SE 3rd Ave is the only address in the code, schema, and footer. Any old-address sightings are in Google's cached snippets and off-site directories, which clear as Google recrawls and as we update citations.
- **Shipped this week**: legal pages (`/terms-and-conditions`, `/privacy`, `/sms-terms` — your Terms text verbatim), sitemap `lastmod` dates, crawler exclusions for admin/preview routes, richer structured data (WebSite, CreativeWork, VideoObject), and **real conversion tracking** — GA4 was recording pageviews only; it now tracks form submissions, phone clicks, and rental click-throughs.
- **Search Console**: most errors you're seeing are likely stale Squarespace-era reports or the rentals subdomain (below). To validate and close them out we need GSC access (see request list).

## 2. rentals.beatrox.com — the actual fire, now fixed

The rental site was serving an empty shell to Google for every URL — real pages and nonexistent ones alike. That's what was generating the soft-404 and not-indexed clusters. Fixed and deployed:

- **All 88 pages now serve full crawler-readable HTML** (titles, descriptions, specs, pricing schema, FAQs) without requiring JavaScript.
- Removed the live $1 "Test Item" from the sitemap (one admin action left for you, below).
- LocalBusiness schema fixed (phone, geo, correct price range).
- **New landing pages live**: Corporate AV Rental Portland and Wireless Microphone Rental Portland — full pages with real inventory, specs, dry-vs-operated options, delivery info, FAQs, and service area. The four existing categories (LED, sound, DJ, lighting) were expanded the same way, and the LED page now features the Artfox Pro Flex Outdoor P3.91 panels by name.
- **Keyword map**: we've mapped every keyword on your list (plus five high-value variants that weren't on it — "speaker rental Portland", "AV rental Portland", etc.) to exactly one page across the two sites so they complement instead of compete. Rentals owns "rental" terms; beatrox.com owns "production" terms — the LED and sound service pages on the main site were reframed accordingly, with deliberate hand-off links down to rentals. Full document ready for your review (ask and I'll send it).
- **Held pending your answer**: Stage Rental, Projector Rental, and Backline Rental pages. We don't publish thin pages for gear you don't stock — do you carry staging, projectors/screens, and backline for dry hire, or are those operated-only? Also need Artfox panel **quantity and day/week/month pricing** to make it a bookable product.

## 3. Twilio — your denial reasons are fixed; resubmission path

Since your account and brand are already set up and the campaign was denied **only** for the missing legal pages, this is now a resubmission, not a fresh registration. The pages the vetters asked for are live on both sites:

- **Privacy Policy**: https://www.beatrox.com/privacy (also on rentals.beatrox.com/privacy) — includes the carrier-required clause that mobile information is never shared with third parties for marketing
- **Terms & Conditions**: https://www.beatrox.com/terms-and-conditions
- **SMS Terms**: https://www.beatrox.com/sms-terms — all 8 required elements (program name, msg & data rates, frequency, bold STOP/HELP instructions, carrier non-liability, privacy link)

Note: the Privacy Policy and SMS Terms are our drafts written to carrier spec — please review the wording.

Resubmission guidance:

- When the campaign form asks for the website/legal URLs, use the three above.
- **Change nothing else** — you said the denial was only the legal pages, so keep the campaign description, opt-in flow, and sample messages exactly as submitted.
- **Forward us the denial notice** before resubmitting so we can confirm nothing else was flagged — each rejection resets the vetting clock, and carrier vetting is currently running 10–15 days.
- After approval, one step people miss: the number must be **attached to the Messaging Service's sender pool** (association can take up to 24h) before it can actually send.
- Oregon note: HB 3865 (2025) treats texts as telephone solicitation. Consented operational crew messaging is fine — keep marketing strictly off this number.

**Front side** (once the number is approved): the setup in your original email checks out against current Front docs — shared "Beatrox Production" inbox, Twilio channel via Account SID + Auth Token, and your tags/routing/templates plan. Two gotchas to know: the number must not be connected to any other app (one webhook per number), and the Messaging Service must be set to "Defer to Sender's Webhook" or inbound texts won't reach Front. Budget: ~$205–215/mo total (Front Professional, 3 seats + number + campaign + messages).

## What we need from you

**Twilio / Front**
1. Either add matthew@agenticpnw.com as an admin on the existing Twilio account and we'll handle the resubmission, or resubmit it yourself with the legal URLs above.
2. Forward the denial notice (so we confirm nothing else was flagged before the clock resets).
3. Front: workspace admin invite, billing, and the names/emails for the 3 seats. Area code preference — **971 recommended** (503 inventory is largely exhausted; same Portland geography).

**Legal / content review**
4. Review the Privacy Policy and SMS Terms drafts (links above — wording edits welcome, they exist to satisfy carrier vetting).
5. Sign off on the keyword map — especially the inventory question: do you stock **staging, projectors/screens, backline** for dry hire?
6. Artfox Pro Flex Outdoor P3.91: **quantity owned + day/week/month pricing** (we'll pull public specs).

**Quick admin action (2 minutes, rentals site)**
7. In the rentals admin (`/admin`): deactivate **"Test Item ($1)"** — it's out of Google's sitemap but still bookable until deactivated. (Everything else on the infrastructure side is handled — analytics, alert routing to admin@beatrox.com, and the old payment-bypass flag are done.)

**Access**
8. Google Search Console access for both properties so we can validate the indexing fixes and close out the error reports.

The carrier vetting window is the long pole for the SMS system — the sooner the resubmission goes in, the sooner production comms move off your phone.

Thanks,
Matthew
Agentic PNW
