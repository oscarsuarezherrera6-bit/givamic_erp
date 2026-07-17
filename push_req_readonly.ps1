Set-Location "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp"

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

git add src/pages/Requerimientos.jsx
git commit -m "fix: campos responsable y area readonly en nuevo REQ"
git push givamic main

Write-Host "Push completado." -ForegroundColor Green
