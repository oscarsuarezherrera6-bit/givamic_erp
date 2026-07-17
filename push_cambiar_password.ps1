Set-Location "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp"

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

git add src/lib/supabase.js src/pages/RolesPermisos.jsx
git commit -m "feat: cambiar contrasena de usuarios desde Roles y Permisos"
git push givamic main

Write-Host "Push completado." -ForegroundColor Green
