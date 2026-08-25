const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Disable sharp file cache to prevent file locking on Windows
sharp.cache(false);

const mediaDir = path.join(__dirname, '..', 'public', 'media');

async function getFiles(dir) {
  const subdirs = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = path.resolve(dir, subdir.name);
    return subdir.isDirectory() ? getFiles(res) : res;
  }));
  return files.flat();
}

async function optimizeMedia() {
  const files = await getFiles(mediaDir);
  console.log(`Found ${files.length} total files in media directory.`);

  let totalBefore = 0;
  let totalAfter = 0;
  let count = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

    const stats = await fs.promises.stat(filePath);
    const sizeBefore = stats.size;
    totalBefore += sizeBefore;

    const isThumb = filePath.toLowerCase().includes('thumb');
    const maxWidth = isThumb ? 400 : 1920;
    const quality = isThumb ? 75 : 80;

    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      const image = sharp(fileBuffer);
      const metadata = await image.metadata();

      let pipeline = sharp(fileBuffer);

      if (metadata.width && metadata.width > maxWidth) {
        pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
      }

      let buffer;
      if (ext === '.png') {
        buffer = await pipeline.png({ quality, compressionLevel: 9 }).toBuffer();
      } else {
        buffer = await pipeline.jpeg({ quality, progressive: true, mozjpeg: true }).toBuffer();
      }

      if (buffer.length < sizeBefore) {
        await fs.promises.writeFile(filePath, buffer);
        totalAfter += buffer.length;
        count++;
        console.log(`Optimized ${path.relative(mediaDir, filePath)}: ${(sizeBefore / 1024 / 1024).toFixed(2)}MB -> ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);
      } else {
        totalAfter += sizeBefore;
      }
    } catch (err) {
      console.error(`Error optimizing ${filePath}:`, err.message);
      totalAfter += sizeBefore;
    }
  }

  console.log(`\nOptimization Complete!`);
  console.log(`Processed ${count} files.`);
  console.log(`Total size before: ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total size after:  ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved: ${((totalBefore - totalAfter) / 1024 / 1024).toFixed(2)} MB`);
}

optimizeMedia();
