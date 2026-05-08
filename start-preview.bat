@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo  くるくる世界地球儀 - 完成版プレビュー
echo ========================================
echo.
echo 完成版をビルドしてから、プレビューサーバーを起動します。
echo 表示された http://localhost:4173/ などのURLをブラウザで開いてください。
echo 終了するときは、この画面で Ctrl + C を押してください。
echo.
npm run build
if errorlevel 1 (
  echo.
  echo ビルドに失敗しました。エラー内容を確認してください。
  pause
  exit /b 1
)
echo.
npm run preview
pause
