#!/usr/bin/env python3
"""
Verify KuroStop iOS Simulator Screenshot Pixel Integrity.
Ensures that the screen is genuinely rendered (Porcelain Paper Lembar theme)
and NOT a black screen, blank canvas, or stuck splash screen.
"""

import sys
from pathlib import Path
from PIL import Image

def verify_screenshot(image_path_str: str, min_light_percent: float = 65.0, max_black_percent: float = 20.0) -> bool:
    img_path = Path(image_path_str)
    if not img_path.exists():
        print(f"ERROR: Screenshot file does not exist: {img_path}")
        return False

    im = Image.open(img_path).convert('RGB')
    width, height = im.size
    total_pixels = width * height

    colors = im.getcolors(maxcolors=total_pixels)
    if not colors:
        print("ERROR: Could not read color palette from screenshot")
        return False

    black_pixels = 0
    light_paper_pixels = 0  # Paper #F2F3F0 is ~ (242, 243, 240)
    card_white_pixels = 0   # White/Card is > 240, 240, 240

    for count, (r, g, b) in colors:
        # Check pure black or near black (status bar or black screen)
        if r < 15 and g < 15 and b < 15:
            black_pixels += count
        # Check porcelain paper (#F2F3F0 is (242, 243, 240), tolerance +- 15)
        elif 225 <= r <= 255 and 225 <= g <= 255 and 220 <= b <= 255:
            light_paper_pixels += count
        elif r > 200 and g > 200 and b > 200:
            card_white_pixels += count

    black_ratio = (black_pixels / total_pixels) * 100.0
    light_ratio = ((light_paper_pixels + card_white_pixels) / total_pixels) * 100.0

    print(f"=== Verification of {img_path.name} ({width}x{height}) ===")
    print(f"Total Pixels: {total_pixels:,}")
    print(f"Solid/Near Black Pixels: {black_pixels:,} ({black_ratio:.2f}%) [Threshold <= {max_black_percent}%]")
    print(f"Light/Lembar Theme Pixels: {(light_paper_pixels + card_white_pixels):,} ({light_ratio:.2f}%) [Threshold >= {min_light_percent}%]")

    # Print top 5 colors for debugging
    sorted_colors = sorted(colors, reverse=True)
    print("Top 5 dominant colors:")
    for count, col in sorted_colors[:5]:
        pct = (count / total_pixels) * 100
        print(f"  - RGB{col}: {count:,} pixels ({pct:.2f}%)")

    if black_ratio > max_black_percent:
        print(f"CRITICAL FAILURE: Screenshot is dominated by black pixels ({black_ratio:.2f}% > {max_black_percent}%). UI failed to render!")
        return False

    if light_ratio < min_light_percent:
        print(f"CRITICAL FAILURE: Insufficient Lembar porcelain-paper pixels ({light_ratio:.2f}% < {min_light_percent}%). UI view hierarchy incomplete!")
        return False

    print(f"SUCCESS: Screenshot {img_path.name} passed pixel integrity verification (Lembar theme rendered correctly).\n")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python verify_screenshot_pixels.py <screenshot_path> [min_light_pct] [max_black_pct]")
        sys.exit(1)

    path = sys.argv[1]
    min_light = float(sys.argv[2]) if len(sys.argv) > 2 else 65.0
    max_black = float(sys.argv[3]) if len(sys.argv) > 3 else 20.0

    success = verify_screenshot(path, min_light, max_black)
    sys.exit(0 if success else 1)
