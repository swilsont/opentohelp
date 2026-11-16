// Classifies a photo frame by color.
// The pixel functions are pure (no DOM) so they can be tested outside the browser.

function averageRGB(rgbaPixels) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < rgbaPixels.length; i += 4) {
    if (rgbaPixels[i + 3] < 128) continue; // skip transparent pixels
    r += rgbaPixels[i];
    g += rgbaPixels[i + 1];
    b += rgbaPixels[i + 2];
    count++;
  }
  if (count === 0) return null;
  return [r / count, g / count, b / count];
}

function rgbDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function classifyColor(rgb) {
  if (!rgb) return BADGE.UNKNOWN;
  const toOpen = rgbDistance(rgb, CONFIG.COLOR_OPEN_TO_WORK);
  const toHiring = rgbDistance(rgb, CONFIG.COLOR_HIRING);
  if (Math.min(toOpen, toHiring) > CONFIG.MAX_COLOR_DISTANCE) return BADGE.UNKNOWN;
  return toOpen <= toHiring ? BADGE.OPEN_TO_WORK : BADGE.HIRING;
}

function classifyPixels(rgbaPixels) {
  return classifyColor(averageRGB(rgbaPixels));
}

// Downloads the photo (from the background, which has no CORS restriction thanks
// to the host permission) and classifies its bottom-left corner.
async function classifyPhoto(photoUrl) {
  const response = await fetch(photoUrl, { credentials: 'omit', cache: 'force-cache' });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const image = await createImageBitmap(await response.blob());
  const side = Math.max(1, Math.round(image.width * CONFIG.CORNER_RATIO));
  const canvas = new OffscreenCanvas(side, side);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, image.height - side, side, side, 0, 0, side, side);
  image.close();
  return classifyPixels(ctx.getImageData(0, 0, side, side).data);
}
