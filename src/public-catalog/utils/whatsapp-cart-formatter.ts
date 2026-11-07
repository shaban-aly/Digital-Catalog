import { formatCurrencySymbol } from '../../shared/currency.ts';
import type { MultiItemOrderSubmissionType } from '../../shared/schemas.ts';

/**
 * Normalizes an Egyptian phone number to standard international format (201xxxxxxxxx)
 */
export function normalizeEgyptianPhone(phone: string): string {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
    cleanPhone = `2${cleanPhone}`;
  } else if (cleanPhone.startsWith('0020')) {
    cleanPhone = cleanPhone.slice(2);
  } else if (cleanPhone.startsWith('20') && cleanPhone.length === 12) {
    return cleanPhone;
  }
  return cleanPhone;
}

/**
 * Builds a direct WhatsApp click-to-chat URL with an itemized multi-item receipt
 */
export function buildMultiItemWhatsAppOrderUrl(submission: MultiItemOrderSubmissionType): string {
  const {
    storeName,
    storePhone,
    items,
    customerName,
    fulfillmentNotes,
    totalAmount,
    currency,
    catalogUrl,
  } = submission;

  // 1. Normalize Egyptian phone number to international format (201xxxxxxxxx)
  const cleanPhone = normalizeEgyptianPhone(storePhone);

  const displayCurrency = formatCurrencySymbol(currency);

  let message = `مرحباً ${storeName}،\n`;
  message += `أود تأكيد طلب جديد من خلال الكتالوج الإلكتروني:\n\n`;

  if (customerName && customerName.trim()) {
    message += `👤 *اسم العميل:* ${customerName.trim()}\n`;
  }

  if (fulfillmentNotes && fulfillmentNotes.trim()) {
    message += `📝 *ملاحظات الطلب:* ${fulfillmentNotes.trim()}\n`;
  }

  if ((customerName && customerName.trim()) || (fulfillmentNotes && fulfillmentNotes.trim())) {
    message += `\n`;
  }

  message += `🛒 *الأصناف المطلوبة:*\n`;

  items.forEach((item, index) => {
    const itemNum = index + 1;
    const variantPart = item.variantName ? ` (${item.variantName})` : '';
    message += `${itemNum}. *${item.productName}*${variantPart}\n`;
    message += `   - الكمية: ${item.quantity} × ${item.unitPrice.toFixed(2)} ${displayCurrency} = ${item.lineTotal.toFixed(2)} ${displayCurrency}\n`;

    if (item.selectedOptions && item.selectedOptions.length > 0) {
      const optionsText = item.selectedOptions
        .map((opt) => {
          const delta = opt.priceDelta > 0 ? ` (+${opt.priceDelta} ${displayCurrency})` : '';
          return `${opt.groupName}: ${opt.optionName}${delta}`;
        })
        .join(' | ');
      message += `   - الإضافات: ${optionsText}\n`;
    }

    if (item.itemNote && item.itemNote.trim()) {
      message += `   - ملاحظة: ${item.itemNote.trim()}\n`;
    }
  });

  message += `\n💰 *الإجمالي النهائي:* ${totalAmount.toFixed(2)} ${displayCurrency}\n`;
  message += `🔗 *رابط المتجر:* ${catalogUrl}\n\n`;
  message += `يرجى تأكيد استلام الطلب وتكلفة التوصيل وموعد التجهيز. شكراً لك!`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
