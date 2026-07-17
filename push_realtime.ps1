Set-Location "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp"

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

# Solucion permanente: desactivar conversion de line endings en este repo
git config core.autocrlf false

# Refrescar el index para que git detecte todos los cambios reales
git add -A

git status

git commit -m "feat: Supabase Realtime - sincronizacion en tiempo real entre usuarios"

git push givamic main

Write-Host "Push completado." -ForegroundColor Green
