const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const inputPath = path.join(rootDir, 'public', 'data', 'japan-prefectures.geojson');
const outputPath = path.join(rootDir, 'public', 'assets', 'japan-satellite.svg');

const bounds = {
  west: 122,
  east: 154.5,
  south: 24,
  north: 46,
};

const width = 1600;
const height = 1467;

function mercatorY(lat) {
  const rad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

const northY = mercatorY(bounds.north);
const southY = mercatorY(bounds.south);

function project([lng, lat]) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * width;
  const y = ((northY - mercatorY(lat)) / (northY - southY)) * height;
  return [Number(x.toFixed(2)), Number(y.toFixed(2))];
}

function ringPath(ring) {
  return ring
    .map((point, index) => {
      const [x, y] = project(point);
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join(' ');
}

function polygonPath(polygon) {
  return `${polygon.map(ringPath).join(' ')} Z`;
}

function geometryPath(geometry) {
  if (geometry.type === 'Polygon') {
    return polygonPath(geometry.coordinates);
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map(polygonPath).join(' ');
  }

  return '';
}

const geojson = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const landPaths = geojson.features
  .map((feature, index) => {
    const hue = 96 + (index % 7) * 7;
    const light = 30 + (index % 5) * 3;
    const fill = `hsl(${hue} 34% ${light}%)`;
    return `<path d="${geometryPath(feature.geometry)}" fill="${fill}" opacity="0.9" />`;
  })
  .join('\n      ');

const highlightPaths = geojson.features
  .map(
    (feature, index) =>
      `<path d="${geometryPath(feature.geometry)}" fill="url(#landHighlight)" opacity="${0.2 + (index % 4) * 0.04}" />`,
  )
  .join('\n      ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="衛星写真風の日本列島背景">
  <defs>
    <linearGradient id="oceanGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#082654" />
      <stop offset="48%" stop-color="#0b4d79" />
      <stop offset="100%" stop-color="#061d42" />
    </linearGradient>
    <radialGradient id="oceanGlow" cx="48%" cy="42%" r="62%">
      <stop offset="0%" stop-color="#35a4d0" stop-opacity="0.34" />
      <stop offset="58%" stop-color="#0c6090" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#0a2b58" stop-opacity="0.1" />
    </radialGradient>
    <linearGradient id="landHighlight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#c9d99a" stop-opacity="0.62" />
      <stop offset="46%" stop-color="#416f39" stop-opacity="0.46" />
      <stop offset="100%" stop-color="#8a6742" stop-opacity="0.48" />
    </linearGradient>
    <filter id="terrainNoise" x="-8%" y="-8%" width="116%" height="116%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.028" numOctaves="5" seed="31" result="noise" />
      <feColorMatrix in="noise" type="matrix" values="0.35 0 0 0 0.08  0 0.45 0 0 0.14  0 0 0.25 0 0.05  0 0 0 0.5 0" result="terrain" />
      <feBlend in="SourceGraphic" in2="terrain" mode="multiply" />
    </filter>
    <filter id="coastGlow" x="-4%" y="-4%" width="108%" height="108%">
      <feGaussianBlur stdDeviation="2.4" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.65  0 0 0 0 0.9  0 0 0 0 1  0 0 0 0.55 0" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#oceanGradient)" />
  <rect width="${width}" height="${height}" fill="url(#oceanGlow)" />
  <g filter="url(#coastGlow)" opacity="0.55">
      ${geojson.features
        .map((feature) => `<path d="${geometryPath(feature.geometry)}" fill="none" stroke="#a9eaff" stroke-width="4" stroke-linejoin="round" />`)
        .join('\n      ')}
  </g>
  <g filter="url(#terrainNoise)">
      ${landPaths}
  </g>
  <g style="mix-blend-mode:screen">
      ${highlightPaths}
  </g>
</svg>
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, svg);

const sizeKb = Math.round(fs.statSync(outputPath).size / 1024);
console.log(`Wrote ${outputPath}`);
console.log(`Size: ${sizeKb} KB`);
