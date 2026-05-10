# ローカル地図背景

`japan-satellite.svg` は、`public/data/japan-prefectures.geojson` の都道府県形状から生成した自作の衛星写真風SVGです。

- Google Earth / Google Maps の画像は使っていません。
- 外部地図タイルに依存せず、Netlifyやローカルプレビューで同じ背景を表示できます。
- 再生成する場合は、プロジェクト直下で次を実行します。

```bash
npm run build:japan-background
```

背景画像・県境ライン・47都道府県ピンを同じSVG座標でそろえる場合は、次を実行します。

```bash
npm run build:japan-map
```
