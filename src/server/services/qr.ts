import { supabase } from '../db/supabase';

const CHARACTERS = '23456789abcdefghjkmnpqrstuvwxyz'; // Base32 unambiguous charset

/**
 * Generates an alphanumeric short code of specified length (default 6 chars)
 */
export function generateShortCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => CHARACTERS[b % CHARACTERS.length])
    .join('');
}

export interface CreateQRCodeParams {
  businessId: string;
  catalogId: string;
}

export interface QRCodeRecord {
  id: string;
  business_id: string;
  catalog_id: string;
  short_code: string;
  is_active: boolean;
  total_scans: number;
  created_at: string;
  redirect_url: string;
}

/**
 * QR Code Service
 */
export class QRService {
  private appBaseUrl: string;

  constructor() {
    this.appBaseUrl =
      import.meta.env.VITE_PUBLIC_APP_URL ||
      process.env.VITE_PUBLIC_APP_URL ||
      'https://<my-name>.daleel-al-suez.com';
  }

  /**
   * Generates and persists a stable dynamic QR code for a catalog
   */
  async getOrCreateQRCode(params: CreateQRCodeParams): Promise<QRCodeRecord> {
    const { businessId, catalogId } = params;

    // Check if an active QR code already exists for this catalog
    const { data: existing } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('catalog_id', catalogId)
      .eq('is_active', true)
      .maybeSingle();

    if (existing) {
      return {
        ...existing,
        redirect_url: `${this.appBaseUrl}/q/${existing.short_code}`,
      };
    }

    // Generate unique short code with collision retry
    let shortCode = generateShortCode(6);
    let attempts = 0;

    while (attempts < 5) {
      const { data: duplicate } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('short_code', shortCode)
        .maybeSingle();

      if (!duplicate) break;
      shortCode = generateShortCode(6);
      attempts++;
    }

    const { data: created, error } = await supabase
      .from('qr_codes')
      .insert({
        business_id: businessId,
        catalog_id: catalogId,
        short_code: shortCode,
        is_active: true,
      })
      .select('*')
      .single();

    if (error || !created) {
      throw new Error(`Failed to create QR record: ${error?.message || 'Database error'}`);
    }

    return {
      ...created,
      redirect_url: `${this.appBaseUrl}/q/${created.short_code}`,
    };
  }

  /**
   * Resolves a short code to its destination catalog URL in <50ms
   */
  async resolveDestination(shortCode: string): Promise<string | null> {
    const { data: qr } = await supabase
      .from('qr_codes')
      .select(`
        id,
        is_active,
        catalog:catalogs (
          slug,
          is_published,
          business:businesses (
            slug
          )
        )
      `)
      .eq('short_code', shortCode)
      .maybeSingle();

    if (!qr || !qr.is_active || !qr.catalog) {
      return null;
    }

    const catalogSlug = (qr.catalog as any).slug;
    return `${this.appBaseUrl}/c/${catalogSlug}`;
  }
}

export const qrService = new QRService();
