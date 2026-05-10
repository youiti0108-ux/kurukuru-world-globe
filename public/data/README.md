# 日本地図データの出典

- 都道府県境界: `open-data-jp-prefectures-geojson`（MIT License）
  - https://github.com/piuccio/open-data-jp-prefectures-geojson
  - 元データ: 国土数値情報（行政区域データ）

`japan-prefectures.geojson` は、スマホでも読み込みやすいように都道府県境界を軽量化した静的GeoJSONです。再生成する場合は、プロジェクト直下で次を実行します。

```bash
npm run build:japan-boundaries
```

日本地図モードの背景画像は `public/assets/japan-satellite.svg` にある自作SVGです。Google Earth / Google Maps の画像や外部地図タイルは使っていません。

画面上の県境ラインとピン座標は、同じGeoJSONから `src/japanMapPaths.js` に生成したSVG座標を使っています。背景・県境・ピンをまとめて再生成する場合は次を実行します。

```bash
npm run build:japan-map
```
