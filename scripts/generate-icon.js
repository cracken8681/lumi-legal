const sharp = require('sharp');
const fs = require('fs');

const sizes = [
  { name: 'icon.png', size: 1024 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-192.png', size: 192 },
  { name: 'adaptive-icon.png', size: 1024 },
  { name: 'splash-icon.png', size: 200 },
];

async function generate() {
  const svgBuffer = fs.readFileSync('assets/icon.svg');
  for (const { name, size } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(`assets/${name}`);
    console.log(`Generated assets/${name} (${size}x${size})`);
  }
}

generate().catch(console.error);
