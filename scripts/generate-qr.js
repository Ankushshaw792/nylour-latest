import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target deep link URL
const targetUrl = process.argv[2] || 'https://nylour.netlify.app';

// Output path inside the public/ folder of the Vite project
const outputPath = path.resolve(__dirname, '../public/qr-code.png');

console.log(`Generating QR code for: ${targetUrl}...`);

// Generate high-resolution clean QR code image
QRCode.toFile(outputPath, targetUrl, {
  errorCorrectionLevel: 'H', // High error correction for reliable scanning
  type: 'png',
  width: 512, // High resolution (512x512)
  margin: 4,  // Clean white margin border
  color: {
    dark: '#000000',  // Black modules
    light: '#FFFFFF'  // White background
  }
}, (err) => {
  if (err) {
    console.error('Error generating QR code:', err);
    process.exit(1);
  }
  console.log(`Success! Ad-free QR code saved to: ${outputPath}`);
});
