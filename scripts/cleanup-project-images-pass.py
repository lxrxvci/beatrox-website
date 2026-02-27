import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO_DIR = ROOT / "content" / "portfolio"
REPORT_PATH = ROOT / "site" / "reports" / "project-image-cleanup-report.json"

RUN_FOR_THE_OCEANS_SLUG = "run-for-the-oceans"
G_MAN_SLUG = "g-man-experiential-campaign"
FALLBACK_URL = "/og-default.jpg"


def main():
    changes = []
    for file_path in sorted(PORTFOLIO_DIR.glob("*.json")):
        slug = file_path.stem
        data = json.loads(file_path.read_text(encoding="utf-8"))
        images = data.get("images", [])
        if not images:
            continue

        original_len = len(images)

        # Remove generic fallback image from all projects except RTFO.
        if slug != RUN_FOR_THE_OCEANS_SLUG:
            images = [img for img in images if str(img.get("url", "")) != FALLBACK_URL]

        # G-MAN: keep only the primary deck image to avoid projection-mapping section spillover.
        if slug == G_MAN_SLUG:
            deck_images = [img for img in images if str(img.get("url", "")).startswith("/images/deck/g-man-experiential-campaign/")]
            non_deck = [img for img in images if not str(img.get("url", "")).startswith("/images/deck/g-man-experiential-campaign/")]
            if deck_images:
                images = [deck_images[0]] + non_deck

        # Keep ordering stable and remove accidental duplicate URLs.
        deduped = []
        seen_urls = set()
        for image in images:
            url = str(image.get("url", "")).strip()
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            deduped.append(image)
        images = deduped

        if images:
            data["images"] = images

        # Ensure OG image does not point to fallback on non-RTFO projects.
        og = data.get("seo", {}).get("og", {})
        if slug != RUN_FOR_THE_OCEANS_SLUG and og.get("image") == FALLBACK_URL and images:
            data["seo"]["og"]["image"] = images[0]["url"]

        updated_len = len(images)
        if updated_len != original_len:
            file_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            changes.append(
                {
                    "slug": slug,
                    "imagesBefore": original_len,
                    "imagesAfter": updated_len,
                    "heroImage": images[0]["url"] if images else None,
                }
            )

    report = {"projectsUpdated": len(changes), "changes": changes}
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {REPORT_PATH.relative_to(ROOT).as_posix()}")
    print(f"Projects updated: {len(changes)}")


if __name__ == "__main__":
    main()
