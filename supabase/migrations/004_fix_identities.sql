-- ============================================================
-- GIVAMIC ERP — Corregir auth.identities para usuarios SQL
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  u.email,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email LIKE '%@givamic.pe'
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
  );

-- Verificar
SELECT u.email, COUNT(i.id) AS identities
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
WHERE u.email LIKE '%@givamic.pe'
GROUP BY u.email
ORDER BY u.email;
