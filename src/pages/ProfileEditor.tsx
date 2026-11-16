import { useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Badge, Profile, UserBadge } from '@/lib/types';
import { AppShell } from '@/components/AppShell';
import { BadgeIcon } from '@/components/BadgeIcon';

const ACCENTS = ['#4d9fff', '#4ade80', '#f5c542', '#f87171', '#c084fc', '#f97316', '#2dd4bf', '#f0f1f4'];
const CARD_STYLES: { value: Profile['card_style']; label: string }[] = [
  { value: 'glass', label: 'Glass' },
  { value: 'solid', label: 'Solid' },
  { value: 'outline', label: 'Outline' },
];
const BG_STYLES: { value: Profile['bg_style']; label: string }[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'glow', label: 'Glow' },
  { value: 'plain', label: 'Plain' },
  { value: 'noise', label: 'Noise' },
];

export default function ProfileEditor() {
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [accent, setAccent] = useState(profile?.accent_color ?? '#4d9fff');
  const [cardStyle, setCardStyle] = useState<Profile['card_style']>(profile?.card_style ?? 'glass');
  const [bgStyle, setBgStyle] = useState<Profile['bg_style']>(profile?.bg_style ?? 'grid');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', profile.id);
      const rows = (data as UserBadge[]) ?? [];
      setEarnedBadges(rows.map((r) => r.badges).filter((b): b is Badge => !!b));
    })();
  }, [profile]);

  if (!profile) return null;

  const handleSave = async () => {
    setError('');
    setSaving(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim().slice(0, 60),
        bio: bio.slice(0, 280),
        avatar_url: avatarUrl.trim(),
        accent_color: accent,
        card_style: cardStyle,
        bg_style: bgStyle,
      })
      .eq('id', profile.id);
    if (updateError) {
      setError('Could not save changes. Try again.');
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  return (
    <AppShell>
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Profile editor</h1>
        <p className="text-sm text-silver-400 mt-1">Tune every detail. Preview updates live.</p>

        <div className="grid lg:grid-cols-2 gap-6 mt-8 items-start">
          {/* Controls */}
          <div className="panel p-6 sm:p-8 space-y-6">
            <div>
              <label className="field-label" htmlFor="display_name">Display name</label>
              <input
                id="display_name" type="text" maxLength={60} value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={profile.username} className="input-full"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="bio">Bio <span className="normal-case text-silver-600">({bio.length}/280)</span></label>
              <textarea
                id="bio" rows={3} maxLength={280} value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the underground who you are…" className="input-full resize-none"
              />
            </div>

            <div>
              <label className="field-label" htmlFor="avatar_url">Avatar image URL</label>
              <input
                id="avatar_url" type="url" value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://…/avatar.jpg" className="input-full"
              />
            </div>

            <div>
              <span className="field-label">Accent color</span>
              <div className="flex flex-wrap gap-2.5">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAccent(c)}
                    className={`w-9 h-9 rounded-lg border-2 transition-all duration-200 ${
                      accent === c ? 'scale-110 shadow-[0_0_12px_rgba(255,255,255,0.15)]' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: `${c}26`, borderColor: accent === c ? c : 'transparent' }}
                    title={c}
                  >
                    {accent === c && <Check className="w-4 h-4 mx-auto" style={{ color: c }} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="field-label">Card style</span>
              <div className="grid grid-cols-3 gap-2">
                {CARD_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setCardStyle(s.value)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      cardStyle === s.value
                        ? 'border-volt-500 text-volt-300 bg-volt-500/10'
                        : 'border-silver-600 text-silver-400 hover:border-silver-500 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="field-label">Background</span>
              <div className="grid grid-cols-4 gap-2">
                {BG_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setBgStyle(s.value)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      bgStyle === s.value
                        ? 'border-volt-500 text-volt-300 bg-volt-500/10'
                        : 'border-silver-600 text-silver-400 hover:border-silver-500 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
            </button>
          </div>

          {/* Live preview */}
          <div className="panel overflow-hidden lg:sticky lg:top-24">
            <div className="px-5 py-3 border-b border-silver-600/40 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-silver-600" />
              <span className="w-2.5 h-2.5 rounded-full bg-silver-600" />
              <span className="w-2.5 h-2.5 rounded-full bg-silver-600" />
              <span className="ml-3 text-xs text-silver-500 truncate">noctis.io/{profile.username}</span>
            </div>
            <div className="bg-void-950 p-8 relative overflow-hidden min-h-[480px]">
              <div className={`absolute inset-0 ${bgStyle === 'noise' ? 'bg-noise-grid opacity-60' : bgStyle === 'grid' ? 'bg-noise-grid' : ''}`} />
              {bgStyle === 'glow' && (
                <div className="absolute -top-20 left-1/3 w-72 h-72 rounded-full blur-[90px] animate-pulse-glow" style={{ backgroundColor: `${accent}18` }} />
              )}
              <div className="relative text-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar preview" className="w-20 h-20 rounded-full mx-auto object-cover border-2" style={{ borderColor: `${accent}66` }} />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full mx-auto flex items-center justify-center font-display text-2xl font-bold text-white border-2"
                    style={{ backgroundColor: `${accent}1a`, borderColor: `${accent}66` }}
                  >
                    {(displayName || profile.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="font-display text-lg font-bold text-white mt-4">{displayName || profile.username}</h3>
                <p className="text-xs font-medium mt-0.5" style={{ color: accent }}>@{profile.username}</p>
                {bio && <p className="text-xs text-silver-300 mt-3 leading-relaxed max-w-[16rem] mx-auto">{bio}</p>}

                {earnedBadges.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                    {earnedBadges.map((b) => (
                      <span
                        key={b.id}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
                        style={{ color: b.color, borderColor: `${b.color}44`, backgroundColor: `${b.color}0f` }}
                      >
                        <BadgeIcon icon={b.icon} className="w-3 h-3" />
                        {b.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-6 space-y-2.5 text-left">
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-lg"
                    style={{ borderColor: `${accent}2b`, borderWidth: cardStyle === 'outline' ? 2 : 1, borderStyle: 'solid', backgroundColor: cardStyle === 'solid' ? `${accent}0d` : cardStyle === 'glass' ? 'rgba(16,16,22,0.7)' : 'transparent' }}
                  >
                    <span className="text-xs font-medium text-white">Sample link</span>
                    <ExternalLink className="w-3.5 h-3.5" style={{ color: accent }} />
                  </div>
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-lg"
                    style={{ borderColor: `${accent}2b`, borderWidth: cardStyle === 'outline' ? 2 : 1, borderStyle: 'solid', backgroundColor: cardStyle === 'solid' ? `${accent}0d` : cardStyle === 'glass' ? 'rgba(16,16,22,0.7)' : 'transparent' }}
                  >
                    <span className="text-xs font-medium text-white">Another link</span>
                    <ExternalLink className="w-3.5 h-3.5" style={{ color: accent }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
