import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Ban, Loader2, Search, Shield, ShieldOff, Award, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Badge, Profile, UserBadge } from '@/lib/types';
import { AppShell } from '@/components/AppShell';
import { BadgeIcon } from '@/components/BadgeIcon';

export default function Admin() {
  const { profile: myProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [{ data: uData }, { data: bData }, { data: ubData }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('badges').select('*').order('rarity'),
      supabase.from('user_badges').select('*'),
    ]);
    setUsers((uData as Profile[]) ?? []);
    setBadges((bData as Badge[]) ?? []);
    setUserBadges((ubData as UserBadge[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.username.includes(q) || u.display_name.toLowerCase().includes(q)
    );
  }, [users, query]);

  const stats = useMemo(() => ({
    total: users.length,
    banned: users.filter((u) => u.is_banned).length,
    admins: users.filter((u) => u.role === 'admin').length,
    views: users.reduce((s, u) => s + u.views_count, 0),
  }), [users]);

  const runAdminAction = async (
    fn: () => PromiseLike<{ error: { message: string } | null }>
  ) => {
    setBusy(true);
    const { error } = await fn();
    if (error) alert(error.message);
    await load();
    setBusy(false);
  };

  const toggleBan = (u: Profile) =>
    runAdminAction(() => supabase.rpc('admin_set_ban', { p_user_id: u.id, p_banned: !u.is_banned }));

  const toggleRole = (u: Profile) =>
    runAdminAction(() =>
      supabase.rpc('admin_set_role', { p_user_id: u.id, p_role: u.role === 'admin' ? 'user' : 'admin' })
    );

  const badgeCountFor = (userId: string) =>
    userBadges.filter((ub) => ub.user_id === userId).length;

  const ownedBadgeIds = new Set(
    userBadges.filter((ub) => ub.user_id === selected?.id).map((ub) => ub.badge_id)
  );

  if (!myProfile) return null;

  return (
    <AppShell>
      <div className="animate-fade-up">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-900/60 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">Admin</h1>
            <p className="text-sm text-silver-400 mt-0.5">Command the underground.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8">
          {[
            { label: 'Users', value: stats.total },
            { label: 'Banned', value: stats.banned },
            { label: 'Admins', value: stats.admins },
            { label: 'Total views', value: stats.views },
          ].map((s) => (
            <div key={s.label} className="panel p-4 sm:p-5">
              <div className="font-display text-xl sm:text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
              <div className="text-xs text-silver-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-500" />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users…" className="input-full !pl-10"
          />
        </div>

        {/* Users table */}
        <div className="panel mt-4 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-volt-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-silver-500 text-center py-12">No users match "{query}".</p>
          ) : (
            <div className="divide-y divide-silver-600/30">
              {filtered.map((u) => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-void-800/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{u.display_name || u.username}</span>
                      {u.role === 'admin' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-red-400 border border-red-900/60 bg-red-950/30 px-1.5 py-0.5 rounded-full">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      )}
                      {u.is_banned && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-red-400 border border-red-900/60 bg-red-950/30 px-1.5 py-0.5 rounded-full">
                          Banned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-silver-500 mt-1">
                      <span>@{u.username}</span>
                      <span>{u.views_count.toLocaleString()} views</span>
                      <span className="inline-flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5" /> {badgeCountFor(u.id)} badges
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setSelected(u)} className="btn-ghost !py-1.5 !px-3 !text-xs">
                      <Award className="w-3.5 h-3.5" /> Badges
                    </button>
                    <button onClick={() => toggleRole(u)} disabled={busy || u.id === myProfile.id} className="btn-ghost !py-1.5 !px-3 !text-xs" title={u.id === myProfile.id ? "You can't change your own role" : 'Toggle admin'}>
                      <ShieldOff className="w-3.5 h-3.5" /> {u.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <button onClick={() => toggleBan(u)} disabled={busy || u.id === myProfile.id} className="btn-danger !py-1.5 !px-3 !text-xs" title={u.id === myProfile.id ? "You can't ban yourself" : ''}>
                      <Ban className="w-3.5 h-3.5" /> {u.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badge manager modal */}
        {selected && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelected(null)}
          >
            <div className="panel w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-white">
                  Badges for @{selected.username}
                </h2>
                <button onClick={() => setSelected(null)} className="p-2 text-silver-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-5 space-y-2">
                {badges.map((badge) => {
                  const has = ownedBadgeIds.has(badge.id);
                  return (
                    <button
                      key={badge.id}
                      disabled={busy}
                      onClick={() =>
                        runAdminAction(() =>
                          has
                            ? supabase.rpc('admin_revoke_badge', { p_user_id: selected.id, p_badge_id: badge.id })
                            : supabase.rpc('admin_award_badge', { p_user_id: selected.id, p_badge_id: badge.id })
                        )
                      }
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                        has
                          ? 'border-silver-500 bg-void-700/70'
                          : 'border-silver-600/40 bg-void-800/50 hover:border-silver-500'
                      }`}
                    >
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0"
                        style={{ backgroundColor: `${badge.color}1a`, borderColor: `${badge.color}55` }}
                      >
                        <BadgeIcon icon={badge.icon} className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-white">{badge.name}</span>
                        <span className="block text-xs text-silver-500 truncate">{badge.description}</span>
                      </span>
                      <span className={`text-xs font-medium shrink-0 ${has ? 'text-emerald-400' : 'text-silver-500'}`}>
                        {has ? 'Owned' : 'Grant'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
