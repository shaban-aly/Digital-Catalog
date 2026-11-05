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
  catalogId?: string;
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

export interface QRDestinationResult {
  destinationUrl: string;
  qrId: string;
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
      'https://catalog.daleel-al-suez.com';
  }

  /**
   * Generates and persists a stable dynamic QR code for a catalog
   */
  async getOrCreateQRCode(params: CreateQRCodeParams): Promise<QRCodeRecord> {
    const { businessId } = params;
    let catalogId = params.catalogId;

    // Fallback: If catalogId is missing or identical to businessId, find the primary catalog
    if (!catalogId || catalogId === businessId) {
      const { data: cat } = await supabase
        .from('catalogs')
        .select('id')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cat) {
        catalogId = cat.id;
      }
    }

    const cleanBase = this.appBaseUrl.replace(/\/+$/, '');

    // Check if an active QR code already exists for this business/catalog
    const query = supabase
      .from('qr_codes')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (catalogId) {
      query.eq('catalog_id', catalogId);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return {
        ...existing,
        redirect_url: `${cleanBase}/q/${existing.short_code}`,
      };
    }

    // Auto-create a primary catalog if one doesn't exist yet
    if (!catalogId) {
      const { data: newCat } = await supabase
        .from('catalogs')
        .insert({
          business_id: businessId,
          name: 'قائمة المتجر الرئيسية',
          slug: 'menu',
          is_published: true,
        })
        .select('id')
        .single();

      if (newCat) {
        catalogId = newCat.id;
      }
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
        catalog_id: catalogId || businessId,
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
      redirect_url: `${cleanBase}/q/${created.short_code}`,
    };
  }

  /**
   * Resolves a short code to its destination catalog URL in <50ms
   */
  async resolveDestination(shortCode: string): Promise<QRDestinationResult | null> {
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
    const cleanBase = this.appBaseUrl.replace(/\/+$/, '');
    return {
      destinationUrl: `${cleanBase}/c/${catalogSlug}`,
      qrId: qr.id,
    };
  }
}

export const qrService = new QRService();
