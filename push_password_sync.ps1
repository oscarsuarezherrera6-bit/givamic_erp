Set-Location "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp"

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

git add src/pages/RolesPermisos.jsx src/pages/Perfil.jsx

git commit -m "fix: cambio de contrasena via RPC SQL + sync Perfil con Supabase Auth"

git push givamic main

Write-Host "Push completado." -ForegroundColor Green
