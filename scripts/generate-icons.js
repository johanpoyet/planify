const sharp = require('sharp');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, '..', 'public', 'icons', 'icon-1024x1024.png');

async function generateIcons() {
  console.log('🎨 Génération des icônes à partir du logo...');
  
  for (const size of sizes) {
    const outputFile = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.png`);
    
    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✅ Créé: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Erreur pour ${size}x${size}:`, error.message);
    }
  }
  
  console.log('🎉 Toutes les icônes ont été générées !');
}

generateIcons().catch(console.error);
