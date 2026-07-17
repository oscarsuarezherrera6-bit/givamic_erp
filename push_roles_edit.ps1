Set-Location "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp"

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

git add src/pages/RolesPermisos.jsx src/pages/Requerimientos.jsx

git commit -m "feat: editar nombre y rol de usuario + roles Jefe SOMA/SIG y Asistente SOMA/RRHH"

git push givamic main

Write-Host "Push completado." -ForegroundColor Green
