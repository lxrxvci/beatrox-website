import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO_DIR = ROOT / "content" / "portfolio"
REPORT_PATH = ROOT / "site" / "reports" / "video-dedupe-report.json"


def canonical_video_key(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.lower().replace("www.", "")
    path = parsed.path.strip("/")

    if "youtu.be" in host and path:
        return f"youtube:{path}"
    if "youtube.com" in host:
        video_id = parse_qs(parsed.query).get("v", [None])[0]
        if video_id:
            return f"youtube:{video_id}"
        if path.startswith("embed/"):
            return f"youtube:{path.split('/', 1)[1]}"
    if "vimeo.com" in host:
        match = re.search(r"(\d+)$", path)
        if match:
            return f"vimeo:{match.group(1)}"
    return f"url:{url.strip().lower()}"


def main():
    changes = []
    for file_path in sorted(PORTFOLIO_DIR.glob("*.json")):
        data = json.loads(file_path.read_text(encoding="utf-8"))
        videos = data.get("videos", [])
        if not videos:
            continue

        seen = set()
        deduped = []
        removed = 0
        for video in videos:
            url = (video.get("url") or "").strip()
            if not url:
                continue
            key = canonical_video_key(url)
            if key in seen:
                removed += 1
                continue
            seen.add(key)
            deduped.append(video)

        if removed > 0:
            data["videos"] = deduped
            file_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            changes.append({"slug": file_path.stem, "removedDuplicates": removed, "remainingVideos": len(deduped)})

    report = {"projectsUpdated": len(changes), "changes": changes}
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {REPORT_PATH.relative_to(ROOT).as_posix()}")
    print(f"Projects updated: {len(changes)}")


if __name__ == "__main__":
    main()
