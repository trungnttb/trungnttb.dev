// Renders the logo SVGs in brand/ to the PNG/ICO sizes browsers, app stores and social sites ask for.
// Run: pnpm brand
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const OUT = 'public/brand';
const ICON_SIZES = [16, 32, 48, 64, 128, 180, 192, 256, 512, 1024];
const MARK_SIZES = [128, 256, 512, 1024];
const BACKGROUND = '#1b1411';

async function render(svgPath, size, file, { padding = 0 } = {}) {
  const svg = await readFile(svgPath);
  const inner = Math.round(size * (1 - padding * 2));
  let image = sharp(svg, { density: 72 * (inner / 32) * 2 }).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (padding > 0) {
    const offset = Math.round((size - inner) / 2);
    image = sharp({ create: { width: size, height: size, channels: 4, background: BACKGROUND } })
      .composite([{ input: await image.png().toBuffer(), left: offset, top: offset }]);
  }
  const buffer = await image.png({ compressionLevel: 9 }).toBuffer();
  await writeFile(`${OUT}/${file}`, buffer);
  return buffer;
}

/** ICO container holding PNG frames (supported by every current browser and Windows Vista+). */
function ico(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  const entries = [];
  let offset = 6 + frames.length * 16;
  for (const { size, data } of frames) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...frames.map((f) => f.data)]);
}

await mkdir(OUT, { recursive: true });
const icons = {};
for (const size of ICON_SIZES) icons[size] = await render('brand/logo.svg', size, `logo-${size}.png`);
// Android masks icons to a circle; keep the cup inside the central 80% safe zone.
await render('brand/logo-mark.svg', 512, 'logo-maskable-512.png', { padding: 0.2 });
for (const size of MARK_SIZES) {
  await render('brand/logo-mark.svg', size, `logo-mark-light-${size}.png`);
  await render('brand/logo-mark-dark.svg', size, `logo-mark-dark-${size}.png`);
}
await writeFile('public/favicon.ico', ico([16, 32, 48].map((size) => ({ size, data: icons[size] }))));
await writeFile('public/apple-touch-icon.png', icons[180]);
console.log(`wrote ${ICON_SIZES.length} icons, ${MARK_SIZES.length * 2} marks, maskable, favicon.ico, apple-touch-icon.png`);
