const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const inputPath = path.join(
  rootDir,
  'node_modules',
  'open-data-jp-prefectures-geojson',
  'output',
  'prefectures.geojson',
);
const outputPath = path.join(rootDir, 'public', 'data', 'japan-prefectures.geojson');
const tolerance = Number(process.argv[2] ?? 0.012);
const minRingArea = Number(process.argv[3] ?? 0.00002);

const prefectureIds = new Map([
  ['北海道', 'hokkaido'],
  ['青森県', 'aomori'],
  ['岩手県', 'iwate'],
  ['宮城県', 'miyagi'],
  ['秋田県', 'akita'],
  ['山形県', 'yamagata'],
  ['福島県', 'fukushima'],
  ['茨城県', 'ibaraki'],
  ['栃木県', 'tochigi'],
  ['群馬県', 'gunma'],
  ['埼玉県', 'saitama'],
  ['千葉県', 'chiba'],
  ['東京都', 'tokyo'],
  ['神奈川県', 'kanagawa'],
  ['新潟県', 'niigata'],
  ['富山県', 'toyama'],
  ['石川県', 'ishikawa'],
  ['福井県', 'fukui'],
  ['山梨県', 'yamanashi'],
  ['長野県', 'nagano'],
  ['岐阜県', 'gifu'],
  ['静岡県', 'shizuoka'],
  ['愛知県', 'aichi'],
  ['三重県', 'mie'],
  ['滋賀県', 'shiga'],
  ['京都府', 'kyoto'],
  ['大阪府', 'osaka'],
  ['兵庫県', 'hyogo'],
  ['奈良県', 'nara'],
  ['和歌山県', 'wakayama'],
  ['鳥取県', 'tottori'],
  ['島根県', 'shimane'],
  ['岡山県', 'okayama'],
  ['広島県', 'hiroshima'],
  ['山口県', 'yamaguchi'],
  ['徳島県', 'tokushima'],
  ['香川県', 'kagawa'],
  ['愛媛県', 'ehime'],
  ['高知県', 'kochi'],
  ['福岡県', 'fukuoka'],
  ['佐賀県', 'saga'],
  ['長崎県', 'nagasaki'],
  ['熊本県', 'kumamoto'],
  ['大分県', 'oita'],
  ['宮崎県', 'miyazaki'],
  ['鹿児島県', 'kagoshima'],
  ['沖縄県', 'okinawa'],
]);

function sqDist(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function sqSegDist(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyRadial(points, sqTolerance) {
  let previous = points[0];
  const simplified = [previous];

  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (sqDist(point, previous) > sqTolerance) {
      simplified.push(point);
      previous = point;
    }
  }

  if (previous !== points[points.length - 1]) {
    simplified.push(points[points.length - 1]);
  }

  return simplified;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
  let maxSqDist = sqTolerance;
  let index = -1;

  for (let i = first + 1; i < last; i += 1) {
    const sqDistance = sqSegDist(points[i], points[first], points[last]);
    if (sqDistance > maxSqDist) {
      index = i;
      maxSqDist = sqDistance;
    }
  }

  if (index !== -1) {
    if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
    simplified.push(points[index]);
    if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
  }
}

function simplifyDouglasPeucker(points, sqTolerance) {
  const last = points.length - 1;
  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);
  return simplified;
}

function simplify(points) {
  if (points.length <= 3) return points;
  const sqTolerance = tolerance * tolerance;
  return simplifyDouglasPeucker(simplifyRadial(points, sqTolerance), sqTolerance);
}

function ringArea(ring) {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    area += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  }
  return Math.abs(area / 2);
}

function closeRing(ring) {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

function simplifyRing(ring, isOuterRing) {
  const openRing = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring.slice(0, -1)
    : ring;
  const simplified = closeRing(simplify(openRing));

  if (simplified.length < 4) return null;
  if (!isOuterRing && ringArea(simplified) < minRingArea) return null;

  return simplified.map(([lng, lat]) => [
    Number(lng.toFixed(5)),
    Number(lat.toFixed(5)),
  ]);
}

function simplifyPolygon(polygon) {
  const rings = polygon
    .map((ring, index) => simplifyRing(ring, index === 0))
    .filter(Boolean);
  return rings.length > 0 ? rings : null;
}

function simplifyGeometry(geometry) {
  if (geometry.type === 'Polygon') {
    const polygon = simplifyPolygon(geometry.coordinates);
    return polygon ? { type: 'Polygon', coordinates: polygon } : null;
  }

  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates
      .map((polygon) => simplifyPolygon(polygon))
      .filter(Boolean);
    return polygons.length > 0 ? { type: 'MultiPolygon', coordinates: polygons } : null;
  }

  return null;
}

function countCoordinates(geometry) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.flat(1).length;
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flat(2).length;
  }

  return 0;
}

if (!fs.existsSync(inputPath)) {
  throw new Error(`Boundary source not found: ${inputPath}`);
}

const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
let coordinateCount = 0;

const features = source.features.map((feature) => {
  const name = feature.properties.P;
  const geometry = simplifyGeometry(feature.geometry);
  if (!geometry) throw new Error(`Failed to simplify geometry for ${name}`);
  coordinateCount += countCoordinates(geometry);

  return {
    type: 'Feature',
    properties: {
      id: prefectureIds.get(name) ?? name,
      name,
    },
    geometry,
  };
});

const output = {
  type: 'FeatureCollection',
  name: 'japan-prefectures-simplified',
  source:
    'open-data-jp-prefectures-geojson (MIT), based on National Land Numerical Information administrative area data.',
  simplification: {
    method: 'Douglas-Peucker',
    toleranceDegrees: tolerance,
    minRingAreaDegrees: minRingArea,
  },
  features,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output)}\n`);

const sizeKb = Math.round(fs.statSync(outputPath).size / 1024);
console.log(`Wrote ${outputPath}`);
console.log(`Features: ${features.length}`);
console.log(`Coordinates: ${coordinateCount}`);
console.log(`Size: ${sizeKb} KB`);
