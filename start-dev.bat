@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo  くるくる世界地球儀 - 開発モード
echo ========================================
echo.
echo 初回だけ、または node_modules がない場合は npm install が必要です。
echo この画面でエラーが出た場合は、先に npm install を実行してください。
echo.
echo 開発サーバーを起動します。
echo 表示された http://localhost:5173/ などのURLをブラウザで開いてください。
echo 終了するときは、この画面で Ctrl + C を押してください。
echo.
npm run dev
pause
