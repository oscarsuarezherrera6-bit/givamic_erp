# ============================================================
# GIVAMIC — Script de activacion Supabase
# Ejecutar desde PowerShell en la carpeta del proyecto
# ============================================================
# PASO 1: Eliminar locks de git (si existen)
Remove-Item "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp\.git\index.lock" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp\.git\HEAD.lock"  -Force -ErrorAction SilentlyContinue

# PASO 2: Ir al repositorio
Set-Location "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp"

# PASO 3: Hacer staging solo de los archivos Supabase
git add package.json
git add src/lib/supabase.js
git add src/context/AppContext.jsx
git add src/context/AuthContext.jsx
git add src/pages/Login.jsx
git add supabase/migrations/001_schema.sql
git add supabase/migrations/002_seed_users.sql
git add .env.example

# PASO 4: Commit
git commit -m "feat: integracion Supabase - auth segura + persistencia en nube (con fallback localStorage)"

# PASO 5: Push a Vercel
git push givamic main

Write-Host ""
Write-Host "LISTO - Vercel esta desplegando los cambios." -ForegroundColor Green
Write-Host "Proximos pasos: ver SUPABASE_SETUP.md para activar Supabase." -ForegroundColor Cyan
