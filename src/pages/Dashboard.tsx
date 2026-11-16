import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, Copy, Check, Eye, ExternalLink, Link2, MousePointerClick,
  Plus, Trash2, Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Link as BioLink } from '@/lib/types';
import { AppShell } from '@/components/AppShell';

export default function Dashboard() {
  const { profile } = useAuth();
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');

  const loadLinks = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('profile_id', profile.id)
      .order('position');
    if (!error) setLinks((data as BioLink[]) ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  if (!profile) return null;

  const profileUrl = `${window.location.origin}/${profile.username}`;
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let url = newUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      new URL(url);
    } catch {
      setError('That doesn\'t look like a valid URL.');
      return;
    }
    setAdding(true);
    const { error: insertError } = await supabase.from('links').insert({
      title: newTitle.trim(),
      url,
      position: links.length,
    });
    if (insertError) {
      setError('Could not add the link. Titles must be 1–60 characters.');
    } else {
      setNewTitle('');
      setNewUrl('');
      await loadLinks();
    }
    setAdding(false);
  };

  const removeLink = async (id: string) => {
    await supabase.from('links').delete().eq('id', id);
    await loadLinks();
  };

  const toggleActive = async (link: BioLink) => {
    await supabase.from('links').update({ is_active: !link.is_active }).eq('id', link.id);
    await loadLinks();
  };

  return (
    <AppShell>
      <div className="animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-sm text-silver-400 mt-1">Your page at a glance.</p>
          </div>
          <Link to={`/${profile.username}`} className="btn-ghost !py-2">
            View public page <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Share URL */}
        <div className="panel p-5 mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="field-label !mb-1">Your link</p>
            <p className="text-sm text-volt-300 truncate font-medium">{profileUrl}</p>
          </div>
          <button onClick={copyUrl} className="btn-primary !py-2 shrink-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4">
          {[
            { icon: Link2, label: 'Links', value: links.length },
            { icon: Eye, label: 'Views', value: profile.views_count },
            { icon: MousePointerClick, label: 'Clicks', value: totalClicks },
          ].map((s) => (
            <div key={s.label} className="panel p-4 sm:p-5">
              <s.icon className="w-4 h-4 text-volt-400" />
              <div className="font-display text-xl sm:text-2xl font-bold text-white mt-3">{s.value.toLocaleString()}</div>
              <div className="text-xs text-silver-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Links manager */}
        <div className="panel p-6 sm:p-8 mt-4">
          <h2 className="font-display text-lg font-semibold text-white">Your links</h2>
          <p className="text-sm text-silver-400 mt-1">Shown on your public page in this order.</p>

          <form onSubmit={addLink} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 mt-6">
            <input
              type="text" required maxLength={60} value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Link title (e.g. My portfolio)" className="input-full"
            />
            <input
              type="text" required value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com" className="input-full"
            />
            <button type="submit" disabled={adding} className="btn-primary">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </form>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

          <div className="mt-6 space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-volt-400" />
              </div>
            ) : links.length === 0 ? (
              <p className="text-sm text-silver-500 text-center py-8">
                No links yet. Add your first above.
              </p>
            ) : (
              links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 bg-void-800/70 border border-silver-600/40 rounded-xl px-4 py-3 group hover:border-silver-500 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-white truncate ${!link.is_active ? 'opacity-40' : ''}`}>
                      {link.title}
                    </p>
                    <p className="text-xs text-silver-500 truncate">{link.url}</p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-silver-500 shrink-0">
                    <MousePointerClick className="w-3.5 h-3.5" /> {link.clicks}
                  </span>
                  <button
                    onClick={() => toggleActive(link)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 transition-colors ${
                      link.is_active
                        ? 'text-emerald-400 border-emerald-900/60 hover:bg-emerald-950/30'
                        : 'text-silver-500 border-silver-600 hover:bg-void-700'
                    }`}
                  >
                    {link.is_active ? 'Live' : 'Hidden'}
                  </button>
                  <a
                    href={link.url} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-silver-500 hover:text-white transition-colors shrink-0"
                    title="Open link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => removeLink(link.id)}
                    className="p-2 text-silver-500 hover:text-red-400 transition-colors shrink-0"
                    title="Delete link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
