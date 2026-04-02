const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const inputFile = path.join(__dirname, 'css_picker', 'content.js');
const outputDir = path.join(__dirname, 'css_picker', 'dist');
const outputFile = path.join(outputDir, 'content.js');

// Ensure dist directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

esbuild
  .build({
    entryPoints: [inputFile],
    bundle: true,
    outfile: outputFile,
    sourcemap: true,
    platform: 'browser',
    target: 'es2020',
    external: ['chrome'], // chrome API is global, don't bundle it
  })
  .then(() => {
    console.log('✅ Extension bundled successfully!');
    console.log(`   Input: ${inputFile}`);
    console.log(`   Output: ${outputFile}`);
    console.log(`   Map: ${outputFile}.map`);
  })
  .catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
  });
