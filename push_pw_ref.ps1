Set-Location "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp"

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

git add src/pages/RolesPermisos.jsx src/lib/supabase.js
git commit -m "fix: usar fetch directo para admin API de contrasenas"
git push givamic main

Write-Host "Push completado." -ForegroundColor Green
