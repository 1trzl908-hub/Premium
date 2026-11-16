/*
# Create biolink platform schema (profiles, links, badges, admin controls)

1. New Tables
- `profiles` — one per account, auto-created on signup. Holds the public page:
  username (unique, URL slug), display_name, bio, avatar_url, appearance
  settings (accent_color, card_style, bg_style), plus protected fields the
  user must not control: role, is_banned, views_count.
- `links` — the buttons shown on a profile. Owned by a profile via profile_id
  (which equals the user id). Holds title, url, position (sort order),
  is_active, and a click counter.
- `badges` — the global badge catalog (seeded). name, description, icon,
  color, rarity.
- `user_badges` — join table of badges earned by users, with awarded_at.

2. Functions & Triggers
- `handle_new_user()` trigger on auth.users: auto-creates a profile with a
  sanitized unique username taken from signup metadata (falls back to the
  email). The very first account created is promoted to admin via
  raw_app_meta_data so the platform always has an administrator.
- `increment_profile_views(p_username)` — public RPC, bumps views_count.
- `increment_link_click(p_link_id)` — public RPC, bumps a link's clicks.
- `is_current_user_admin()` — SECURITY DEFINER helper that checks the JWT's
  app_metadata role.
- Admin RPCs (SECURITY DEFINER, admin-only): `admin_set_ban`,
  `admin_set_role`, `admin_award_badge`, `admin_revoke_badge`.

3. Security
- RLS enabled on every table.
- Profiles are publicly readable (public profile pages are the product);
  INSERT is owner-scoped; UPDATE is owner-scoped AND restricted to safe
  columns via column-level grants (role, is_banned, views_count are not
  updatable by users).
- Links: publicly readable, writes scoped to the owning profile.
- Badges + user_badges: publicly readable, no direct writes — badges are
  awarded only through the admin RPC.
- Admin RPCs are revoked from public/anon and granted only to authenticated;
  each verifies the caller's admin role from the JWT (user-immutable).
- Public increment RPCs use SECURITY DEFINER with tight single-purpose
  updates.
*/

-- ============ TABLES ============

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL CHECK (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 280),
  avatar_url text NOT NULL DEFAULT '',
  accent_color text NOT NULL DEFAULT '#4d9fff' CHECK (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  card_style text NOT NULL DEFAULT 'glass' CHECK (card_style IN ('glass','solid','outline')),
  bg_style text NOT NULL DEFAULT 'grid' CHECK (bg_style IN ('grid','glow','plain','noise')),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  is_banned boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 60),
  url text NOT NULL CHECK (char_length(url) <= 500),
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'award',
  color text NOT NULL DEFAULT '#4d9fff',
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS links_profile_idx ON public.links(profile_id);
CREATE INDEX IF NOT EXISTS user_badges_user_idx ON public.user_badges(user_id);

-- ============ RLS ============

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Profiles: publicly readable (public profile pages), owner-managed
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_owner_insert" ON public.profiles;
CREATE POLICY "profiles_owner_insert" ON public.profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
CREATE POLICY "profiles_owner_update" ON public.profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Links: publicly readable, owner-scoped writes
DROP POLICY IF EXISTS "links_public_read" ON public.links;
CREATE POLICY "links_public_read" ON public.links FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "links_owner_insert" ON public.links;
CREATE POLICY "links_owner_insert" ON public.links FOR INSERT
TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "links_owner_update" ON public.links;
CREATE POLICY "links_owner_update" ON public.links FOR UPDATE
TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "links_owner_delete" ON public.links;
CREATE POLICY "links_owner_delete" ON public.links FOR DELETE
TO authenticated USING (auth.uid() = profile_id);

-- Badges: public catalog, no direct writes
DROP POLICY IF EXISTS "badges_public_read" ON public.badges;
CREATE POLICY "badges_public_read" ON public.badges FOR SELECT
TO anon, authenticated USING (true);

