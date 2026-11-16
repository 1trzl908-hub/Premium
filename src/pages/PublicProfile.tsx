import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Eye, Ghost, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Link as BioLink, Profile, UserBadge } from '@/lib/types';
import { BadgeIcon } from '@/components/BadgeIcon';

const bgStyles: Record<string, string> = {
  grid: 'bg-noise-grid',
  glow: '',
  plain: '',
  noise: 'bg-noise-grid opacity-60',
};

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    (async () => {
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (cancelled) return;
      if (!pData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const prof = pData as Profile;
      setProfile(prof);
      setLoading(false);

      supabase.rpc('increment_profile_views', { p_username: prof.username }).then(() => {});

      const [{ data: lData }, { data: bData }] = await Promise.all([
        supabase.from('links').select('*').eq('profile_id', prof.id).order('position'),
        supabase
          .from('user_badges')
          .select('*, badges(*)')
          .eq('user_id', prof.id),
      ]);
      if (cancelled) return;
      setLinks((lData as BioLink[]) ?? []);
      setBadges((bData as UserBadge[]) ?? []);
    })();

    return () => { cancelled = true; };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-volt-500/30 border-t-volt-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-void-950 flex flex-col items-center justify-center px-4 text-center">
        <Ghost className="w-10 h-10 text-silver-600" />
        <h1 className="font-display text-2xl font-bold text-white mt-6">Page not found</h1>
        <p className="text-silver-400 text-sm mt-2">This corner of the underground doesn't exist — yet.</p>
        <Link to="/" className="btn-ghost mt-8">
          <Zap className="w-4 h-4 text-volt-400" /> Back to NOCTIS
        </Link>
      </div>
    );
  }

  if (profile.is_banned) {
    return (
      <div className="min-h-screen bg-void-950 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-white">Page suspended</h1>
        <p className="text-silver-400 text-sm mt-2">This page has been suspended by administration.</p>
      </div>
    );
  }

  const accent = profile.accent_color;
  const activeLinks = links.filter((l) => l.is_active);

  const handleClick = (link: BioLink) => {
    supabase.rpc('increment_link_click', { p_link_id: link.id }).then(() => {});
  };

  return (
    <div className="min-h-screen bg-void-950 relative overflow-hidden">
      {/* Atmosphere layer */}
      <div className={`absolute inset-0 ${bgStyles[profile.bg_style] ?? ''}`} />
      {profile.bg_style === 'glow' && (
        <>
          <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full blur-[110px] animate-pulse-glow" style={{ backgroundColor: `${accent}18` }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[110px]" style={{ backgroundColor: `${accent}10` }} />
        </>
      )}

      <div className="relative max-w-lg mx-auto px-4 py-16 sm:py-24">
        <header className="text-center animate-fade-up">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || profile.username}
              className="w-24 h-24 rounded-full mx-auto object-cover border-2"
              style={{ borderColor: `${accent}66` }}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full mx-auto flex items-center justify-center font-display text-3xl font-bold text-white border-2"
              style={{ backgroundColor: `${accent}1a`, borderColor: `${accent}66` }}
            >
              {(profile.display_name || profile.username).charAt(0).toUpperCase()}
            </div>
          )}

          <h1 className="font-display text-2xl font-bold text-white mt-6 tracking-tight">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: accent }}>@{profile.username}</p>

          {profile.bio && (
            <p className="text-sm text-silver-300 leading-relaxed mt-4 max-w-sm mx-auto">{profile.bio}</p>
          )}

          {badges.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
              {badges.map((ub) =>
                ub.badges ? (
                  <span
                    key={ub.badge_id}
                    title={ub.badges.description}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
                    style={{ color: ub.badges.color, borderColor: `${ub.badges.color}44`, backgroundColor: `${ub.badges.color}0f` }}
                  >
                    <BadgeIcon icon={ub.badges.icon} className="w-3.5 h-3.5" />
                    {ub.badges.name}
                  </span>
                ) : null
              )}
            </div>
          )}
        </header>

        <section className="mt-12 space-y-3">
          {activeLinks.map((link, i) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={() => handleClick(link)}
              className="group flex items-center justify-between gap-3 px-5 py-4 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 animate-fade-up"
              style={{
                animationDelay: `${i * 60}ms`,
                borderColor: `${accent}2b`,
                backgroundColor: profile.card_style === 'solid' ? `${accent}0d` : 'rgba(16,16,22,0.7)',
                backdropFilter: profile.card_style === 'glass' ? 'blur(12px)' : undefined,
                borderStyle: profile.card_style === 'outline' ? 'solid' : 'solid',
                borderWidth: profile.card_style === 'outline' ? 2 : 1,
              }}
            >
              <span className="text-sm font-medium text-white group-hover:tracking-wide transition-all duration-300">
                {link.title}
              </span>
              <ExternalLink className="w-4 h-4 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: accent }} />
            </a>
          ))}
          {activeLinks.length === 0 && (
            <p className="text-center text-sm text-silver-500 py-8">Nothing here yet.</p>
          )}
        </section>

        <footer className="mt-16 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-silver-500">
            <Eye className="w-3.5 h-3.5" />
            {profile.views_count.toLocaleString()} views
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-xs text-silver-600 hover:text-silver-400 transition-colors">
            <Zap className="w-3 h-3" />
            Powered by NOCTIS
          </Link>
        </footer>
      </div>
    </div>
  );
}
