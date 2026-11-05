import { formatCurrencySymbol } from '../../shared/currency';

/**
 * WhatsApp Message Formatter for Direct Ordering & Inquiries
 */

export interface WhatsAppOrderDetails {
  storeName: string;
  storePhone: string;
  productName: string;
  variantName?: string;
  selectedOptions?: Array<{
    groupName: string;
    optionName: string;
    priceDelta: number;
  }>;
  totalPrice: number;
  currency: string;
  catalogUrl: string;
}

/**
 * Builds a direct WhatsApp click-to-chat URL with an encoded structured order message
 */
export function buildWhatsAppOrderUrl(details: WhatsAppOrderDetails): string {
  const {
    storeName,
    storePhone,
    productName,
    variantName,
    selectedOptions = [],
    totalPrice,
    currency,
    catalogUrl,
  } = details;

  // Clean phone number: remove non-numeric characters (spaces, +, -, etc.)
  const cleanPhone = storePhone.replace(/\D/g, '');

  const displayCurrency = formatCurrencySymbol(currency);

  let message = `مرحباً ${storeName}،\n`;
  message += `أود طلب المنتج التالي من كتالوجكم الإلكتروني:\n\n`;
  message += `🛒 *${productName}*\n`;

  if (variantName) {
    message += `▫️ *الحجم / المتغير:* ${variantName}\n`;
  }

  if (selectedOptions.length > 0) {
    message += `▫️ *الإضافات والخيارات:*\n`;
    for (const opt of selectedOptions) {
      const deltaText = opt.priceDelta > 0 ? ` (+${opt.priceDelta} ${displayCurrency})` : '';
      message += `   - ${opt.groupName}: ${opt.optionName}${deltaText}\n`;
    }
  }

  message += `\n💰 *الإجمالي المحسوب:* ${totalPrice.toFixed(2)} ${displayCurrency}\n`;
  message += `🔗 *رابط المنتج في الكتالوج:* ${catalogUrl}\n\n`;
  message += `يرجى تأكيد استلام الطلب وموعد التجهيز. شكراً لك!`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
