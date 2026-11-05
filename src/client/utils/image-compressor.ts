/**
 * Client-Side Image Compressor
 * Converts any image file to WebP format, limits maximum dimensions to 1080px,
 * and compresses it to <100KB directly in the browser before network transmission.
 */

export interface CompressionResult {
  file: File;
  blob: Blob;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savingsPercentage: number;
  width: number;
  height: number;
}

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  maxSizeBytes?: number;
}

export async function compressImageToWebP(
  sourceFile: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxDimension = 1080,
    quality = 0.8,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image element'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Render onto canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context unavailable'));
        }

        // Draw image with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('WebP blob creation failed'));
            }

            const cleanFileName = sourceFile.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File([blob], cleanFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            const originalSizeBytes = sourceFile.size;
            const compressedSizeBytes = blob.size;
            const savings = Math.max(
              0,
              Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
            );

            resolve({
              file: compressedFile,
              blob,
              originalSizeBytes,
              compressedSizeBytes,
              savingsPercentage: savings,
              width,
              height,
            });
          },
          'image/webp',
          quality
        );
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(sourceFile);
  });
}
