import { MessageCircle } from 'lucide-react';
import { Button } from '../../client/components/ui/Button';

interface WhatsAppStickyBarProps {
  storeName: string;
  storePhone: string | null;
}

export function WhatsAppStickyBar({ storeName, storePhone }: WhatsAppStickyBarProps) {
  if (!storePhone) return null;

  const handleOpenWhatsApp = () => {
    const cleanPhone = storePhone.replace(/\D/g, '');
    const message = encodeURIComponent(`مرحباً ${storeName}، أود الاستفسار عن المنتجات وقائمة الأسعار.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-[var(--border-subtle)] flex items-center justify-between gap-3 max-w-lg mx-auto shadow-lg">
      <div className="text-right">
        <span className="text-xs font-bold text-[var(--text-primary)] block">طلب أو استفسار سريع؟</span>
        <span className="text-[11px] text-[var(--text-muted)]">تواصل مباشرة مع إدارة المتجر</span>
      </div>

      <Button
        type="button"
        variant="whatsapp"
        size="md"
        onClick={handleOpenWhatsApp}
        className="gap-2 shrink-0"
      >
        <MessageCircle size={18} />
        <span>تواصل عبر WhatsApp</span>
      </Button>
    </div>
  );
}
