Set-Location $PSScriptRoot

Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

git add src/App.jsx
git commit -m "fix: corregir case-sensitivity import EPPs.jsx (Linux build)"
git push givamic main

Write-Host "Push completado. Vercel redesplegara automaticamente." -ForegroundColor Green
