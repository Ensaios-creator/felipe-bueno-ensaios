-- ==============================================================================
-- Provisionamento do Usuário Administrador Fixo do Estúdio
-- E-mail: lflavio916@gmail.com
-- Senha:  37869825
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  -- Criptografia padrão Blowfish do Supabase Auth
  v_encrypted_pw := crypt('37869825', gen_salt('bf'));

  -- Verifica se o usuário já existe
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'lflavio916@gmail.com';

  IF v_user_id IS NULL THEN
    -- Criação de novo usuário admin
    v_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'lflavio916@gmail.com',
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Estúdio Felipe Bueno"}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      encode(gen_random_bytes(32), 'hex')
    );

    -- Identidade de email vinculada
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', 'lflavio916@gmail.com'),
      'email',
      'lflavio916@gmail.com',
      now(),
      now(),
      now()
    );
  ELSE
    -- Atualiza a senha e confirmação do usuário existente
    UPDATE auth.users
    SET 
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;
END $$;
