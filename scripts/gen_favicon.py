#!/usr/bin/env python3
"""Generate ALLIN favicon PNG files using Pillow."""

from PIL import Image, ImageDraw

def draw_allin_icon(size):
    """Draw the ALLIN lightning-in-circle icon at given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = max(1, int(size * 0.04))
    cx, cy = size // 2, size // 2
    r = (size // 2) - margin
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill='#1B5E20')

    # Lightning bolt - brand yellow/gold
    bolt_points = [
        (0.568, 0.182),
        (0.318, 0.545),
        (0.455, 0.545),
        (0.386, 0.636),
        (0.432, 0.909),
        (0.682, 0.364),
        (0.545, 0.364),
        (0.614, 0.273),
    ]

    pts = [(x * size, y * size) for x, y in bolt_points]
    draw.polygon(pts, fill='#F9A825')

    return img


# Generate favicon 32x32
fav32 = draw_allin_icon(32)
fav32.save('/home/z/my-project/public/favicon-32x32.png', 'PNG')
print("Created favicon-32x32.png")

# Generate apple-touch-icon 180x180
fav180 = draw_allin_icon(180)
fav180.save('/home/z/my-project/public/apple-touch-icon.png', 'PNG')
print("Created apple-touch-icon.png")

# Generate Android/manifest 192x192
fav192 = draw_allin_icon(192)
fav192.save('/home/z/my-project/public/icon-192.png', 'PNG')
print("Created icon-192.png")

# Generate PWA 512x512
fav512 = draw_allin_icon(512)
fav512.save('/home/z/my-project/public/icon-512.png', 'PNG')
print("Created icon-512.png")

print("All favicons generated!")