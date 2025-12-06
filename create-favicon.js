const sharp = require('sharp');
const path = require('path');

// Create a simplified BM logo as favicon (just the letters/icon part)
// Using the primary color from the SVG: #2746A1
const faviconSvg = `
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="white"/>
  <path d="M30 100C30 80 45 65 65 65C75 65 83 72 85 82L75 87C74 80 69 75 65 75C52 75 43 85 43 100C43 115 52 125 65 125C69 125 74 120 75 113L85 118C83 128 75 135 65 135C45 135 30 120 30 100Z" fill="#2746A1"/>
  <path d="M110 65L128 102L146 65L160 65L135 115V135H122V115L97 65H110Z" fill="#2746A1"/>
  <path d="M180 75H210V85H180V110H215V120H167V65H215V75H180V75Z" fill="#2746A1"/>
</svg>
`;

(async () => {
  try {
    await sharp(Buffer.from(faviconSvg))
      .resize(32, 32, { fit: 'contain', background: 'white' })
      .ico()
      .toFile(path.join(__dirname, 'app', 'favicon.ico'));
    
    console.log('✓ favicon.ico created successfully');
  } catch (err) {
    console.error('Error creating favicon:', err);
    process.exit(1);
  }
})();
