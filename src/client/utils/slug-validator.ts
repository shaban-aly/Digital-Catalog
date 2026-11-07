/**
 * DNS RFC 1123 Subdomain Slug Validator & Normalizer
 * Enforces valid hostname label rules for merchant storefronts.
 */

export const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;

export const RESERVED_SLUGS: readonly string[] = [
  'admin',
  'api',
  'support',
  'billing',
  'digitalmenu',
  'suez',
  'app',
  'dashboard',
  'auth',
  'login',
  'register',
  'help',
  'status',
  'mail',
  'smtp',
  'pop',
  'imap',
  'ftp',
  'ns1',
  'ns2',
  'dns',
  'root',
  'superadmin',
  'daleel',
  'daleel-al-suez',
];

export interface SlugValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Checks if a given slug matches reserved platform subdomains.
 */
export function isReservedSlug(slug: string): boolean {
  const clean = slug.toLowerCase().trim();
  return RESERVED_SLUGS.includes(clean);
}

/**
 * Validates a candidate slug against DNS RFC 1123 label standards and reserved words.
 */
export function validateSlugFormat(rawSlug: string): SlugValidationResult {
  const clean = (rawSlug ?? '').trim().toLowerCase();

  if (!clean) {
    return { valid: false, error: 'يرجى إدخال الرابط' };
  }

  if (clean.length < 3) {
    return { valid: false, error: 'الرابط قصير جداً (3 أحرف على الأقل)' };
  }

  if (clean.length > 63) {
    return { valid: false, error: 'الرابط طويل جداً (63 حرف كحد أقصى)' };
  }

  if (clean.includes('--')) {
    return { valid: false, error: 'لا يمكن استخدام شرطتين متتاليتين في الرابط' };
  }

  if (clean.startsWith('-') || clean.endsWith('-')) {
    return { valid: false, error: 'الرابط لا يمكن أن يبدأ أو ينتهي بشرطة' };
  }

  if (!SLUG_REGEX.test(clean)) {
    return {
      valid: false,
      error: 'الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة فقط',
    };
  }

  if (isReservedSlug(clean)) {
    return {
      valid: false,
      error: 'هذا الرابط محجوز للمنصة ولا يمكن استخدامه',
    };
  }

  return { valid: true };
}

const ARABIC_CHAR_MAP: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'k',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
  'ة': 'a', 'ء': '', 'ئ': 'y', 'ؤ': 'w',
};

/**
 * Phonetically transliterates Arabic characters into Latin equivalents for friendly slug generation.
 */
export function transliterateArabicToLatin(text: string): string {
  return (text ?? '')
    .split('')
    .map((char) => ARABIC_CHAR_MAP[char] ?? char)
    .join('');
}

/**
 * Normalizes input text into a DNS-compliant slug candidate.
 * Supports both Latin text and phonetically transliterated Arabic names.
 */
export function normalizeSlug(raw: string): string {
  const transliterated = transliterateArabicToLatin(raw ?? '');
  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

