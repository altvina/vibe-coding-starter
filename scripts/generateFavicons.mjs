#!/usr/bin/env node
/**
 * Generates favicons in all formats/sizes used by the codebase from a single source image.
 * Produces light and dark variants for high readability in both themes.
 *
 * Usage: npm run favicons
 * Source: public/static/favicons/2759DDB3-C476-465E-AD84-D2C0BB46A917_1_105_c.jpeg
 * Output: public/static/favicons/*.png and favicon.ico
 */

import sharp from 'sharp';
import toIco from 'to-ico';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public/static/favicons/2759DDB3-C476-465E-AD84-D2C0BB46A917_1_105_c.jpeg');
const OUT_DIR = path.join(ROOT, 'public/static/favicons');

const BORDER_LIGHT = 2; // px dark border for light-mode (visible on white)
const BORDER_DARK = 2;  // px light border for dark-mode (visible on dark)
const LIGHT_BG = { r: 28, g: 28, b: 28, alpha: 1 };   // dark ring for light mode
const DARK_BG = { r: 230, g: 230, b: 230, alpha: 1 };  // light ring for dark mode

const SIZES = {
  'favicon-16x16.png': [16, 16],
  'favicon-32x32.png': [32, 32],
  'favicon-48x48.png': [48, 48],
  'apple-touch-icon.png': [180, 180],
  'android-chrome-36x36.png': [36, 36],
  'android-chrome-48x48.png': [48, 48],
  'android-chrome-72x72.png': [72, 72],
  'android-chrome-96x96.png': [96, 96],
  'android-chrome-144x144.png': [144, 144],
  'android-chrome-192x192.png': [192, 192],
  'android-chrome-256x256.png': [256, 256],
  'android-chrome-384x384.png': [384, 384],
  'android-chrome-512x512.png': [512, 512],
  'mstile-70x70.png': [70, 70],
  'mstile-144x144.png': [144, 144],
  'mstile-150x150.png': [150, 150],
  'mstile-310x150.png': [310, 150],
  'mstile-310x310.png': [310, 310],
  'yandex-browser-50x50.png': [50, 50],
};

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

function addBorder(pipeline, borderPx, bg) {
  return pipeline.extend({
    top: borderPx,
    bottom: borderPx,
    left: borderPx,
    right: borderPx,
    background: bg,
  });
}

async function loadAndPrepareVariants() {
  const buf = await readFile(SRC);
  const base = sharp(buf);
  const meta = await base.metadata();
  const w = meta.width || 512;
  const h = meta.height || 512;

  const resized = await base
    .png()
    .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const lightWithBorder = addBorder(sharp(resized), BORDER_LIGHT, LIGHT_BG);
  const darkWithBorder = addBorder(sharp(resized), BORDER_DARK, DARK_BG);

  return {
    light: sharp(await lightWithBorder.png().toBuffer()),
    dark: sharp(await darkWithBorder.png().toBuffer()),
  };
}

async function generateAll(variants) {
  await ensureDir(OUT_DIR);

  for (const [name, [width, height]] of Object.entries(SIZES)) {
    const baseName = name.replace('.png', '');
    const lightName = name;
    const darkName = `${baseName}-dark.png`;

    const resizeOpt = { width, height, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } };

    const lightBuf = await variants.light.clone().resize(width, height, resizeOpt).png().toBuffer();
    const darkBuf = await variants.dark.clone().resize(width, height, resizeOpt).png().toBuffer();

    await writeFile(path.join(OUT_DIR, lightName), lightBuf);
    await writeFile(path.join(OUT_DIR, darkName), darkBuf);
    console.log(`  ${lightName}, ${darkName}`);
  }

  const ico16 = await variants.light.clone().resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const ico32 = await variants.light.clone().resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const ico48 = await variants.light.clone().resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const icoBuf = await toIco([ico16, ico32, ico48]);
  await writeFile(path.join(OUT_DIR, 'favicon.ico'), icoBuf);
  await writeFile(path.join(ROOT, 'public', 'favicon.ico'), icoBuf);
  console.log('  favicon.ico (static/favicons + root)');
}

async function main() {
  console.log('Generating favicons from source image...');
  const variants = await loadAndPrepareVariants();
  await generateAll(variants);
  console.log('Done. Run npm run favicons after changing the source image.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
