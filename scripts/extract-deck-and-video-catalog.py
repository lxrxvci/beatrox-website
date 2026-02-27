import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DECK_PATH = ROOT / "assets" / "decks" / "_Beatrox _ Sizzle - Experience Design Build Case Studies -Master Deck.pptx"
VIDEO_MD_PATH = ROOT / "assets" / "video" / "Video Wall Content and Setup.md"
REPORT_DIR = ROOT / "site" / "reports"
DECK_OUT = REPORT_DIR / "deck-project-catalog.json"
VIDEO_OUT = REPORT_DIR / "video-link-catalog.json"

NS_A = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
NS_REL = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}


def slugify(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[’'`]", "", value)
    value = re.sub(r"&", " and ", value)
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def parse_video_markdown(md_text: str):
    rows = []
    current_label = ""
    for raw_line in md_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("http://") or line.startswith("https://"):
            rows.append(
                {
                    "label": current_label or "unlabeled",
                    "slugCandidate": slugify(current_label or "unlabeled"),
                    "url": line,
                }
            )
        else:
            current_label = line
    return rows


def parse_slide_texts(zf, slide_name: str):
    root = ET.fromstring(zf.read(slide_name))
    texts = []
    for node in root.findall(".//a:t", NS_A):
        if node.text and node.text.strip():
            texts.append(node.text.strip())
    return texts


def parse_slide_links(zf, slide_name: str):
    rel_path = "ppt/slides/_rels/" + Path(slide_name).name + ".rels"
    if rel_path not in zf.namelist():
        return []
    root = ET.fromstring(zf.read(rel_path))
    links = []
    for rel in root:
        target = rel.attrib.get("Target", "")
        mode = rel.attrib.get("TargetMode", "")
        if mode == "External" and target.startswith("http"):
            links.append(target)
    return sorted(set(links))


def parse_meta_from_text(text: str):
    project_name = ""
    client = ""
    location = ""
    type_value = ""

    client_match = re.search(r"CLIENT:\s*([^|]+)", text, re.IGNORECASE)
    location_match = re.search(r"LOCATION:\s*([^|]+)", text, re.IGNORECASE)
    type_match = re.search(r"TYPE:\s*([^|]+(?:\|[^|]+)*)", text, re.IGNORECASE)

    if "CLIENT:" in text:
        project_name = text.split("CLIENT:")[0].strip(" |")
    if client_match:
        client = client_match.group(1).strip()
    if location_match:
        location = location_match.group(1).strip()
    if type_match:
        type_value = type_match.group(1).strip(" |")

    return project_name, client, location, type_value


def extract_deck_catalog():
    with zipfile.ZipFile(DECK_PATH) as zf:
        slide_names = sorted(
            [
                n
                for n in zf.namelist()
                if n.startswith("ppt/slides/slide") and n.endswith(".xml")
            ],
            key=lambda x: int(re.search(r"slide(\d+)\.xml", x).group(1)),
        )

        slide_rows = []
        current_project_slug = None
        project_map = {}
        all_external_links = set()

        for slide_name in slide_names:
            slide_number = int(re.search(r"slide(\d+)\.xml", slide_name).group(1))
            texts = parse_slide_texts(zf, slide_name)
            joined = " | ".join(texts)
            links = parse_slide_links(zf, slide_name)
            for url in links:
                all_external_links.add(url)

            project_name, client, location, type_value = parse_meta_from_text(joined)
            design_objective = ""
            objective_match = re.search(
                r"Design Objective[s]?:\s*(.+)",
                joined,
                re.IGNORECASE,
            )
            if objective_match:
                design_objective = objective_match.group(1).strip()

            if project_name:
                current_project_slug = slugify(project_name)
                project_map.setdefault(
                    current_project_slug,
                    {
                        "projectName": project_name,
                        "slugCandidate": current_project_slug,
                        "client": client,
                        "location": location,
                        "type": type_value,
                        "designObjectives": [],
                        "slideNumbers": [],
                        "links": [],
                        "rawTextSample": texts[:10],
                    },
                )
                if client and not project_map[current_project_slug]["client"]:
                    project_map[current_project_slug]["client"] = client
                if location and not project_map[current_project_slug]["location"]:
                    project_map[current_project_slug]["location"] = location
                if type_value and not project_map[current_project_slug]["type"]:
                    project_map[current_project_slug]["type"] = type_value

            if current_project_slug and current_project_slug in project_map:
                project_map[current_project_slug]["slideNumbers"].append(slide_number)
                project_map[current_project_slug]["links"].extend(links)
                if design_objective:
                    project_map[current_project_slug]["designObjectives"].append(design_objective)

            slide_rows.append(
                {
                    "slide": slide_number,
                    "texts": texts[:20],
                    "links": links,
                    "projectCandidate": current_project_slug,
                }
            )

        # Deduplicate mutable fields
        projects = []
        for value in project_map.values():
            value["slideNumbers"] = sorted(set(value["slideNumbers"]))
            value["links"] = sorted(set(value["links"]))
            value["designObjectives"] = [x for i, x in enumerate(value["designObjectives"]) if x and x not in value["designObjectives"][:i]]
            projects.append(value)
        projects.sort(key=lambda p: p["projectName"])

        return {
            "sourceDeck": str(DECK_PATH.relative_to(ROOT)).replace("\\", "/"),
            "projectCount": len(projects),
            "externalLinkCount": len(all_external_links),
            "projects": projects,
            "externalLinks": sorted(all_external_links),
            "slides": slide_rows,
        }


def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    md_text = VIDEO_MD_PATH.read_text(encoding="utf-8")
    video_rows = parse_video_markdown(md_text)
    video_out = {
        "sourceFile": str(VIDEO_MD_PATH.relative_to(ROOT)).replace("\\", "/"),
        "totalLinks": len(video_rows),
        "entries": video_rows,
    }

    deck_out = extract_deck_catalog()

    DECK_OUT.write_text(json.dumps(deck_out, indent=2) + "\n", encoding="utf-8")
    VIDEO_OUT.write_text(json.dumps(video_out, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {DECK_OUT.relative_to(ROOT).as_posix()}")
    print(f"Wrote {VIDEO_OUT.relative_to(ROOT).as_posix()}")
    print(f"Deck projects: {deck_out['projectCount']}, deck links: {deck_out['externalLinkCount']}, video links: {video_out['totalLinks']}")


if __name__ == "__main__":
    main()
