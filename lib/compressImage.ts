/**
 * Compresses an image client-side to <= 1 MB using HTML Canvas
 */
export async function compressImage(file: File, maxSizeBytes: number = 1024 * 1024): Promise<File> {
  // If already under max size, return as is
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize down if excessively large
        const maxDimension = 1600;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress JPEG iteratively to hit target size
        let quality = 0.85;
        const attempt = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              if (blob.size <= maxSizeBytes || quality <= 0.3) {
                const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                quality -= 0.15;
                attempt();
              }
            },
            'image/jpeg',
            quality
          );
        };

        attempt();
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
