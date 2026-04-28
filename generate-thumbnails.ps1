$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$portfolioDir = Join-Path $root "assets\portfolio"
$thumbDir = Join-Path $portfolioDir "thumbs"

if (-not (Test-Path $portfolioDir)) {
  throw "Portfolio folder not found: $portfolioDir"
}

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
  throw "Python is required to generate thumbnails."
}

$script = @"
from pathlib import Path
from PIL import Image

source_dir = Path(r"$portfolioDir")
thumb_dir = Path(r"$thumbDir")
thumb_dir.mkdir(exist_ok=True)

image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
poster_tokens = ("-cover", "-poster", "_cover", "_poster")
count = 0

for path in sorted(source_dir.iterdir()):
    if not path.is_file():
        continue
    if path.suffix.lower() not in image_extensions:
        continue
    if any(token in path.stem.lower() for token in poster_tokens):
        continue

    output = thumb_dir / f"{path.stem}.jpg"
    with Image.open(path) as image:
        image = image.convert("RGB")
        image.thumbnail((900, 900), Image.Resampling.LANCZOS)
        image.save(output, "JPEG", quality=82, optimize=True, progressive=True)
    count += 1

print(f"Generated {count} thumbnail(s) in {thumb_dir}")
"@

try {
  $script | python -
} catch {
  throw "Failed to generate thumbnails. Make sure Pillow is installed: python -m pip install Pillow"
}
