# くるくる世界地球儀

小学生が3D地球儀を回しながら、世界の国を楽しく学べる React + Vite アプリです。
まなぶモード、クイズモード、難易度選択、30か国データ、PWA対応があります。

## 主な機能

- 3D地球儀の表示
- マウス・タッチで回転
- ズーム
- 30か国のピン表示
- 難易度選択
  - やさしい: 10か国
  - ふつう: 20か国
  - むずかしい: 30か国
- まなぶモード
  - ピンをタップすると国カードを表示
- クイズモード
  - 指定された国を探してピンをタップ
  - 正解数、挑戦数、連続正解数を表示
- PWA対応

## 開発中の起動方法

開発中は、プロジェクト直下の `index.html` を直接開きません。
Viteの開発サーバーを起動して表示します。

```bash
npm install
npm run dev
```

ターミナルに表示されたURLをブラウザで開きます。通常は次のURLです。

```text
http://localhost:5173/
```

5173番ポートが使われている場合は、別のURLが表示されることがあります。
その場合は、ターミナルに表示されたURLを開いてください。

Windowsでは、`start-dev.bat` をダブルクリックして起動することもできます。

## 完成版の確認方法

完成版は、ビルドしてからプレビューサーバーで確認します。

```bash
npm run build
npm run preview
```

通常は次のURLで確認できます。

```text
http://localhost:4173/
```

Windowsでは、`start-preview.bat` をダブルクリックすると、ビルドとプレビュー起動をまとめて実行できます。

## index.htmlを直接開いても表示されない理由

React + Vite アプリは、プロジェクト直下の `index.html` を直接ダブルクリックして開くものではありません。
`src/main.jsx` などの開発用ファイルは、Viteの開発サーバーやビルド処理を通して読み込まれます。

そのため、次のような `file://` のURLでプロジェクト直下の `index.html` を開くと、白い画面になることがあります。

```text
file:///C:/Users/Youit/codex/kurukuru-world-globe/index.html
```

使い分けは次の通りです。

- 開発中: `npm run dev`
- 完成版確認: `npm run build` → `npm run preview`
- Netlify公開後: 公開されたURLを普通に開く

なお、PWAやService Workerは `file://` では正しく動かないことがあります。
PWAを確認するときは、Netlifyなどに公開するか、ローカルサーバーで開いてください。

## GitHubにアップする方法

GitHubにアップする前に、次を確認してください。

```bash
npm install
npm run build
```

問題なければ、GitHub Desktop や VSCode の Source Control からコミットしてpushします。

コマンドで行う場合の例です。

```bash
git add .
git commit -m "Prepare globe app for Netlify"
git push
```

`node_modules` と `dist` はGitHubに含めません。`.gitignore` で除外しています。

## Netlifyで公開する方法

Netlifyでは、GitHubリポジトリを選び、次の設定で公開します。

```text
Build command: npm run build
Publish directory: dist
```

このプロジェクトには `netlify.toml` と `public/_redirects` を入れてあります。
ReactのSPAとして、リロード時に404になりにくい設定です。

## よくあるトラブル

### 白い画面になる

プロジェクト直下の `index.html` を直接開いている可能性があります。
開発中は `npm run dev`、完成版確認は `npm run build` → `npm run preview` を使ってください。

### npm run dev をしていない

PC再起動後は開発サーバーが止まっています。
もう一度 `npm run dev` を実行してください。

### ポート番号が5173以外になる

別のアプリが5173番を使っていると、Viteが別のURLを表示することがあります。
ターミナルに表示されたURLを開いてください。

### npm install していない

初回や `node_modules` がない場合は、先に実行します。

```bash
npm install
```

### PWAが動かない

PWAやService Workerは `file://` では動かないことがあります。
Netlify公開URL、または `npm run dev` / `npm run preview` のURLで確認してください。

## 次に追加するとよさそうな機能

- オフライン用の地球テクスチャ同梱
- 5問ごとの結果画面
- 国旗クイズ
- 首都クイズ
- 学習履歴の保存
