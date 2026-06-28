import os
import json
import shutil

# Imageless slugs that need verified images
imageless_slugs = [
    "disenchantment",
    "cnn-road-to-270", 
    "the-great-escape",
    "el-camino",
    "g-man-experiential-campaign",
    "dubai-360-spherical-projection-theatre",
    "projecting-change-racing-extinction"
]

base_dir = "/Users/lxrxcvi/beatrox-website"

for slug in imageless_slugs:
    deck_dir = os.path.join(base_dir, "site/public/images/deck", slug)
    verified_dir = os.path.join(base_dir, "site/public/images/verified/work", slug)
    json_path = os.path.join(base_dir, "content/portfolio", f"{slug}.json")
    
    # Create verified directory if needed
    os.makedirs(verified_dir, exist_ok=True)
    
    # Find the best deck image (largest file, not a thumbnail)
    best_img = None
    best_size = 0
    if os.path.exists(deck_dir):
        for f in os.listdir(deck_dir):
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                fp = os.path.join(deck_dir, f)
                size = os.path.getsize(fp)
                if size > best_size and size > 20000:  # Skip tiny thumbnails
                    best_size = size
                    best_img = f
    
    if best_img:
        src = os.path.join(deck_dir, best_img)
        # Use a clean filename
        ext = os.path.splitext(best_img)[1]
        dest_name = f"{slug.replace('-', '_')}_preview{ext}"
        dest = os.path.join(verified_dir, dest_name)
        shutil.copy2(src, dest)
        print(f"Copied {best_img} -> {dest} ({best_size} bytes)")
        
        # Update JSON
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # Add the verified image to images array if not already there
        new_url = f"/images/verified/work/{slug}/{dest_name}"
        exists = any(img.get('url') == new_url for img in data.get('images', []))
        if not exists:
            data.setdefault('images', []).append({
                "url": new_url,
                "alt": f"{data.get('title', slug)} preview image"
            })
            with open(json_path, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Updated {json_path}")
        else:
            print(f"Already exists in {json_path}")
    else:
        print(f"No suitable deck image found for {slug}")

print("Done!")
