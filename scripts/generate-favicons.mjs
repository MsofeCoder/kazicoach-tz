/**
 * Generate favicon PNG set from SVG using headless Chromium or pure buffer math.
 *
 * Usage:  node scripts/generate-favicons.mjs
 * Output: public/favicon-16.png, public/favicon-32.png, public/favicon-48.png,
 *         public/apple-touch-icon.png (180x180)
 *
 * If @aspect-build/rules_js or sharp/canvas is unavailable, we fall back to
 * creating minimal valid PNGs with the correct dimensions. These placeholders
 * work but should be replaced with real assets before production launch.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

// ── Minimal PNG generator (no dependencies) ──────────────────────────────
// Produces a valid IHDR + IDAT + IEND PNG of any size.
function crc32(buf) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(buf) {
  let a = 1, b = 0;
  for (let i = 0; i < buf.length; i++) { a = (a + buf[i]) % 65521; b = (b + a) % 65521; }
  return ((b << 16) | a) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function deflateStore(data) {
  // Deflate stored (no compression) — valid, simplest
  const maxBlock = 65535;
  const blocks = [];
  let offset = 0;
  while (offset < data.length) {
    const remaining = data.length - offset;
    const blockSize = Math.min(remaining, maxBlock);
    const isFinal = offset + blockSize >= data.length ? 1 : 0;
    const header = Buffer.alloc(5);
    header.writeUInt8(isFinal);
    header.writeUInt16LE(blockSize, 1);
    header.writeUInt16LE(blockSize ^ 0xffff, 3);
    blocks.push(header, data.subarray(offset, offset + blockSize));
    offset += blockSize;
  }
  return Buffer.concat(blocks);
}

function createPNG(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Image data: each row starts with filter byte 0 (None)
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const idx = y * (width * 4 + 1) + 1 + x * 4;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = a;
    }
  }

  const compressed = deflateStore(raw);
  const idat = Buffer.concat([
    Buffer.from([0x78, 0x01]), // CMF + FLG
    compressed,
    Buffer.alloc(4), // Adler32
  ]);
  idat.writeUInt32BE(adler32(raw), idat.length - 4);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Shield shape (mask) for PNG favicons ─────────────────────────────────
function createShieldPNG(size, r, g, b) {
  // For simplicity, create a solid-color rounded-rect favicon
  // The SVG favicon handles the shield design; PNG is fallback
  return createPNG(size, size, r, g, b);
}

// ── Generate files ───────────────────────────────────────────────────────
const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
];

// Brand colors: green-900 #073c35
const R = 7, G = 60, B = 53;

for (const { name, size } of sizes) {
  const out = resolve(publicDir, name);
  if (!existsSync(out)) {
    writeFileSync(out, createShieldPNG(size, R, G, B));
    console.log(`✓ Created ${name} (${size}×${size})`);
  } else {
    console.log(`– Skipped ${name} (already exists)`);
  }
}

// ── Generate ICO (16 + 32 + 48 combined) ────────────────────────────────
function createICO(pngs) {
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type: ICO
  icoHeader.writeUInt16LE(pngs.length, 4); // image count

  const entries = [];
  let dataOffset = 6 + pngs.length * 16;

  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry[0] = size < 256 ? size : 0; // width
    entry[1] = size < 256 ? size : 0; // height
    entry[2] = 0;  // color palette
    entry[3] = 0;  // reserved
    entry.writeUInt16LE(1, 4);  // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8); // data size
    entry.writeUInt32LE(dataOffset, 12); // data offset
    entries.push(entry);
    dataOffset += data.length;
  }

  return Buffer.concat([icoHeader, ...entries, ...pngs.map(p => p.data)]);
}

const icoPngs = [16, 32, 48].map(size => ({
  size,
  data: createShieldPNG(size, R, G, B),
}));

const icoOut = resolve(publicDir, 'favicon.ico');
if (!existsSync(icoOut)) {
  writeFileSync(icoOut, createICO(icoPngs));
  console.log(`✓ Created favicon.ico (16+32+48)`);
} else {
  console.log(`– Skipped favicon.ico (already exists)`);
}

console.log('\nFavicon set generated. Replace PNG placeholders with branded assets before production launch.');
