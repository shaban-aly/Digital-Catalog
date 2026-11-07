# Technical Research: QR Code Management (QR-001)

## 1. Short Code Alphabet & Collision Resilience

Standard alphanumeric codes often confuse characters like `0` (zero) with `O` (capital o), and `1` (one) with `l` (lowercase L) or `I` (capital i).
To prevent transcription errors if customers type short links manually, we use **Crockford-inspired Base32**:
```
Charset: 23456789abcdefghjkmnpqrstuvwxyz (32 characters)
```
- With 6 characters: $32^6 = 1,073,741,824$ unique combinations (~1.07 billion).
- For a Suez regional directory scaling to thousands of merchants, collision probability is virtually zero, and handled cleanly by an automated 5-attempt retry loop.

## 2. Ultra-Fast Cloudflare Worker Redirection (<50ms)

When physical customers scan a table QR code:
1. Cloudflare Edge Worker matches regex `/^\/q\/([a-zA-Z0-9_-]+)$/`.
2. Worker queries Supabase for the short code record.
3. Worker returns immediate `302 Found`:
   - `Location: https://{subdomain}.digitalmenu.daleel-al-suez.com` or `/c/{slug}`.
   - `Cache-Control: no-cache, no-store, must-revalidate` (guarantees every physical scan hits the edge to update scan counters).
4. `ctx.waitUntil(logQrScanEvent(...))` runs in the background without holding up the user response.

## 3. High-Resolution Printing Format Support

Print shops in Suez require:
- **PNG 500x500**: Ideal for desktop laser printers, laminated table numbers, and counter tents.
- **Vector SVG**: Essential for large vinyl window signs, billboard decals, and professional offset printing without raster pixelation.

