"""
Generate logo PNGs and favicons from the uploaded ALLIN logo.
The uploaded logo is a square emblem (1024x1024 with transparency).

Output:
  - public/logo.png          (square emblem for navbar, 200x200)
  - public/logo-white.png    (white-tinted version for dark footer, 200x200)
  - public/favicon-32x32.png (browser tab icon)
  - public/apple-touch-icon.png (iOS, 180x180)
  - public/icon-192.png      (Android PWA, 192x192)
  - public/icon-512.png      (PWA/OG share, 512x512)
  - public/favicon.ico       (traditional favicon)
"""

from PIL import Image
import os

SRC = "/home/z/my-project/upload/file_0000000065447208af727c74f08b8d9e.png"
DST = "/home/z/my-project/public"

def make_white_version(img):
    """Create a version visible on dark backgrounds by lightening colors."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    r, g, b, a = img.split()
    white = Image.new('L', img.size, 255)
    
    # Lighten significantly so it's visible on dark green
    r_light = Image.blend(r, white, 0.75)
    g_light = Image.blend(g, white, 0.75)
    b_light = Image.blend(b, white, 0.75)
    
    return Image.merge('RGBA', (r_light, g_light, b_light, a))

def make_icon(img, size):
    """Create a square icon of given size."""
    return img.resize((size, size), Image.LANCZOS)

def make_navbar_logo(img, size=200):
    """Create a square logo for the navbar, cropped to content with padding."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if bbox is None:
        return img.resize((size, size), Image.LANCZOS)
    
    left, top, right, bottom = bbox
    content_w = right - left
    content_h = bottom - top
    
    # Add 5% padding around content
    pad_x = int(content_w * 0.05)
    pad_y = int(content_h * 0.05)
    crop_left = max(0, left - pad_x)
    crop_top = max(0, top - pad_y)
    crop_right = min(img.width, right + pad_x)
    crop_bottom = min(img.height, bottom + pad_y)
    
    cropped = img.crop((crop_left, crop_top, crop_right, crop_bottom))
    
    # Make it square (take the larger dimension)
    w, h = cropped.size
    max_dim = max(w, h)
    
    # Create square canvas with transparency
    square = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    paste_x = (max_dim - w) // 2
    paste_y = (max_dim - h) // 2
    square.paste(cropped, (paste_x, paste_y))
    
    return square.resize((size, size), Image.LANCZOS)

def create_favicon_ico(img):
    """Create a multi-size .ico file."""
    ico_path = os.path.join(DST, "favicon.ico")
    img_32 = img.resize((32, 32), Image.LANCZOS)
    img_32.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"  Created: {ico_path}")
    return ico_path

def main():
    print("Loading source image...")
    src = Image.open(SRC)
    print(f"  Source: {src.size}, mode={src.mode}")
    
    if src.mode != 'RGBA':
        src = src.convert('RGBA')
    
    # 1. Square navbar logo
    print("\n1. Generating navbar logo (200x200)...")
    logo = make_navbar_logo(src, size=200)
    logo_path = os.path.join(DST, "logo.png")
    logo.save(logo_path, "PNG", optimize=True)
    print(f"  Created: {logo_path} ({logo.size})")
    
    # 2. White version for footer
    print("\n2. Generating white footer logo (200x200)...")
    white_src = make_white_version(src)
    white_logo = make_navbar_logo(white_src, size=200)
    white_path = os.path.join(DST, "logo-white.png")
    white_logo.save(white_path, "PNG", optimize=True)
    print(f"  Created: {white_path} ({white_logo.size})")
    
    # 3. Favicon sizes
    print("\n3. Generating favicons...")
    sizes = {
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
    }
    
    for filename, size in sizes.items():
        icon = make_icon(src, size)
        path = os.path.join(DST, filename)
        icon.save(path, "PNG", optimize=True)
        print(f"  Created: {path} ({size}x{size})")
    
    # 4. favicon.ico
    print("\n4. Generating favicon.ico...")
    create_favicon_ico(src)
    
    print("\nDone!")

if __name__ == "__main__":
    main()