-- User badges: publicly readable (shown on profiles), no direct writes
DROP POLICY IF EXISTS "user_badges_public_read" ON public.user_badges;
CREATE POLICY "user_badges_public_read" ON public.user_badges FOR SELECT
TO anon, authenticated USING (true);

-- ============ GRANTS ============
-- Column-restricted profile updates: users can never touch role, is_banned, views_count

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE (username, display_name, bio, avatar_url, accent_color, card_style, bg_style) ON public.profiles TO authenticated;

GRANT SELECT ON public.links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.links TO authenticated;

GRANT SELECT ON public.badges TO anon, authenticated;
GRANT SELECT ON public.user_badges TO anon, authenticated;

-- ============ FUNCTIONS ============

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'user') = 'admin';
$$;

REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Auto-create profile on signup; first account becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username text;
  new_username text;
  suffix integer := 0;
BEGIN
  base_username := lower(coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(coalesce(new.email, 'user'), '@', 1)
  ));
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  IF base_username IS NULL OR length(base_username) < 3 THEN
    base_username := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  END IF;
  base_username := substr(base_username, 1, 20);
  new_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    suffix := suffix + 1;
    new_username := base_username || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new_username);

  IF (SELECT count(*) FROM public.profiles) = 1 THEN
    UPDATE auth.users
    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
    WHERE id = new.id;
    UPDATE public.profiles SET role = 'admin' WHERE id = new.id;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Public view/click counters
CREATE OR REPLACE FUNCTION public.increment_profile_views(p_username text)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.profiles SET views_count = views_count + 1
  WHERE username = p_username;
$$;

CREATE OR REPLACE FUNCTION public.increment_link_click(p_link_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.links SET clicks = clicks + 1
  WHERE id = p_link_id AND is_active;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_profile_views(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_link_click(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_profile_views(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_link_click(uuid) TO anon, authenticated;

-- Admin RPCs (verify admin role from JWT app_metadata)
CREATE OR REPLACE FUNCTION public.admin_set_ban(p_user_id uuid, p_banned boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Admins cannot ban themselves';
  END IF;
  UPDATE public.profiles SET is_banned = p_banned WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('user','admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Admins cannot change their own role';
  END IF;
  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;
  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', p_role)
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_award_badge(p_user_id uuid, p_badge_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_badge(p_user_id uuid, p_badge_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.user_badges
  WHERE user_id = p_user_id AND badge_id = p_badge_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_ban(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_award_badge(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_badge(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_ban(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_award_badge(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_badge(uuid, uuid) TO authenticated;

-- ============ BADGE CATALOG SEED ============

INSERT INTO public.badges (name, description, icon, color, rarity) VALUES
  ('Verified', 'Identity confirmed by the council.', 'badge-check', '#4d9fff', 'rare'),
  ('Founder', 'One of the original members.', 'crown', '#f5c542', 'legendary'),
  ('Early Adopter', 'Joined while the underground was still small.', 'sprout', '#4ade80', 'common'),
  ('Night Owl', 'Most active between midnight and dawn.', 'moon', '#8b9cff', 'common'),
  ('Gold Tier', 'A profile worth its weight in gold.', 'gem', '#f5c542', 'epic'),
  ('Bug Hunter', 'Reported a critical flaw in the system.', 'bug', '#f87171', 'rare'),
  ('Cryptic', 'Speaks in riddles. Understands everything.', 'ghost', '#a78bfa', 'rare'),
  ('Elite', 'Recognized at the highest level.', 'zap', '#4d9fff', 'epic'),
  ('Collector', 'Earned five or more badges.', 'layers', '#4ade80', 'rare'),
  ('Influencer', '10,000 profile views and counting.', 'trending-up', '#f97316', 'epic'),
  ('Admin', 'Runs the operation.', 'shield', '#f87171', 'legendary'),
  ('Legend', 'Their name echoes through the underground.', 'flame', '#f97316', 'legendary')
ON CONFLICT (name) DO NOTHING;
