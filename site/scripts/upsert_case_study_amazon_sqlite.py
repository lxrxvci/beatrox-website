#!/usr/bin/env python3
import json
import sqlite3
import uuid
from pathlib import Path

DB_PATH = Path(".cms-data/payload.db")
SOURCE_FILE = Path("../content/portfolio/infinite-playlist.json")

CANONICAL_TITLE = "Amazon Music Live - Infinite Playlist Tour"
CANONICAL_SLUG = "amazon-music-live-infinite-playlist-tour"
LIVE_URL = f"/case-studies/{CANONICAL_SLUG}"
PREVIEW_URL = f"/preview?path={LIVE_URL}&collection=case-studies&slug={CANONICAL_SLUG}"

VIDEO_TITLE_BY_ID = {
    "dAscyMAltCc": "Stage Coach Infinite Playlist Tour - Recap Video",
    "_MOJ_AOpApE": "Outside Lands Infinite Playlist Tour - Recap Video",
    "yzqcpqORO6w": "Amazon Music Live Outside Lands Activation Recap Video After Movie",
    "kgWQxYT3qZE": "Lighting and Environmental Design for Amazon Music Live at Stagecoach 2023",
    "K6q4bdCMADI": "Merchandise presented for Amazon Music at Stagecoach 2023",
}


def as_list(value):
    return value if isinstance(value, list) else []


def youtube_id(url: str) -> str:
    if not url:
        return ""
    markers = ("v=", "/embed/", "youtu.be/")
    for marker in markers:
        if marker in url:
            suffix = url.split(marker, 1)[1]
            return suffix.split("&", 1)[0].split("?", 1)[0].strip("/")
    return ""


def nested_id() -> str:
    return str(uuid.uuid4())


def media_id_for_legacy_url(cur: sqlite3.Cursor, legacy_url: str):
    if not legacy_url or not legacy_url.startswith("/"):
        return None
    filename = legacy_url.rsplit("/", 1)[-1]
    if not filename:
        return None
    row = cur.execute("SELECT id FROM media WHERE filename = ? LIMIT 1", (filename,)).fetchone()
    return row[0] if row else None


