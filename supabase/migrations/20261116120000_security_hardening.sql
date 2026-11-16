-- 1. Allow an 'owner' role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user','admin','owner'));

-- 2. Admin and owner helpers
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role','user') IN ('admin','owner'); $$;

CREATE OR REPLACE FUNCTION public.is_current_user_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role','user') = 'owner'; $$;

REVOKE EXECUTE ON FUNCTION public.is_current_user_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_owner() TO authenticated;

-- 3. Only the owner can change roles; owner is untouchable
CREATE OR REPLACE FUNCTION public.admin_set_role(p_user_id uuid, p_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE target_role text;
BEGIN
  IF NOT public.is_current_user_owner() THEN
    RAISE EXCEPTION 'Only the owner can change roles' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('user','admin') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot change your own role'; END IF;
  SELECT role INTO target_role FROM public.profiles WHERE id = p_user_id;
  IF target_role = 'owner' THEN RAISE EXCEPTION 'The owner role is protected'; END IF;
  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;
  UPDATE auth.users SET raw_app_meta_data = coalesce(raw_app_meta_data,'{}'::jsonb)
    || jsonb_build_object('role', p_role) WHERE id = p_user_id;
END; $$;

-- 4. Admins cannot ban the owner or other admins
CREATE OR REPLACE FUNCTION public.admin_set_ban(p_user_id uuid, p_banned boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE target_role text;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot ban yourself'; END IF;
  SELECT role INTO target_role FROM public.profiles WHERE id = p_user_id;
  IF target_role = 'owner' THEN RAISE EXCEPTION 'The owner cannot be banned'; END IF;
  IF target_role = 'admin' AND NOT public.is_current_user_owner() THEN
    RAISE EXCEPTION 'Only the owner can ban admins';
  END IF;
  UPDATE public.profiles SET is_banned = p_banned WHERE id = p_user_id;
END; $$;

-- 5. Reserved usernames (existing rows are left alone)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_not_reserved;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_not_reserved
  CHECK (username NOT IN ('admin','administrator','owner','login','register','signup',
  'signin','logout','dashboard','editor','badges','settings','api','support','help',
  'about','terms','privacy','noctis','root','staff','mod','moderator','system','www'))
  NOT VALID;

-- 6. Links must start with http://, https:// or mailto:
ALTER TABLE public.links DROP CONSTRAINT IF EXISTS links_url_safe;
ALTER TABLE public.links ADD CONSTRAINT links_url_safe
  CHECK (url ~* '^(https?://|mailto:)') NOT VALID;

-- 7. Banned users cannot edit profile or links
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id AND NOT is_banned)
  WITH CHECK (auth.uid() = id AND NOT is_banned);

DROP POLICY IF EXISTS "links_owner_insert" ON public.links;
CREATE POLICY "links_owner_insert" ON public.links FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = profile_id AND NOT EXISTS
    (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_banned));

DROP POLICY IF EXISTS "links_owner_update" ON public.links;
CREATE POLICY "links_owner_update" ON public.links FOR UPDATE TO authenticated
  USING (auth.uid() = profile_id AND NOT EXISTS
    (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_banned))
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "links_owner_delete" ON public.links;
CREATE POLICY "links_owner_delete" ON public.links FOR DELETE TO authenticated
  USING (auth.uid() = profile_id AND NOT EXISTS
    (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_banned));

-- 8. New signups: avoid reserved names, and no more "first account is admin"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username text; new_username text; suffix integer := 0;
  reserved text[] := ARRAY['admin','administrator','owner','login','register','signup',
    'signin','logout','dashboard','editor','badges','settings','api','support','help',
    'about','terms','privacy','noctis','root','staff','mod','moderator','system','www'];
BEGIN
  base_username := lower(coalesce(nullif(new.raw_user_meta_data ->> 'username',''),
    split_part(coalesce(new.email,'user'),'@',1)));
  base_username := regexp_replace(base_username,'[^a-z0-9_]','','g');
  IF base_username IS NULL OR length(base_username) < 3 THEN
    base_username := 'user' || substr(replace(new.id::text,'-',''),1,8);
  END IF;
  base_username := substr(base_username,1,20);
  new_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username)
        OR new_username = ANY(reserved) LOOP
    suffix := suffix + 1;
    new_username := base_username || suffix::text;
  END LOOP;
  INSERT INTO public.profiles (id, username) VALUES (new.id, new_username);
  RETURN new;
END; $$;
