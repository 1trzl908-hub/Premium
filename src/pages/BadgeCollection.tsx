import { useEffect, useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Badge, UserBadge } from '@/lib/types';
import { AppShell } from '@/components/AppShell';
import { BadgeIcon } from '@/components/BadgeIcon';

const rarityStyles: Record<string, string> = {
  common: 'text-silver-300 border-silver-600/60 bg-silver-600/10',
  rare: 'text-volt-300 border-volt-700/60 bg-volt-500/10',
  epic: 'text-fuchsia-300 border-fuchsia-900/60 bg-fuchsia-500/10',
  legendary: 'text-amber-300 border-amber-800/60 bg-amber-500/10',
};

export default function BadgeCollection() {
  const { profile } = useAuth();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [{ data: bData }, { data: ubData }] = await Promise.all([
        supabase.from('badges').select('*').order('rarity'),
        supabase.from('user_badges').select('*, badges(*)').eq('user_id', profile.id),
      ]);
      setAllBadges((bData as Badge[]) ?? []);
      const rows = (ubData as UserBadge[]) ?? [];
      setOwned(new Set(rows.map((r) => r.badge_id)));
      setLoading(false);
    })();
  }, [profile]);

  if (!profile) return null;

  const rarityOrder: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
  const sorted = [...allBadges].sort((a, b) => (rarityOrder[a.rarity] ?? 0) - (rarityOrder[b.rarity] ?? 0));

  return (
    <AppShell>
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Badge collection</h1>
        <p className="text-sm text-silver-400 mt-1">
          {owned.size} of {allBadges.length} earned. Badges are granted by administration.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-volt-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            {sorted.map((badge, i) => {
              const has = owned.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`panel panel-hover p-5 text-center relative overflow-hidden ${has ? '' : 'opacity-45'}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {has && (
                    <div
                      className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full blur-2xl"
                      style={{ backgroundColor: `${badge.color}14` }}
                    />
                  )}
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center border"
                      style={{
                        backgroundColor: has ? `${badge.color}1a` : 'rgba(46,47,58,0.4)',
                        borderColor: has ? `${badge.color}55` : 'rgba(75,77,89,0.4)',
                      }}
                    >
                      {has ? (
                        <BadgeIcon icon={badge.icon} className="w-5 h-5" />
                      ) : (
                        <Lock className="w-4 h-4 text-silver-500" />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white mt-3">{badge.name}</h3>
                    <span
                      className={`inline-block text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border mt-2 ${rarityStyles[badge.rarity]}`}
                    >
                      {badge.rarity}
                    </span>
                    <p className="text-xs text-silver-500 leading-relaxed mt-2.5">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
