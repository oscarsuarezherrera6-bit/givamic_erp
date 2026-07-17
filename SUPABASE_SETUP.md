# GIVAMIC — Guia de activacion Supabase

Todo el codigo esta listo en disco. Solo faltan 2 cosas:
1. Ejecutar el script de git (push a Vercel)
2. Crear el proyecto Supabase y pegar las keys

---

## PASO 1 — Push a Vercel (2 minutos)

Abre PowerShell y ejecuta:

    cd "C:\Users\dmcht\Claude\Projects\sistema de logistica\givamic-erp"
    .\activar_supabase.ps1

Vercel detecta el push automaticamente y despliega en ~2 minutos.
El sistema sigue funcionando con localStorage mientras tanto (sin Supabase = sin cambios para el usuario).

---

## PASO 2 — Crear proyecto Supabase (5 minutos)

1. Ve a https://supabase.com → New Project
2. Nombre: givamic-erp | Contrasena: (guarda una segura) | Region: South America (Sao Paulo)
3. Espera que termine de crear (~1 min)

---

## PASO 3 — Crear la tabla app_state (1 minuto)

En Supabase: SQL Editor → New query → pegar y ejecutar:

    (contenido de supabase/migrations/001_schema.sql)

---

## PASO 4 — Crear usuarios (5 minutos)

En Supabase: Authentication → Users → Add User (por cada uno):

| Email                       | Contrasena nueva (NO usar las viejas) | Rol                             |
|-----------------------------|---------------------------------------|---------------------------------|
| admin@givamic.pe            | (elige segura, min 12 chars)          | Administrador                   |
| logistica@givamic.pe        | (elige segura)                        | Coordinador Logistica y Compras |
| coord.general@givamic.pe    | (elige segura)                        | Coordinador General             |
| coord.ops@givamic.pe        | (elige segura)                        | Coordinador Operaciones         |
| auditor@givamic.pe          | (elige segura)                        | Auditor                         |

Luego en SQL Editor ejecutar el UPDATE de supabase/migrations/002_seed_users.sql
(descomenta las 5 lineas UPDATE, pegalas y ejecuta).

---

## PASO 5 — Pegar keys en Vercel (2 minutos)

En Supabase: Settings → API → copiar:
- Project URL (ej: https://abcxyz.supabase.co)
- anon public key

En Vercel: tu-proyecto → Settings → Environment Variables → Add:
- VITE_SUPABASE_URL = (pegar Project URL)
- VITE_SUPABASE_ANON_KEY = (pegar anon key)

Guardar → Deployments → Redeploy (ultimo deployment).

---

## RESULTADO

Con las keys en Vercel:
- Login usa Supabase Auth (contrasenas hasheadas, JWT real)
- Los datos se sincronizan a la nube automaticamente
- Si no hay internet, sigue funcionando con localStorage

Sin las keys en Vercel:
- El sistema funciona exactamente igual que antes (localStorage)
- No hay ninguna regresion ni cambio visible para el usuario

---

## Seguridad despues de activar Supabase

| Antes                         | Despues                              |
|-------------------------------|--------------------------------------|
| Contrasenas en texto plano    | Bcrypt via Supabase Auth             |
| Auth 100% client-side         | JWT validado server-side             |
| Roles falsificables           | Token firmado con rol incluido       |
| Datos en localStorage         | PostgreSQL en la nube                |
| Accesible desde DevTools      | Solo via API autenticada con RLS     |
