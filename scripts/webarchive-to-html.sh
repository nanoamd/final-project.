#!/usr/bin/env bash
#
# Turns Safari .webarchive files into what the importer can read.
#
# Saving a page with ⌘S gives a .webarchive: a binary Apple plist holding the
# HTML *and* every subresource. The importer needs plain HTML, so this extracts
# it — and it extracts the product images too, which matters more than it sounds.
#
# didesigns.co.uk sits behind a SiteGround CAPTCHA that answers automated
# requests with a 202 and a 241-byte challenge page, images included. So the
# importer cannot download product photography, and the only copy that can reach
# it is the one already inside the webarchive. Extracting the images here is not
# a convenience; it is the only route.
#
# Per input file, writes:
#   <name>.html          the main resource, byte for byte, script tags intact
#   <name>.images/       image subresources, named from their URL
#
# The script tags matter: the importer reads JSON-LD, so a conversion that
# rendered the page to tidy HTML (textutil does this) would throw away
# everything worth having.
#
# Usage:
#   bash scripts/webarchive-to-html.sh ~/Downloads/"DI Designs" supplier-pages/di-designs
#
# Optional third argument caps image width in pixels, using macOS's built-in
# sips. Useful because these commit to git to reach the remote session:
#   bash scripts/webarchive-to-html.sh <in> <out> 2000
#
# Merchant Center wants at least 800px, so keep any cap comfortably above that.

set -euo pipefail

IN_DIR="${1:-}"
OUT_DIR="${2:-}"
MAX_WIDTH="${3:-}"

if [[ -z "$IN_DIR" || -z "$OUT_DIR" ]]; then
  echo "Usage: bash scripts/webarchive-to-html.sh <input-dir> <output-dir> [max-image-width]" >&2
  exit 1
fi
if [[ ! -d "$IN_DIR" ]]; then
  echo "Input directory does not exist: $IN_DIR" >&2
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found. On macOS: xcode-select --install" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

python3 - "$IN_DIR" "$OUT_DIR" <<'PY'
import json, os, plistlib, re, sys
from urllib.parse import unquote, urlparse

in_dir, out_dir = sys.argv[1], sys.argv[2]

archives = sorted(f for f in os.listdir(in_dir) if f.lower().endswith(".webarchive"))
if not archives:
    print(f"No .webarchive files in {in_dir}", file=sys.stderr)
    sys.exit(1)

def safe_stem(name):
    """A filename the shell and git are both relaxed about."""
    stem = os.path.splitext(name)[0]
    # Supplier page titles carry " | Trade Furniture | DI Designs" and spaces.
    stem = stem.split("|")[0].strip()
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip("-")
    return stem or "page"

def product_image_urls(html):
    """Only the images the product's own JSON-LD names.

    A webarchive holds every subresource on the page — theme sprites, payment
    icons, the logo, related-product thumbnails. Extracting all of them would
    bury five real photographs in a hundred that are not of this product.
    """
    urls = []
    for block in re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html, re.S | re.I):
        try:
            data = json.loads(block.strip())
        except Exception:
            continue
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, list):
                stack.extend(node); continue
            if not isinstance(node, dict):
                continue
            stack.extend(v for v in node.values() if isinstance(v, (dict, list)))
            types = node.get("@type")
            types = types if isinstance(types, list) else [types]
            if "Product" not in types:
                continue
            image = node.get("image") or []
            image = image if isinstance(image, list) else [image]
            for item in image:
                if isinstance(item, str):
                    urls.append(item)
                elif isinstance(item, dict) and isinstance(item.get("url"), str):
                    urls.append(item["url"])
    # Deduplicated, order preserved: these pages repeat the first photo, and a
    # gallery that opens on the same image twice looks broken.
    seen, ordered = set(), []
    for u in urls:
        if u not in seen:
            seen.add(u); ordered.append(u)
    return ordered

total_pages = total_images = 0
total_bytes = 0
skipped = []

for name in archives:
    path = os.path.join(in_dir, name)
    try:
        with open(path, "rb") as fh:
            archive = plistlib.load(fh)
    except Exception as err:
        skipped.append((name, f"unreadable plist: {err}"))
        continue

    main = archive.get("WebMainResource") or {}
    html_bytes = main.get("WebResourceData")
    if not html_bytes:
        skipped.append((name, "no WebMainResource"))
        continue

    encoding = main.get("WebResourceTextEncodingName") or "utf-8"
    try:
        html = html_bytes.decode(encoding, errors="replace")
    except LookupError:
        html = html_bytes.decode("utf-8", errors="replace")

    stem = safe_stem(name)
    with open(os.path.join(out_dir, stem + ".html"), "wb") as fh:
        fh.write(html_bytes)
    total_pages += 1
    total_bytes += len(html_bytes)

    wanted = product_image_urls(html)
    if not wanted:
        skipped.append((name, "HTML written, but no JSON-LD Product images"))
        continue

    # Index the archive's subresources by URL, so the JSON-LD order is what the
    # gallery ends up in.
    by_url = {}
    for sub in archive.get("WebSubresources") or []:
        url = sub.get("WebResourceURL")
        data = sub.get("WebResourceData")
        if url and data:
            by_url[url] = (data, sub.get("WebResourceMIMEType") or "")

    image_dir = os.path.join(out_dir, stem + ".images")
    written = 0
    for position, url in enumerate(wanted):
        entry = by_url.get(url)
        if entry is None:
            continue
        data, mime = entry
        if not (mime.startswith("image/") or re.search(r"\.(jpe?g|png|webp|avif)$",
                                                      urlparse(url).path, re.I)):
            continue
        os.makedirs(image_dir, exist_ok=True)
        base = unquote(os.path.basename(urlparse(url).path)) or f"image-{position}"
        # Numbered so the gallery keeps the page's own order once sorted.
        out_name = f"{position:02d}-{re.sub(r'[^A-Za-z0-9._-]+', '-', base)}"
        with open(os.path.join(image_dir, out_name), "wb") as fh:
            fh.write(data)
        written += 1
        total_bytes += len(data)
    total_images += written
    if written < len(wanted):
        skipped.append((name,
            f"{written}/{len(wanted)} images found in the archive"))

print(f"\n{total_pages} page(s) and {total_images} image(s) written to {out_dir}")
print(f"total {total_bytes / 1_048_576:.1f} MB")
if skipped:
    print(f"\n{len(skipped)} note(s):")
    for name, why in skipped:
        print(f"  - {name[:58]}: {why}")
PY

if [[ -n "$MAX_WIDTH" ]]; then
  if command -v sips >/dev/null 2>&1; then
    echo
    echo "Capping image width at ${MAX_WIDTH}px…"
    # -Z only shrinks; an image already narrower is left alone.
    find "$OUT_DIR" -type d -name "*.images" -exec \
      sh -c 'sips -Z '"$MAX_WIDTH"' "$1"/* >/dev/null 2>&1 || true' _ {} \;
    echo "Now $(du -sh "$OUT_DIR" | cut -f1) total."
  else
    echo "sips not found — skipping the resize (macOS only)." >&2
  fi
fi

echo
echo "Next:"
echo "  git add $OUT_DIR"
echo "  git commit -m 'Saved D.I. Designs product pages'"
echo "  git push origin claude/kaiku-home-continue-v94z7g"
