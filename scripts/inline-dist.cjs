const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

let html = fs.readFileSync(indexPath, 'utf8');

html = html.replace(
  /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
  (_, href) => {
    const cssPath = path.join(distDir, href.replace(/^\.\//, '').replace(/^\//, ''));
    const css = fs.readFileSync(cssPath, 'utf8');
    return `<style>\n${css}\n</style>`;
  },
);

html = html.replace(
  /<script type="module" crossorigin src="([^"]+)"><\/script>/g,
  (_, src) => {
    const jsPath = path.join(distDir, src.replace(/^\.\//, '').replace(/^\//, ''));
    const js = fs.readFileSync(jsPath, 'utf8');
    return `<script type="module">\n${js}\n</script>`;
  },
);

fs.writeFileSync(indexPath, html, 'utf8');

const assetDir = path.join(distDir, 'assets');
const sizeKb = Math.round(fs.statSync(indexPath).size / 1024);
console.log(`Inlined build assets into dist/index.html (${sizeKb} KB).`);
console.log(`The original generated files remain in ${assetDir}.`);
