# make_ico.py
import urllib.request
import struct
import zlib

width = 256
height = 256

raw_data = bytearray()
for y in range(height):
    raw_data.append(0)
    for x in range(width):
        dx, dy = x - 128, y - 128
        in_badge = abs(dx)**4 + abs(dy)**4 < (112)**4
        in_border = abs(dx)**4 + abs(dy)**4 < (118)**4
        
        if not in_border:
            raw_data.extend([0, 0, 0, 0])
        elif not in_badge:
            raw_data.extend([16, 185, 129, 255])
        else:
            in_wallet_body = (60 <= x <= 196) and (85 <= y <= 175)
            in_wallet_flap = (135 <= x <= 196) and (110 <= y <= 150)
            is_latch = (160 <= x <= 175) and (124 <= y <= 136)
            
            if is_latch:
                raw_data.extend([251, 191, 36, 255])
            elif in_wallet_flap:
                raw_data.extend([5, 150, 105, 255])
            elif in_wallet_body:
                raw_data.extend([16, 185, 129, 255] if y < 100 else [4, 120, 87, 255])
            else:
                raw_data.extend([15, 23, 42, 255])

# ساخت پکیج PNG
signature = b'\x89PNG\r\n\x1a\n'
ihdr = struct.pack('>I', 13) + b'IHDR' + struct.pack('>IIBBBBB', 256, 256, 8, 6, 0, 0, 0)
ihdr += struct.pack('>I', zlib.crc32(ihdr[4:]))
compressed = zlib.compress(bytes(raw_data), 9)
idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', zlib.crc32(b'IDAT' + compressed))
iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND'))
png_bytes = signature + ihdr + idat + iend

# بسته‌بندی در قالب فرمت استاندارد ICO ویندوز
icondir = struct.pack('<HHH', 0, 1, 1)
entry = struct.pack('<BBBBHHII', 0, 0, 0, 0, 1, 32, len(png_bytes), 22)
ico_bytes = icondir + entry + png_bytes

with open("app.ico", "wb") as f:
    f.write(ico_bytes)

print("فایل app.ico با کیفیت عالی تولید شد.")