Set-Location $PSScriptRoot

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

git add public/icon-192.png public/icon-512.png public/apple-touch-icon.png public/apple-touch-icon-precomposed.png
git commit -m "feat: icono app solo triangulo sin texto"
git push givamic main

Write-Host "Push completado." -ForegroundColor Green
