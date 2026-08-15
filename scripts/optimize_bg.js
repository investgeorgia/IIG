const sharp = require('sharp');
const path = require('path');

const inputPath = 'C:\\Users\\Nadia\\Downloads\\Georgia pictures\\DJI_0182.jpg';
const outputPath = path.join(__dirname, '..', 'public', 'ips-bg.webp');

sharp(inputPath)
  .resize(1920) // Resize to max-width 1920px (standard full HD)
  .webp({ quality: 80 }) // Convert to webp with 80% quality
  .toFile(outputPath)
  .then(info => {
    console.log('Successfully optimized and saved image:', info);
  })
  .catch(err => {
    console.error('Error optimizing image:', err);
  });
