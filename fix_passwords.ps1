Set-Location $PSScriptRoot

$SERVICE_ROLE_KEY = Read-Host "Pega aqui tu service_role key y presiona Enter"

$SUPABASE_URL = "https://wzvlqjsjptyqhgdzilgz.supabase.co"

$headers = @{
    "apikey"        = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type"  = "application/json"
}

$passwords = @{
    "admin@givamic.pe"           = "admin123"
    "logistica@givamic.pe"       = "logistica123"
    "administradora@givamic.pe"  = "empresa123"
    "contador@givamic.pe"        = "conta123"
    "coord.general@givamic.pe"   = "coordgen123"
    "coord.ops@givamic.pe"       = "coordops123"
    "jefe.rrhh@givamic.pe"       = "jrrhh123"
    "asist.rrhh@givamic.pe"      = "arrhh123"
    "asist.log@givamic.pe"       = "alog123"
    "facturacion@givamic.pe"     = "factura123"
    "auditor@givamic.pe"         = "auditor123"
    "soma@givamic.pe"            = "soma123"
    "pluna@givamic.pe"           = "pluna123"
    "gerencia@givamic.pe"        = "gerencia123"
}

Write-Host "Obteniendo usuarios..." -ForegroundColor Cyan

try {
    $resp = Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/admin/users?per_page=50" `
        -Headers $headers -Method GET
    $users = $resp.users
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Actualizando $($users.Count) usuarios..." -ForegroundColor Cyan

foreach ($user in $users) {
    $email = $user.email
    if ($passwords.ContainsKey($email)) {
        $body = @{ password = $passwords[$email] } | ConvertTo-Json
        try {
            Invoke-RestMethod -Uri "$SUPABASE_URL/auth/v1/admin/users/$($user.id)" `
                -Headers $headers -Method PATCH -Body $body | Out-Null
            Write-Host "  OK  $email" -ForegroundColor Green
        } catch {
            Write-Host "  ERR $email : $_" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Listo! Entra con admin@givamic.pe / admin123" -ForegroundColor Cyan
