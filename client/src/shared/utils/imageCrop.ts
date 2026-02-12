interface PixelCropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image for crop'));
    image.src = src;
  });
}

/**
 * Crop image by pixel area and return a JPEG data URL.
 */
export async function cropImageToDataUrl(
  source: string,
  crop: PixelCropArea,
  quality = 0.92
): Promise<string> {
  const image = await loadImage(source);

  const sx = clamp(crop.x, 0, image.naturalWidth);
  const sy = clamp(crop.y, 0, image.naturalHeight);
  const sw = clamp(crop.width, 1, image.naturalWidth - sx);
  const sh = clamp(crop.height, 1, image.naturalHeight - sy);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available for image crop');
  }

  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}
