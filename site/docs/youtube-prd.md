# BEATROX YouTube System PRD

## Overview

This PRD defines the YouTube subsystem for BEATROX.com: a local-first workflow that syncs channel videos from YouTube, lets editors curate SEO and metadata in one place, generates a stable site manifest, and optionally pushes selected metadata updates back to YouTube.

The system is designed for operational control, consistency, and safety:
- Local editing authority for SEO and on-site metadata
- Reliable sync from YouTube (source of truth for raw video data)
- Optional write-back to YouTube for title/description updates
- Guardrails to avoid accidental exposure or indexing of sensitive content

## Goals

- Sync all channel uploads and support filtering by:
  - Privacy status (`public`, `unlisted`, `private`)
  - Playlist ID(s)
- Store a reproducible raw snapshot from YouTube.
- Maintain editor-authored overrides for titles, descriptions, tags, slugs, and SEO fields.
- Generate a merged manifest consumed by the site and video routes.
- Support local push-back of selected title/description to YouTube API.
- Unify SEO workflows across content pages and video entries.

## Non-Goals

- Publicly exposed authenticated admin in production.
- Multi-user role management or approval workflows.
- Bulk updates to YouTube fields beyond snippet title/description.
- Replacing existing portfolio/service content architecture.

## Users

- Primary: Site owner/content operator (local editor).
- Secondary: Technical maintainer responsible for sync quality and SEO consistency.

## Success Criteria

- A full channel sync completes without manual JSON edits.
- Editors can update metadata for any synced video from one local UI.
- `content/youtube/manifest.json` is regenerated deterministically from raw + overrides.
- Selected video title/description can be pushed to YouTube with explicit user action.
- Video pages can be indexed or excluded via per-video `noindex`.

## Product Requirements

### 1) Data Sources and Persistence

- Raw source from YouTube Data API v3 (OAuth).
- Persistent files:
  - `content/youtube/raw-videos.json`: API snapshot, safe to regenerate.
  - `content/youtube/overrides.json`: editor-controlled overrides.
  - `content/youtube/manifest.json`: merged output used by UI/routes.

### 2) Local Admin Experience

Route: `/admin/youtube` (local-only behavior)

Capabilities:
- OAuth connect flow (consent + code exchange).
- Sync from YouTube (reads channel uploads and playlist memberships).
- Filter list by privacy and playlist.
- Edit override fields per video:
  - title
  - description
  - tags
  - site slug
  - `noindex`
  - SEO title/description/OG image
- Export manifest with current filters.
- Push title/description of selected video to YouTube.
- Show validation warnings for known limits.

### 3) Sync and Merge Behavior

On sync:
- Fetch channel metadata and uploads playlist.
- Fetch user playlists and map playlist membership per video.
- Fetch video details in batches.
- Persist raw snapshot.
- Build manifest by merging raw and overrides.

Merge precedence:
- Override fields win when present.
- Raw fields are fallback.
- Manifest includes source indicators where useful (raw vs override).

### 4) Video Rendering and SEO

Site routes:
- `/videos`: manifest-backed listing.
- `/videos/[videoId]`: detail page with embedded player and metadata.

SEO requirements:
- Metadata generated from merged manifest SEO fields.
- JSON-LD `VideoObject` on detail pages.
- Per-video `noindex` respected in page metadata and sitemap inclusion.

### 5) Sitemap Integration

- Include `/videos` in sitemap.
- Include `/videos/[videoId]` entries only when `noindex !== true`.

### 6) SEO Consistency Requirements

- Shared metadata conversion utility for content-driven pages.
- `/work` and `/services` index pages must consume SEO from content JSON (not hardcoded in route files).

## Functional Requirements

- OAuth token storage must support local filesystem paths via env vars:
  - `YOUTUBE_OAUTH_CLIENT_PATH`
  - `YOUTUBE_OAUTH_TOKEN_PATH`
- Sync should support CLI and admin UI paths.
- CLI sync must support:
  - `--status=public,unlisted,private`
  - `--playlist=<id1,id2,...>`
- Validation should detect:
  - YouTube title length > 100 chars
  - YouTube description length > 5000 chars
  - Missing SEO fields in content JSONs

## Security and Compliance

- Admin YouTube actions are local/development scoped.
- Secrets and tokens must not be committed.
- OAuth credentials stored in local secret paths (default under `site/.secrets`).
- Push-to-YouTube must be explicit user action (no implicit writes during sync).

## Reliability and Operational Requirements

- Build must pass with YouTube routes and admin code present.
- Missing or malformed JSON files must fail gracefully with safe defaults.
- Manifest generation must remain deterministic for a given raw + override input.
- Scripts should produce readable reports/logging for operators.

## Dependencies

- Next.js App Router
- `googleapis` Node client
- Existing content loader architecture in `site/lib/content.ts`

## Deliverables

- YouTube library modules (types, storage, merge, client, sync)
- Local admin route for operations and editing
- CLI sync and SEO audit scripts
- Video list/detail routes with structured data
- Sitemap integration and content-driven SEO consistency updates

## Open Questions (Future)

- Should admin evolve into authenticated production tooling?
- Should playlist entities get first-class pages and SEO?
- Should push-back support tags and more snippet fields with preflight diffs?
- Should we add a change log for override history and rollback?

## Acceptance Criteria

- Running sync populates `raw-videos.json` and updates `manifest.json`.
- Editor changes in admin write to `overrides.json` and appear on `/videos` pages.
- Push action updates selected YouTube video snippet title/description.
- Video detail pages emit valid metadata and JSON-LD.
- Sitemap includes only video pages not marked `noindex`.
- `npm run build` succeeds with all YouTube features enabled.
