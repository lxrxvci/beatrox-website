# Plan: Scrape All Images from www.beatrox.com

## Objective
Download every image from every page of www.beatrox.com for website transfer.

## Stage 1 — Website Discovery
- Crawl the homepage to discover all internal pages and navigation links
- Build a complete list of all unique pages on the site

## Stage 2 — Image URL Extraction
- Visit each discovered page
- Extract all image URLs (src attributes) from each page
- Deduplicate and compile a master list of all unique image URLs

## Stage 3 — Batch Download
- Download all unique images to a local directory
- Organize images with descriptive filenames based on source page

## Stage 4 — Verification
- Verify all images were downloaded successfully
- Report any missing/failed downloads
