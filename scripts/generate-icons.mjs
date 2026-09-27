// One-off placeholder PWA icon generator (solid rounded-square with a "U" mark).
// Run: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makeIcon(size) {
  const bg = [76, 76, 240]; // --accent
  const fg = [255, 255, 255];
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const margin = Math.round(size * 0.22);
  const barW = Math.max(2, Math.round(size * 0.11));
  const uLeft = margin;
  const uRight = size - margin;
  const uTop = margin;
  const uBottom = size - margin;
  const radius = Math.round(uRight - barW - (uLeft + barW)) / 2;

  for (let y = 0; y < size; y++) {
    let rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter type none
    for (let x = 0; x < size; x++) {
      let isU = false;
      const inLeftBar = x >= uLeft && x < uLeft + barW && y >= uTop && y < uBottom - radius * 0.5;
      const inRightBar = x >= uRight - barW && x < uRight && y >= uTop && y < uBottom - radius * 0.5;
      const cx = (uLeft + uRight) / 2;
      const cy = uBottom - radius * 0.5;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ringOuter = (uRight - uLeft) / 2;
      const ringInner = ringOuter - barW;
      const inArc = y >= cy && dist <= ringOuter && dist >= ringInner;
      isU = inLeftBar || inRightBar || inArc;

      const color = isU ? fg : bg;
      const idx = rowStart + 1 + x * 4;
      raw[idx] = color[0];
      raw[idx + 1] = color[1];
      raw[idx + 2] = color[2];
      raw[idx + 3] = 255;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw);
  const png = Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return png;
}

writeFileSync("public/icon-192.png", makeIcon(192));
writeFileSync("public/icon-512.png", makeIcon(512));
console.log("Icons generated.");
