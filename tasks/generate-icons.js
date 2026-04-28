const fs = require('fs');

function createPNG(width, height, color) {
  const zlib = require('zlib');

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const typeBuffer = Buffer.from(type);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(crcData) >>> 0);
    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      rawData.push(color.r, color.g, color.b);
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, createChunk('IHDR', ihdr), idat, iend]);
}

const icon192 = createPNG(192, 192, { r: 107, g: 107, b: 107 });
const icon512 = createPNG(512, 512, { r: 107, g: 107, b: 107 });

fs.writeFileSync('icon-192.png', icon192);
fs.writeFileSync('icon-512.png', icon512);

console.log('Icons generated');
