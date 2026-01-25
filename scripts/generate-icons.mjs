import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Icon sizes for Android mipmap (launcher icons)
const launcherSizes = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192,
};

// Foreground sizes (108dp base)
const foregroundSizes = {
  'mdpi': 108,
  'hdpi': 162,
  'xhdpi': 216,
  'xxhdpi': 324,
  'xxxhdpi': 432,
};

const iconSvg = join(rootDir, 'client/public/icon.svg');
const androidResDir = join(rootDir, 'client/android/app/src/main/res');

async function generateIcons() {
  // Generate launcher icons (full icon with background)
  for (const [density, size] of Object.entries(launcherSizes)) {
    const outputDir = join(androidResDir, `mipmap-${density}`);
    await mkdir(outputDir, { recursive: true });
    
    // Generate square icon
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(join(outputDir, 'ic_launcher.png'));
    
    // Generate round icon (same image, Android will clip it)
    await sharp(iconSvg)
      .resize(size, size)
      .png()
      .toFile(join(outputDir, 'ic_launcher_round.png'));
    
    console.log(`Generated ${density} launcher icons (${size}x${size})`);
  }

  // Generate foreground icons for adaptive icons
  // Create SVG with just the foreground elements (no background)
  const foregroundSvg = `<svg width="108" height="108" viewBox="0 0 108 108" xmlns="http://www.w3.org/2000/svg">
  <!-- Branch -->
  <path d="M19 79C29 76 49 74 89 79" stroke="#f3c4c4" stroke-linecap="round" stroke-width="3" fill="none"></path>
  <!-- Bird 1 body -->
  <path d="M39 72C39 64 44 59 49 59C54 59 59 64 59 72" stroke="#f3c4c4" stroke-linecap="round" stroke-width="3" fill="none"></path>
  <!-- Bird 1 head -->
  <circle cx="54" cy="54" r="8" stroke="#f3c4c4" stroke-width="3" fill="none"></circle>
  <!-- Bird 2 body -->
  <path d="M59 72C59 64 64 59 69 59C74 59 79 64 79 72" stroke="#f3c4c4" stroke-linecap="round" stroke-width="3" fill="none"></path>
  <!-- Bird 2 head -->
  <circle cx="69" cy="52" r="8" stroke="#f3c4c4" stroke-width="3" fill="none"></circle>
</svg>`;

  for (const [density, size] of Object.entries(foregroundSizes)) {
    const outputDir = join(androidResDir, `mipmap-${density}`);
    await mkdir(outputDir, { recursive: true });
    
    await sharp(Buffer.from(foregroundSvg))
      .resize(size, size)
      .png()
      .toFile(join(outputDir, 'ic_launcher_foreground.png'));
    
    console.log(`Generated ${density} foreground icon (${size}x${size})`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
