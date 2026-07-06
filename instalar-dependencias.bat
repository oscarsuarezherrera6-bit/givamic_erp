@echo off
echo ========================================
echo  GIVAMIC ERP - Instalando dependencias
echo ========================================
cd /d "%~dp0"
echo.
echo Instalando pdfjs-dist y todas las dependencias...
npm install
echo.
echo ========================================
echo  Listo! Iniciando servidor de desarrollo
echo ========================================
npm run dev
pause
