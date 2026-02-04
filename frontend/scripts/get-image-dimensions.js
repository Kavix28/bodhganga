import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read PNG file and extract dimensions from header
function getPNGDimensions(filePath) {
    const buffer = fs.readFileSync(filePath);

    // PNG signature check
    if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
        throw new Error('Not a valid PNG file');
    }

    // Width and height are at bytes 16-23 in IHDR chunk
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    return { width, height };
}

const imagePath = path.join(__dirname, '../src/assets/images/india-map-accurate.png');
const dims = getPNGDimensions(imagePath);

console.log(`Image Dimensions:`);
console.log(`Width: ${dims.width}px`);
console.log(`Height: ${dims.height}px`);
console.log(`Aspect Ratio: ${(dims.width / dims.height).toFixed(3)}`);
console.log(`\nSVG viewBox: "0 0 ${dims.width} ${dims.height}"`);
