# Technical Research: Privacy-Safe Analytics (ANL-001)

## 1. Zero Raw IP Storage Architecture (GDPR Compliance)

Under GDPR Recital 30, IP addresses are personally identifiable information (PII). Storing raw IP addresses in digital menu analytics is both a regulatory liability and a privacy risk for customers.

### Subnet Truncation + Daily Salted HMAC-SHA256
1. **Subnet Truncation**:
   - IPv4: `197.38.12.89` $\rightarrow$ `197.38.12.0` (/24 subnet represents ~256 users).
   - IPv6: `2001:0db8:85a3:0000:0000:8a2e:0370:7334` $\rightarrow$ `2001:0db8:85a3::` (/48 subnet represents entire networks).
2. **Rotating Daily Salt**:
   - A day-specific string: `2026-11-06:{secret}:{truncatedIp}:{userAgent}`.
3. **SHA-256 Digest**:
   - One-way cryptographically irreversible 64-character hexadecimal digest.
   - Cross-day linkability is mathematically zero.

## 2. Crawler & Bot Detection Patterns

Social media preview crawlers (such as WhatsApp when someone shares a link, Facebook, Twitter) make automatic HTTP GET requests to extract OpenGraph tags.
If left unfiltered, these skew merchant metrics by 300%+.

Regex Detection:
- `WhatsApp`
- `facebookexternalhit`
- `Twitterbot`
- `Googlebot`
- `bingbot`
- `Baiduspider`
- `TelegramBot`
- `Slackbot`
- `LinkedInBot`
- `Discordbot`
- `HeadlessChrome`
- Empty or whitespace `userAgent`

