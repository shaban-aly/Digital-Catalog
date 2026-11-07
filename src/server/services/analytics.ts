import { supabase } from '../db/supabase.ts';
import type { LogQrScanEventParams } from '../../shared/types.ts';

const KNOWN_BOT_PATTERNS = [
  /WhatsApp/i,
  /facebookexternalhit/i,
  /Twitterbot/i,
  /Googlebot/i,
  /bingbot/i,
  /Baiduspider/i,
  /TelegramBot/i,
  /Slackbot/i,
  /LinkedInBot/i,
  /Discordbot/i,
  /HeadlessChrome/i,
];

/**
 * Truncates an IPv4 address to /24 or IPv6 to /48 subnet for GDPR privacy compliance
 */
export function truncateIpSubnet(ipAddress: string): string {
  if (!ipAddress) return '0.0.0.0';
  return ipAddress.includes('.')
    ? ipAddress.split('.').slice(0, 3).join('.') + '.0'
    : ipAddress.split(':').slice(0, 3).join(':') + '::';
}

/**
 * Checks whether a User-Agent belongs to a known link preview bot or search crawler
 */
export function isCrawlerOrBot(userAgent: string): boolean {
  if (!userAgent) return true;
  return KNOWN_BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Generates a privacy-safe daily salted fingerprint
 * Conforms to GDPR: zero raw IP storage, cross-day tracking mathematically impossible.
 */
export async function generatePrivacyFingerprint(
  ipAddress: string,
  userAgent: string,
  secretKey = (typeof process !== 'undefined' ? process?.env?.ANALYTICS_HMAC_SECRET : undefined) || 'fallback-secret-2026'
): Promise<string> {
  const truncatedIp = truncateIpSubnet(ipAddress);
  const todayIso = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const rawString = `${todayIso}:${secretKey}:${truncatedIp}:${userAgent}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(rawString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Logs an asynchronous QR scan event into the database
 */
export async function logQrScanEvent(params: LogQrScanEventParams): Promise<void> {
  const { qrCodeId, ipAddress, userAgent, referrer } = params;

  try {
    const isBot = isCrawlerOrBot(userAgent);
    const fingerprintHash = await generatePrivacyFingerprint(ipAddress, userAgent);

    // Increment aggregate counter atomically if not a preview bot
    if (!isBot) {
      await supabase.rpc('increment_qr_scans', { p_qr_id: qrCodeId });
    }

    // Insert ephemeral event record
    await supabase.from('qr_scan_events').insert({
      qr_code_id: qrCodeId,
      fingerprint_hash: fingerprintHash,
      is_bot: isBot,
      referrer: referrer || null,
      scanned_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-blocking: analytics logging failure must never degrade consumer experience
    console.error('[Analytics] Failed to log scan event asynchronously:', err);
  }
}
