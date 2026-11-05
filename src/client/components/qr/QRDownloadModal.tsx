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
  // Generate high-resolution QR image URL via standard QR API / canvas
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
    redirectUrl
  )}&margin=10`;

  const handleDownload = async (format: 'png' | 'svg') => {
    const downloadUrl =
      format === 'svg'
        ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=svg&data=${encodeURIComponent(
            redirectUrl
          )}`
        : qrApiUrl;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `qr-${shortCode}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-sm bg-[var(--bg-surface)] p-6 text-center space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X size={20} />
        </button>

        <div>
          <h3 className="text-base font-extrabold text-[var(--text-primary)]">رمز QR الخاص بالمتجر</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">{storeName}</p>
        </div>

        {/* QR Code Container */}
        <div className="w-48 h-48 mx-auto p-2 bg-white rounded-[var(--radius-lg)] border-2 border-[var(--border-subtle)] shadow-inner flex items-center justify-center">
          <img src={qrApiUrl} alt={`QR Code for ${storeName}`} className="w-full h-full object-contain" />
        </div>

        {/* Stable URL pill */}
        <div className="bg-[var(--bg-surface-subtle)] p-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          <span className="text-[11px] font-mono text-[var(--text-secondary)] select-all" dir="ltr">
            {redirectUrl}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="primary" onClick={() => handleDownload('png')} className="gap-1.5">
            <Download size={16} /> تنزيل PNG
          </Button>
          <Button variant="outline" onClick={() => handleDownload('svg')} className="gap-1.5">
            <Download size={16} /> تنزيل SVG
          </Button>
        </div>
      </Card>
    </div>
  );
}
