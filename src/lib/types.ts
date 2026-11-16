export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  accent_color: string;
  card_style: 'glass' | 'solid' | 'outline';
  bg_style: 'grid' | 'glow' | 'plain' | 'noise';
  role: 'user' | 'admin';
  is_banned: boolean;
  views_count: number;
  created_at: string;
}

export interface Link {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  position: number;
  is_active: boolean;
  clicks: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  created_at: string;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badges: Badge | null;
}
