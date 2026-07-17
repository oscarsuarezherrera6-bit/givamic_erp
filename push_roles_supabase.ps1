Set-Location $PSScriptRoot

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

git add src/pages/RolesPermisos.jsx
git commit -m "feat: crear usuarios en Supabase Auth desde Roles y Permisos"
git push givamic main

Write-Host "Push completado." -ForegroundColor Green
