Set-Location "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp"

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

git add src/pages/Requerimientos.jsx src/components/layout/Sidebar.jsx

git commit -m "fix: flujo REQ - coord ops va directo a coord general + badge por rol + banner jefe directo"

git push givamic main

Write-Host "Push completado." -ForegroundColor Green
