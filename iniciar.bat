@echo off
cd /d "%~dp0"
echo Iniciando GIVAMIC ERP...
echo.
echo El sistema estara disponible en: http://localhost:5173
echo.
echo Presiona Ctrl+C para detener el servidor.
echo.
npm run dev
pause
