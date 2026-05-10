const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const rootDir = path.resolve(__dirname, '..');
const geoJsonPath = path.join(rootDir, 'public', 'data', 'japan-prefectures.geojson');
const prefecturesPath = path.join(rootDir, 'src', 'prefectures.js');
const outputPath = path.join(rootDir, 'src', 'japanMapPaths.js');

const bounds = {
  west: 122,
  east: 154.5,
  south: 24,
  north: 46,
};

const width = 1600;
const height = 1467;

const regionDefinitions = [
  {
    id: 'hokkaido',
    label: '北海道地方',
    color: '#75d7ff',
    prefectures: ['hokkaido'],
  },
  {
    id: 'tohoku',
    label: '東北地方',
    color: '#5b9dff',
    prefectures: ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima'],
  },
  {
    id: 'kanto',
    label: '関東地方',
    color: '#ffe36e',
    prefectures: ['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa'],
  },
  {
    id: 'chubu',
    label: '中部地方',
    color: '#7ee08f',
    prefectures: ['niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi'],
  },
  {
    id: 'kinki',
    label: '近畿地方',
    color: '#c89cff',
    prefectures: ['mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama'],
  },
  {
    id: 'chugoku',
    label: '中国地方',
    color: '#ffb45f',
    prefectures: ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi'],
  },
  {
    id: 'shikoku',
    label: '四国地方',
    color: '#ff96c8',
    prefectures: ['tokushima', 'kagawa', 'ehime', 'kochi'],
  },
  {
    id: 'kyushu-okinawa',
    label: '九州・沖縄地方',
    color: '#ff7777',
    prefectures: ['fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa'],
  },
];

function mercatorY(lat) {
  const rad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

const northY = mercatorY(bounds.north);
const southY = mercatorY(bounds.south);

function project(lng, lat) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * width;
  const y = ((northY - mercatorY(lat)) / (northY - southY)) * height;
  return [Number(x.toFixed(2)), Number(y.toFixed(2))];
}

function ringPath(ring) {
  return ring
    .map(([lng, lat], index) => {
      const [x, y] = project(lng, lat);
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

function coordinateKey([lng, lat]) {
  return `${lng.toFixed(5)},${lat.toFixed(5)}`;
}

function segmentKey(start, end) {
  const startKey = coordinateKey(start);
  const endKey = coordinateKey(end);
  return startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`;
}

function addRingSegments(ring, segmentMap) {
  for (let index = 0; index < ring.length - 1; index += 1) {
    const start = ring[index];
    const end = ring[index + 1];
    const key = segmentKey(start, end);
    const current = segmentMap.get(key);

    if (current) {
      current.count += 1;
    } else {
      segmentMap.set(key, { count: 1, start, end });
    }
  }
}

function addGeometrySegments(geometry, segmentMap) {
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach((ring) => addRingSegments(ring, segmentMap));
    return;
  }

  if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => {
      polygon.forEach((ring) => addRingSegments(ring, segmentMap));
    });
  }
}

function segmentsToPath(segments) {
  return segments
    .map(({ start, end }) => {
      const [startX, startY] = project(start[0], start[1]);
      const [endX, endY] = project(end[0], end[1]);
      return `M${startX} ${startY} L${endX} ${endY}`;
    })
    .join(' ');
}

(async () => {
  const geojson = JSON.parse(fs.readFileSync(geoJsonPath, 'utf8'));
  const { prefectures } = await import(pathToFileURL(prefecturesPath).href);

  const paths = geojson.features.map((feature) => ({
    id: feature.properties.id,
    name: feature.properties.name,
    d: geometryPath(feature.geometry),
  }));

  const featureById = new Map(geojson.features.map((feature) => [feature.properties.id, feature]));

  const regionOutlines = regionDefinitions.map((region) => {
    const segmentMap = new Map();

    region.prefectures.forEach((prefectureId) => {
      const feature = featureById.get(prefectureId);
      if (!feature) {
        throw new Error(`Missing prefecture feature for region outline: ${prefectureId}`);
      }
      addGeometrySegments(feature.geometry, segmentMap);
    });

    const outerSegments = Array.from(segmentMap.values()).filter((segment) => segment.count === 1);

    return {
      id: region.id,
      label: region.label,
      color: region.color,
      d: segmentsToPath(outerSegments),
    };
  });

  const pins = prefectures.map((prefecture) => {
    const [x, y] = project(prefecture.lng, prefecture.lat);
    return {
      id: prefecture.id,
      name: prefecture.name,
      x,
      y,
    };
  });

  const output = `// Generated by scripts/build-japan-map-paths.cjs. Do not edit by hand.
export const JAPAN_MAP_VIEWBOX = {
  width: ${width},
  height: ${height},
  bounds: ${JSON.stringify(bounds)},
};

export const japanPrefecturePaths = ${JSON.stringify(paths)};

export const japanRegionOutlines = ${JSON.stringify(regionOutlines)};

export const japanPrefecturePins = ${JSON.stringify(pins)};
`;

  fs.writeFileSync(outputPath, output);
  console.log(`Wrote ${outputPath}`);
  console.log(`Paths: ${paths.length}`);
  console.log(`Region outlines: ${regionOutlines.length}`);
  console.log(`Pins: ${pins.length}`);
})();
