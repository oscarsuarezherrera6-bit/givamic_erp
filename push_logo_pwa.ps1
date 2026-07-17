Set-Location "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp"

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

git add public/icon-192.png public/icon-512.png public/favicon.png
git commit -m "fix: reemplazar icono PWA con logo GIVAMIC"
git push givamic main

Write-Host "Push completado." -ForegroundColor Green
