#!/usr/bin/env python3
"""Generate favicon and icon files from the uploaded ALLIN logo."""

from PIL import Image
import os
import base64
import io

SOURCE = "/home/z/my-project/upload/file_0000000065447208af727c74f08b8d9e.png"
PUBLIC = "/home/z/my-project/public"

# Open the source image
img = Image.open(SOURCE)
# Convert to RGBA if needed
if img.mode != 'RGBA':
    img = img.convert('RGBA')

print(f"Source image: {img.size[0]}x{img.size[1]}, mode={img.mode}")

# Generate PNG sizes
sizes = {
    "favicon-16.png": 16,
    "apple-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
    "logo.png": 200,
    "logo-sm.png": 80,
}

for filename, size in sizes.items():
    resized = img.copy()
    resized = resized.resize((size, size), Image.LANCZOS)
    output_path = os.path.join(PUBLIC, filename)
    resized.save(output_path, "PNG")
    print(f"  Created {filename} ({size}x{size})")

# Generate favicon.ico (multiple sizes)
ico_path = os.path.join(PUBLIC, "favicon.ico")
ico_img = img.resize((32, 32), Image.LANCZOS)
ico_img.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print(f"  Created favicon.ico (16/32/48)")

# Generate SVG version with embedded base64 PNG
svg_512 = img.resize((512, 512), Image.LANCZOS)
buffer = io.BytesIO()
svg_512.save(buffer, format="PNG")
b64 = base64.b64encode(buffer.getvalue()).decode("ascii")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <image href="data:image/png;base64,{b64}" width="512" height="512"/>
</svg>'''

svg_path = os.path.join(PUBLIC, "logo.svg")
with open(svg_path, "w") as f:
    f.write(svg_content)
print(f"  Created logo.svg (512x512 embedded PNG)")

print("\nAll icons generated successfully!")