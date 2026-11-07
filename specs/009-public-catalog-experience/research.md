# Technical Research: Public Catalog Experience (PUB-001)

## 1. Fast Mobile Catalog Performance in Egypt

Public customers accessing digital menus in Egyptian cafes, restaurants, and retail shops often have variable 4G mobile connections. The public catalog experience must achieve:
- **First Contentful Paint (FCP) < 1.0s**: Server-side rendered (SSR) via TanStack Start.
- **Edge Cache Invalidation**: Cloudflare Worker caches HTML with `s-maxage=300, stale-while-revalidate=600`.
- **Zero Third-Party Tracking**: No external Google Fonts, no heavy analytics bundles, standard system font stack.
- **Image CDN Optimization**: Images served through Cloudflare edge caching `/storage/v1/object/public/...` with 30-day immutable caching.

## 2. Dynamic Price Calculation Formula

The calculated item price in the public drawer aggregates:
$$\text{Total Price} = (\text{selectedVariant.price} \text{ or } \text{product.effective\_price}) + \sum_{\text{selected options}} \text{option.price\_delta}$$

All prices use 2 decimal places and formatted local currency symbol (`ج.م` for EGP).

## 3. WhatsApp Message Structuring

The `wa.me` URL format requires standard percent-encoding of Arabic UTF-8 text and emoji characters:
```
https://wa.me/{phone}?text={encodedText}
```
Structure:
1. Polite Arabic greeting with merchant name (`مرحباً {storeName}،`).
2. Order announcement (`أود طلب المنتج التالي من كتالوجكم الإلكتروني:`).
3. Product title in bold (`🛒 *{productName}*`).
4. Selected variant (`▫️ *الحجم / المتغير:* {variantName}`).
5. Structured modifiers list (`▫️ *الإضافات والخيارات:* - {group}: {option} (+{delta})`).
6. Calculated total price in bold (`💰 *الإجمالي المحسوب:* {price} {currency}`).
7. Canonical URL link (`🔗 *رابط المنتج في الكتالوج:* {catalogUrl}`).
8. Closing confirmation request.

