import { useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Download, X } from 'lucide-react';

interface QRDownloadModalProps {
  shortCode: string;
  storeName: string;
  redirectUrl: string;
  onClose: () => void;
}

export function QRDownloadModal({ shortCode, storeName, redirectUrl, onClose }: QRDownloadModalProps) {
  // Listen for Escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Ensure a valid URL is always present to prevent 'malformed create-qr-code' errors
  const fallbackUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/q/${shortCode || 'code'}`
      : `https://digitalmenu.daleel-al-suez.com/q/${shortCode || 'code'}`;

  const resolvedUrl = redirectUrl && redirectUrl.trim() ? redirectUrl.trim() : fallbackUrl;

  // Generate high-resolution QR image URL via standard QR API
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
    resolvedUrl
  )}&margin=10`;

  const handleDownload = async (format: 'png' | 'svg') => {
    const downloadUrl =
      format === 'svg'
        ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=svg&data=${encodeURIComponent(
            resolvedUrl
          )}`
        : qrApiUrl;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `qr-${shortCode || 'store'}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <Card className="w-full max-w-sm bg-[var(--bg-surface)] p-6 text-center space-y-4 relative border border-[var(--border-subtle)] shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق النافذة"
          className="absolute top-3 left-3 w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-colors"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div>
          <h3 id="qr-modal-title" className="text-base font-extrabold text-[var(--text-primary)]">
            رمز QR الخاص بقائمة طعامك
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">{storeName}</p>
        </div>

        {/* QR Code Container */}
        <div className="w-48 h-48 mx-auto p-2.5 bg-white rounded-[var(--radius-lg)] border-2 border-[var(--border-subtle)] shadow-inner flex items-center justify-center">
          <img
            src={qrApiUrl}
            alt={`رمز QR لمتجر ${storeName}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Print guidance note */}
        <p className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] p-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] leading-relaxed">
          💡 مقاس الطباعة المقترح لطاولات المطاعم: 10×15 سم على حامل أكريليك.
        </p>

        {/* Stable URL pill */}
        <div className="bg-[var(--bg-surface-subtle)] p-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          <span className="text-[11px] font-mono text-[var(--text-secondary)] select-all" dir="ltr">
            {resolvedUrl}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleDownload('png')}
            className="gap-1.5"
          >
            <Download size={16} aria-hidden="true" /> تنزيل PNG
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => handleDownload('svg')}
            className="gap-1.5"
          >
            <Download size={16} aria-hidden="true" /> تنزيل SVG
          </Button>
        </div>
      </Card>
    </div>
  );
}
