"""Generate proper ALLIN logos from the official 1254x1254 source.
Key fixes:
- Remove white background (make transparent)
- Crop circular emblem for small icon uses
- Generate proper sizes for all contexts
"""
from PIL import Image
import numpy as np
import os

SRC = "/home/z/my-project/upload/logo untuk website dan faviconya.png"
DST = "/home/z/my-project/public"

img = Image.open(SRC).convert("RGBA")
w, h = img.size
print(f"Source: {img.size}")

# --- Step 1: Remove white background, make transparent ---
arr = np.array(img)
# Detect near-white pixels (R>240, G>240, B>240)
white_mask = (arr[:, :, 0] > 230) & (arr[:, :, 1] > 230) & (arr[:, :, 2] > 230)
arr[white_mask, 3] = 0  # Set alpha to 0 for white pixels
img_transparent = Image.fromarray(arr)

# --- Step 2: Find the emblem bounding box (circular gear area in upper portion) ---
# The emblem is roughly in the top 65% of the image
emblem_h = int(h * 0.62)
emblem_img = img_transparent.crop((0, 0, w, emblem_h))

# Find bounding box of non-transparent pixels in the emblem
arr_e = np.array(emblem_img)
non_transparent = np.where(arr_e[:, :, 3] > 10)
if len(non_transparent[0]) > 0:
    y_min, y_max = int(non_transparent[0].min()), int(non_transparent[0].max())
    x_min, x_max = int(non_transparent[1].min()), int(non_transparent[1].max())
    # Add small padding
    pad = 10
    x_min = max(0, x_min - pad)
    y_min = max(0, y_min - pad)
    x_max = min(w, x_max + pad + 1)
    y_max = min(emblem_h, y_max + pad + 1)
    emblem_cropped = emblem_img.crop((x_min, y_min, x_max, y_max))
    print(f"Emblem bounding box: ({x_min},{y_min}) to ({x_max},{y_max}), size: {x_max-x_min}x{y_max-y_min}")
else:
    emblem_cropped = emblem_img
    print("WARNING: Could not find emblem, using full top portion")

# --- Step 3: Generate all files ---

# 1. logo.png — full logo (emblem + text), transparent bg, 500px tall
logo_h = 500
logo_w = int(w * logo_h / h)
logo_full = img_transparent.resize((logo_w, logo_h), Image.LANCZOS)
logo_full.save(os.path.join(DST, "logo.png"), "PNG")
print(f"✓ logo.png ({logo_w}x{logo_h})")

# 2. logo-white.png — same but on white bg (for footer/dark sections)
white_bg = Image.new("RGBA", (logo_w, logo_h), (255, 255, 255, 255))
white_bg.paste(logo_full, mask=logo_full.split()[3])
white_bg.save(os.path.join(DST, "logo-white.png"), "PNG")
print(f"✓ logo-white.png ({logo_w}x{logo_h}, white bg)")

# 3. logo-icon.png — emblem only (circle), transparent bg, for small sizes
icon_size = 512
emblem_square = emblem_cropped.resize((icon_size, icon_size), Image.LANCZOS)
emblem_square.save(os.path.join(DST, "logo-icon.png"), "PNG")
print(f"✓ logo-icon.png ({icon_size}x{icon_size}, emblem only)")

# 4. favicon.ico (multi-size from emblem)
ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_images = []
for s in ico_sizes:
    resized = emblem_cropped.resize(s, Image.LANCZOS)
    # For ICO, put on white bg since ICO transparency is unreliable
    bg = Image.new("RGBA", s, (255, 255, 255, 255))
    bg.paste(resized, mask=resized.split()[3])
    ico_images.append(bg.convert("RGB"))
ico_images[0].save(
    os.path.join(DST, "favicon.ico"),
    format="ICO",
    sizes=[(s.width, s.height) for s in ico_images],
    append_images=ico_images[1:],
)
print("✓ favicon.ico (16/32/48)")

# 5. favicon-32x32.png (transparent, from emblem)
f32 = emblem_cropped.resize((32, 32), Image.LANCZOS)
f32.save(os.path.join(DST, "favicon-32x32.png"), "PNG")
print("✓ favicon-32x32.png")

# 6. apple-touch-icon.png (180x180, from emblem)
at = emblem_cropped.resize((180, 180), Image.LANCZOS)
at.save(os.path.join(DST, "apple-touch-icon.png"), "PNG")
print("✓ apple-touch-icon.png (180x180)")

# 7. icon-192.png
i192 = emblem_cropped.resize((192, 192), Image.LANCZOS)
i192.save(os.path.join(DST, "icon-192.png"), "PNG")
print("✓ icon-192.png")

# 8. icon-512.png
i512 = emblem_cropped.resize((512, 512), Image.LANCZOS)
i512.save(os.path.join(DST, "icon-512.png"), "PNG")
print("✓ icon-512.png")

# 9. og-image.png (1200x630 for social sharing)
og = Image.new("RGB", (1200, 630), (255, 255, 255))
# Use full logo centered
logo_og = img_transparent.resize((500, 500), Image.LANCZOS)
x = (1200 - 500) // 2
y = (630 - 500) // 2
og.paste(logo_og, (x, y), mask=logo_og.split()[3])
og.save(os.path.join(DST, "og-image.png"), "PNG")
print("✓ og-image.png (1200x630)")

print("\nDone! All logos generated with transparent backgrounds from official ALLIN logo.")