def main():
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH.resolve()}")
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(f"Source file not found: {SOURCE_FILE.resolve()}")

    source = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))

    con = sqlite3.connect(str(DB_PATH))
    cur = con.cursor()

    existing = cur.execute("SELECT id FROM case_studies WHERE slug = ? LIMIT 1", (CANONICAL_SLUG,)).fetchone()
    og_image_id = media_id_for_legacy_url(cur, (source.get("seo", {}).get("og", {}).get("image") or ""))

    payload = (
        CANONICAL_TITLE,
        CANONICAL_SLUG,
        "published",
        1,
        10,
        CANONICAL_TITLE,
        source.get("hero", {}).get("subheadline", ""),
        source.get("metadata", {}).get("client", "Amazon Music Live"),
        "Outside Lands (San Francisco, CA) and Stagecoach (Indio, CA)",
        source.get("metadata", {}).get("type", ""),
        "Under $100K",
        source.get("seo", {}).get("title", f"{CANONICAL_TITLE} - Case Study"),
        source.get("seo", {}).get("description", ""),
        source.get("seo", {}).get("og", {}).get("title", source.get("seo", {}).get("title", CANONICAL_TITLE)),
        source.get("seo", {}).get("og", {}).get("description", source.get("seo", {}).get("description", "")),
        LIVE_URL,
        0,
        og_image_id,
        LIVE_URL,
        PREVIEW_URL,
        "published",
    )

    if existing:
        case_study_id = existing[0]
        cur.execute(
            """
            UPDATE case_studies
            SET title = ?, slug = ?, status = ?, is_enabled = ?, list_order = ?,
                hero_headline = ?, hero_subheadline = ?, metadata_client = ?, metadata_location = ?,
                metadata_type = ?, metadata_investment_range = ?, seo_title = ?, seo_description = ?,
                seo_og_title = ?, seo_og_description = ?, seo_canonical_url = ?, seo_noindex = ?,
                seo_og_image_id = ?, live_url = ?, preview_url = ?, _status = ?
            WHERE id = ?
            """,
            payload + (case_study_id,),
        )
    else:
        cur.execute(
            """
            INSERT INTO case_studies (
                title, slug, status, is_enabled, list_order, hero_headline, hero_subheadline,
                metadata_client, metadata_location, metadata_type, metadata_investment_range,
                seo_title, seo_description, seo_og_title, seo_og_description, seo_canonical_url,
                seo_noindex, seo_og_image_id, live_url, preview_url, _status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            payload,
        )
        case_study_id = cur.lastrowid

    for table in (
        "case_studies_hero_tags",
        "case_studies_metadata_partners",
        "case_studies_body_items",
        "case_studies_body",
        "case_studies_images",
        "case_studies_videos",
    ):
        cur.execute(f"DELETE FROM {table} WHERE _parent_id = ?", (case_study_id,))

    for idx, tag in enumerate(as_list(source.get("hero", {}).get("tags"))):
        cur.execute(
            "INSERT INTO case_studies_hero_tags (_order, _parent_id, id, tag) VALUES (?, ?, ?, ?)",
            (idx + 1, case_study_id, nested_id(), str(tag)),
        )

    for idx, partner in enumerate(as_list(source.get("metadata", {}).get("partners"))):
        cur.execute(
            "INSERT INTO case_studies_metadata_partners (_order, _parent_id, id, name) VALUES (?, ?, ?, ?)",
            (idx + 1, case_study_id, nested_id(), str(partner)),
        )

    body_blocks = as_list(source.get("body"))
    body_blocks.append(
        {
            "type": "outcomes",
            "heading": "Outcomes Snapshot",
            "content": "Measured output from the campaign deployment footprint:",
            "items": [
                "2 major festival activations executed (Outside Lands + Stagecoach)",
                "5 documented recap and technical highlight videos delivered",
                "8 interactive fan touchpoints deployed across the experience",
                "3 strategic partners coordinated across production and operations",
            ],
        }
    )

    for bidx, block in enumerate(body_blocks):
        block_id = nested_id()
        cur.execute(
            "INSERT INTO case_studies_body (_order, _parent_id, id, type, heading, content) VALUES (?, ?, ?, ?, ?, ?)",
            (
                bidx + 1,
                case_study_id,
                block_id,
                str(block.get("type", "text")),
                str(block.get("heading", "")),
                str(block.get("content", "")),
            ),
        )
        for iidx, item in enumerate(as_list(block.get("items"))):
            value = item if isinstance(item, str) else str(item.get("value", ""))
            cur.execute(
                "INSERT INTO case_studies_body_items (_order, _parent_id, id, value) VALUES (?, ?, ?, ?)",
                (iidx + 1, block_id, nested_id(), value),
            )

    for iidx, image in enumerate(as_list(source.get("images"))):
        legacy_url = str(image.get("url", ""))
        cur.execute(
            "INSERT INTO case_studies_images (_order, _parent_id, id, media_id, legacy_url, alt) VALUES (?, ?, ?, ?, ?, ?)",
            (
                iidx + 1,
                case_study_id,
                nested_id(),
                media_id_for_legacy_url(cur, legacy_url),
                legacy_url,
                str(image.get("alt", "Amazon Music Live activation image")),
            ),
        )

    for vidx, video in enumerate(as_list(source.get("videos"))):
        url = str(video.get("url", ""))
        embed = str(video.get("embedUrl", ""))
        video_id = youtube_id(url or embed)
        cur.execute(
            "INSERT INTO case_studies_videos (_order, _parent_id, id, title, provider, url, embed_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                vidx + 1,
                case_study_id,
                nested_id(),
                VIDEO_TITLE_BY_ID.get(video_id, str(video.get("title", "Campaign video"))),
                str(video.get("provider", "youtube")),
                url,
                embed or (f"https://www.youtube.com/embed/{video_id}" if video_id else ""),
            ),
        )

    con.commit()
    print(f"Upserted case study: {CANONICAL_SLUG} (id={case_study_id})")


if __name__ == "__main__":
    main()
