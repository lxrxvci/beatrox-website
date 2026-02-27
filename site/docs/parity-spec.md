# BEATROX Route Parity Specification

This document defines the target behavior for local parity against `https://www.beatrox.com`.

## Baseline Snapshot Matrix

- Breakpoints:
  - Desktop: 1440x900
  - Tablet: 1024x1366
  - Mobile: 390x844
- Routes:
  - `/`
  - `/work`
  - `/work/[slug]` for all 10 slugs
  - `/services`
  - `/services/[slug]` for all 8 slugs
  - `/about`
  - `/team`
  - `/contact`

## Global UX Parity Requirements

- Black-first visual system (`#000` background, white text, subtle transparent borders).
- Uppercase navigation labels with wide tracking and fixed top navigation.
- Smooth fade/translate entry animations for sections and cards.
- Rich hover overlays on work cards with image scale and metadata reveal.
- Motion reduction fallback for users with `prefers-reduced-motion: reduce`.

## Route-Level Requirements

## `/` Home

- Hero:
  - Full-bleed hero media (desktop video or fallback image).
  - Dark overlay gradient and left-aligned content lockup.
  - CTA pair visible over media with high contrast.
- Intro layout:
  - 3-column “Who / What / How” layout on desktop.
  - Single-column stack on mobile.
- Capability panel:
  - Dense 4-column capability grid desktop; compressed 2-column mobile.
- Featured work:
  - 2-column square cards desktop, 1-column mobile.
  - Hover image scale + gradient + metadata reveal.

## `/work`

- Intro block with matching typography hierarchy.
- Full catalog displayed with large visual-first cards.
- Image-first tiles with title and client context in overlay.
- CTA footer strip remains consistent with home.

## `/work/[slug]`

- Large hero image/media block with title/type overlaid.
- Left metadata column + right narrative content on desktop.
- Multi-image gallery with optional lightbox interaction.
- Embedded video shown when source is available.

## `/services` and `/services/[slug]`

- Overview page:
  - Four capability categories presented in uniform columns.
  - Service cards with subtle hover polish.
- Detail page:
  - Hero with category/title/subheadline.
  - Capability checklist + explanatory body blocks.
  - Related work links with clear affordance.

## `/about`, `/team`, `/contact`

- About:
  - Story/value sections with generous spacing and readable line length.
- Team:
  - Grid/list of bios with clear hierarchy and expertise tags.
- Contact:
  - Left informational rail + right form panel.
  - Focus and hover states consistent with site system.

## Visual Diff Pass/Fail Rules

- Pass if:
  - Layout composition, spacing rhythm, and hierarchy match target pattern.
  - Hero media fills viewport and maintains readable content overlay.
  - Card overlays, nav behavior, and transitions feel equivalent.
- Fail if:
  - Placeholder media is still visible where live has featured media.
  - Key sections are missing, collapsed, or not responsive.
  - Interaction timing is abrupt or inconsistent across pages.
