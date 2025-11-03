/**
 * Generate Open Graph Sharing Card
 * Creates a 1200x630px social sharing image with the BlackBow logo
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WIDTH = 1200;
const HEIGHT = 630;
const OUTPUT_PATH = resolve(__dirname, '..', 'public', 'logos', 'og-sharing-card.png');
const LOGO_PATH = resolve(__dirname, '..', 'public', 'logos', 'BlackBow_Associates_Logo_Text_Transprent_bg.png');

async function generateSharingCard() {
  try {
    console.log('🎨 Generating Open Graph sharing card...');

    // Check if logo exists
    if (!existsSync(LOGO_PATH)) {
      console.error(`❌ Logo not found at: ${LOGO_PATH}`);
      process.exit(1);
    }

    // Create background gradient (elegant wedding theme - soft gold/cream)
    const background = {
      r: 250,
      g: 245,
      b: 235
    };

    // Create SVG background with gradient
    const svgBackground = `
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#faf5eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f5f0e3;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
      </svg>
    `;

    // Load and resize logo (max 600px width, maintain aspect ratio)
    const logo = await sharp(LOGO_PATH)
      .resize(600, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    const logoMetadata = await sharp(logo).metadata();
    const logoWidth = logoMetadata.width || 600;
    const logoHeight = logoMetadata.height || 600;

    // Calculate logo position (centered)
    const logoX = Math.floor((WIDTH - logoWidth) / 2);
    const logoY = Math.floor((HEIGHT - logoHeight) / 2);

    // Create the final image
    const output = await sharp(Buffer.from(svgBackground))
      .composite([
        {
          input: logo,
          left: logoX,
          top: logoY,
          blend: 'over'
        }
      ])
      .png()
      .toFile(OUTPUT_PATH);

    console.log(`✅ Sharing card created: ${OUTPUT_PATH}`);
    console.log(`   Dimensions: ${WIDTH}x${HEIGHT}px`);
    console.log(`   Logo size: ${logoWidth}x${logoHeight}px`);
    console.log(`   File size: ${(output.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Error generating sharing card:', error);
    process.exit(1);
  }
}

generateSharingCard();
