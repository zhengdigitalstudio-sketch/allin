"""Generate ALL logo/icon files from the official ALLIN logo (1254x1254)."""
from PIL import Image
import io, os

SRC = "/home/z/my-project/upload/file_0000000018f072088dbb2d339d88310f.png"  # 1254x1254
DST = "/home/z/my-project/public"

img = Image.open(SRC).convert("RGBA")
print(f"Source: {img.size} ({img.mode})")

# 1. logo.png — full size for general use
logo = img.resize((400, 400), Image.LANCZOS)
logo.save(os.path.join(DST, "logo.png"), "PNG")
print("✓ logo.png (400x400)")

# 2. logo-white.png — same logo, white bg for dark sections
white_bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
white_bg.paste(img, mask=img.split()[3])
logo_w = white_bg.resize((400, 400), Image.LANCZOS)
logo_w.save(os.path.join(DST, "logo-white.png"), "PNG")
print("✓ logo-white.png (400x400, white bg)")

# 3. favicon.ico (32x32, multi-size ICO)
ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_images = []
for s in ico_sizes:
    resized = img.resize(s, Image.LANCZOS)
    # Add white bg for ICO (ICO doesn't support transparency well everywhere)
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

# 4. favicon-32x32.png
f32 = img.resize((32, 32), Image.LANCZOS)
bg32 = Image.new("RGBA", (32, 32), (255, 255, 255, 255))
bg32.paste(f32, mask=f32.split()[3])
bg32.save(os.path.join(DST, "favicon-32x32.png"), "PNG")
print("✓ favicon-32x32.png")

# 5. apple-touch-icon.png (180x180)
at = img.resize((180, 180), Image.LANCZOS)
at.save(os.path.join(DST, "apple-touch-icon.png"), "PNG")
print("✓ apple-touch-icon.png (180x180)")

# 6. icon-192.png
i192 = img.resize((192, 192), Image.LANCZOS)
i192.save(os.path.join(DST, "icon-192.png"), "PNG")
print("✓ icon-192.png")

# 7. icon-512.png
i512 = img.resize((512, 512), Image.LANCZOS)
i512.save(os.path.join(DST, "icon-512.png"), "PNG")
print("✓ icon-512.png")

# 8. og-image.png (1200x630 for social sharing)
og = Image.new("RGB", (1200, 630), (255, 255, 255))
logo_og = img.resize((400, 400), Image.LANCZOS)
# Center the logo
x = (1200 - 400) // 2
y = (630 - 400) // 2
og.paste(logo_og, (x, y), mask=logo_og.split()[3])
og.save(os.path.join(DST, "og-image.png"), "PNG")
print("✓ og-image.png (1200x630)")

# Clean up old SVG placeholders
for f in ["logo.svg", "logo-white.svg", "logo-icon.svg"]:
    p = os.path.join(DST, f)
    if os.path.exists(p):
        os.remove(p)
        print(f"✗ Removed old {f}")

print("\nDone! All logos generated from official ALLIN logo.")