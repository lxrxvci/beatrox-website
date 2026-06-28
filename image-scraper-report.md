# Image Scraping Report — Beatrox Website

## Date
2026-06-28

## Mission Summary
Retrieve missing verified/portfolio images from the original www.Beatrox.com website for 7 work case studies that currently only have "deck" images.

## Slugs Investigated
1. `disenchantment`
2. `cnn-road-to-270`
3. `the-great-escape`
4. `el-camino`
5. `g-man-experiential-campaign`
6. `dubai-360-spherical-projection-theatre`
7. `projecting-change-racing-extinction`

---

## Findings

### 1. Live Website Pages — ALL RETURN 404
All 7 work page URLs return 404 on both `www.beatrox.com` and `beatrox.com`:

- `https://www.beatrox.com/work/disenchantment` → 404
- `https://www.beatrox.com/work/cnn-road-to-270` → 404
- `https://www.beatrox.com/work/the-great-escape` → 404
- `https://www.beatrox.com/work/el-camino` → 404
- `https://www.beatrox.com/work/g-man-experiential-campaign` → 404
- `https://www.beatrox.com/work/dubai-360-spherical-projection-theatre` → 404
- `https://www.beatrox.com/work/projecting-change-racing-extinction` → 404

Variations tried (with/without `www`, with/without trailing slash) also returned 404.

### 2. Current Site Portfolio — Old Projects Removed
The current live Beatrox site (`beatrox.com`) is a Squarespace 7.1 site (site ID: `63d86c8ff442c358474548c3`). Its work page only lists 10 current projects:

- INFINITE PLAYLIST: FESTIVAL ACTIVATION
- MYSHELTER: IMMERISVE ENVIRONMENT
- PROJEKT X: SPECIALIZED PRODUCTION
- AKU WORLD: EXPERIENTAL EVENT
- RTFO2019: IMMERSIVE MEDIA EXPERIENCE
- SUPER BOWL 2020: PROJECTION & INTERACTIVE
- CREATE OUR FUTURE: EXPERIENTAL EVENT
- DESTINATION: EXPERIENTAL EVENT
- BUZZFEED: EVENT PRODUCTION
- FLIR: INTERACTIVE MEDIA DISPLAY

**None of the 7 target projects appear anywhere on the current site.**

### 3. Internet Archive (Wayback Machine) — No Snapshots
Checked via the Wayback Machine CDX API for all 7 slugs:

- All returned **empty arrays** — zero archived snapshots exist for any of the 7 work pages.
- Archived snapshots of the Beatrox **homepage** exist from 2010–2015, but these show "Beatrox Records" (an EDM record label), not the experiential design company. The domain was repurposed at some point after 2015.
- No archived snapshots of the experiential design portfolio era were captured.

### 4. Web Search — No Beatrox Portfolio Images Found
Extensive web searches conducted for all 7 projects. Found:
- General press photos from the events (e.g., Disenchantment Comic-Con 2018, CNN Road to 270 Empire State Building projection, El Camino premiere, Dubai 360 Sphere, Projecting Change Empire State Building)
- **No Beatrox-specific portfolio or case study images** were found on any public website, social media, or image CDN.

### 5. Squarespace CDN — No Old Images
The current site uses `images.squarespace-cdn.com` with UUID-based filenames. Searched for old project names on this CDN — no matches found. The old projects predate the current Squarespace 7.1 site.

### 6. Deck Image Quality Analysis
Inspected all existing deck images in `public/images/deck/{slug}/`:

| Slug | Total Images | Quality Notes |
|------|-------------|---------------|
| `disenchantment` | 12 | Mostly high-res (2048×1366), but 12-image99.jpg is 480×360 (15KB thumbnail) |
| `cnn-road-to-270` | 5 | Good quality (2500×1667) |
| `the-great-escape` | 16 | Mostly low-res (~1200×675), with 3 images at 480×360 (tiny thumbnails) |
| `el-camino` | 13 | Mixed quality; 3 images at 480×360 (tiny thumbnails) |
| `g-man-experiential-campaign` | 12 | Good PNGs (1600×898–1832×1031), but 1 image at 480×360 |
| `dubai-360-spherical-projection-theatre` | 54 | Mostly good (1920×1080, 2048×1536, 2500×1667), but 1 image at 320×180 (10KB). **Note: Images 30–41 are duplicates of g-man images.** |
| `projecting-change-racing-extinction` | 11 | Mostly good; 1 image at 320×180 (7.8KB thumbnail) |

### 7. Data Quality Issues in Deck Images
- **dubai-360** contains duplicate images from `g-man-experiential-campaign` (images 30–41 match g-man images 1–12 exactly, same file sizes and dimensions).
- Multiple tiny thumbnails (480×360 and 320×180) are present across several projects, suggesting the deck images were bulk-exported and include thumbnail variants.

---

## Conclusion

**No new verified images could be retrieved from the original www.Beatrox.com website.** The original work pages for all 7 case studies have been removed from the live site, and no archived snapshots exist on the Wayback Machine.

The **only available image source** is the existing `deck` images in `public/images/deck/{slug}/`.

### Recommendation

If you need these case studies to have images in the `verified` directory, the fallback options are:

1. **Copy the best-quality deck images** to `public/images/verified/work/{slug}/` and update the JSON to reference them.
2. **Clean up the deck images first** — remove the tiny thumbnail duplicates and the cross-project duplicates (dubai-360 images 30–41 that duplicate g-man).
3. **Source new images** from event photographers, press archives, or the client (Netflix, CNN, Adidas, Toyota, etc.) if rights can be obtained.

---

*Report generated by Image_Scraper for the Beatrox website project.*
