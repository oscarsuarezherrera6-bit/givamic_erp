-- ============================================================
-- GIVAMIC ERP — Crear todos los usuarios del sistema
-- Ejecutar en: Supabase → SQL Editor
-- Crea los 14 usuarios seed si aún no existen
-- ============================================================

DO $$
DECLARE
  v_id uuid;
BEGIN

  -- u1: Administrador ERP
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'admin@givamic.pe', crypt('admin123', gen_salt('bf')),
      NOW(), '{"nombre":"Administrador ERP","rol":"Administrador"}', NOW(), NOW());
  END IF;
  -- Actualizar rol por si fue creado sin metadata
  UPDATE auth.users SET raw_user_meta_data = '{"nombre":"Administrador ERP","rol":"Administrador"}'
    WHERE email = 'admin@givamic.pe' AND (raw_user_meta_data->>'rol' IS NULL OR raw_user_meta_data->>'rol' = '');

  -- u2: Coordinador Logística
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'logistica@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'logistica@givamic.pe', crypt('logistica123', gen_salt('bf')),
      NOW(), '{"nombre":"Oscar Mendoza","rol":"Coordinador Logística y Compras"}', NOW(), NOW());
  END IF;
  UPDATE auth.users SET raw_user_meta_data = '{"nombre":"Oscar Mendoza","rol":"Coordinador Logística y Compras"}'
    WHERE email = 'logistica@givamic.pe' AND (raw_user_meta_data->>'rol' IS NULL OR raw_user_meta_data->>'rol' = '');

  -- u3: Administradora de Empresa
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'administradora@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'administradora@givamic.pe', crypt('empresa123', gen_salt('bf')),
      NOW(), '{"nombre":"Administradora de Empresa","rol":"Administrador de Empresa"}', NOW(), NOW());
  END IF;

  -- u4: Contador
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'contador@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'contador@givamic.pe', crypt('conta123', gen_salt('bf')),
      NOW(), '{"nombre":"Contador","rol":"Contador"}', NOW(), NOW());
  END IF;

  -- u5: Coordinador General
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'coord.general@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'coord.general@givamic.pe', crypt('coordgen123', gen_salt('bf')),
      NOW(), '{"nombre":"María García","rol":"Coordinador General"}', NOW(), NOW());
  END IF;
  UPDATE auth.users SET raw_user_meta_data = '{"nombre":"María García","rol":"Coordinador General"}'
    WHERE email = 'coord.general@givamic.pe' AND (raw_user_meta_data->>'rol' IS NULL OR raw_user_meta_data->>'rol' = '');

  -- u6: Coordinador Operaciones
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'coord.ops@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'coord.ops@givamic.pe', crypt('coordops123', gen_salt('bf')),
      NOW(), '{"nombre":"Juan Pérez","rol":"Coordinador Operaciones"}', NOW(), NOW());
  END IF;
  UPDATE auth.users SET raw_user_meta_data = '{"nombre":"Juan Pérez","rol":"Coordinador Operaciones"}'
    WHERE email = 'coord.ops@givamic.pe' AND (raw_user_meta_data->>'rol' IS NULL OR raw_user_meta_data->>'rol' = '');

  -- u7: Jefe RRHH
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jefe.rrhh@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'jefe.rrhh@givamic.pe', crypt('jrrhh123', gen_salt('bf')),
      NOW(), '{"nombre":"Jefe RRHH","rol":"Jefe RRHH"}', NOW(), NOW());
  END IF;

  -- u8: Asistente RRHH
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'asist.rrhh@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'asist.rrhh@givamic.pe', crypt('arrhh123', gen_salt('bf')),
      NOW(), '{"nombre":"Ana López","rol":"Asistente RRHH"}', NOW(), NOW());
  END IF;

  -- u9: Asistente Logística
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'asist.log@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'asist.log@givamic.pe', crypt('alog123', gen_salt('bf')),
      NOW(), '{"nombre":"Asistente Logística","rol":"Asistente Logística"}', NOW(), NOW());
  END IF;

  -- u10: Facturación
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'facturacion@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'facturacion@givamic.pe', crypt('factura123', gen_salt('bf')),
      NOW(), '{"nombre":"Asistente de Facturación","rol":"Facturación"}', NOW(), NOW());
  END IF;

  -- u11: Auditor ISO
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'auditor@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'auditor@givamic.pe', crypt('auditor123', gen_salt('bf')),
      NOW(), '{"nombre":"Auditor ISO","rol":"Auditor"}', NOW(), NOW());
  END IF;
  UPDATE auth.users SET raw_user_meta_data = '{"nombre":"Auditor ISO","rol":"Auditor"}'
    WHERE email = 'auditor@givamic.pe' AND (raw_user_meta_data->>'rol' IS NULL OR raw_user_meta_data->>'rol' = '');

  -- u12: SOMA
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'soma@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'soma@givamic.pe', crypt('soma123', gen_salt('bf')),
      NOW(), '{"nombre":"Carlos Ruiz","rol":"Coordinador Operaciones"}', NOW(), NOW());
  END IF;

  -- u13: Patricia Luna
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pluna@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'pluna@givamic.pe', crypt('pluna123', gen_salt('bf')),
      NOW(), '{"nombre":"Patricia Luna","rol":"Coordinador Logística y Compras"}', NOW(), NOW());
  END IF;

  -- u14: Gerencia
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'gerencia@givamic.pe') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'gerencia@givamic.pe', crypt('gerencia123', gen_salt('bf')),
      NOW(), '{"nombre":"Roberto Torres","rol":"Gerencia"}', NOW(), NOW());
  END IF;

END $$;

-- Verificar resultado
SELECT email, raw_user_meta_data->>'nombre' AS nombre, raw_user_meta_data->>'rol' AS rol
FROM auth.users
WHERE email LIKE '%@givamic.pe'
ORDER BY email;
