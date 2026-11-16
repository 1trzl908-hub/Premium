import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Copy, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { AppShell } from '@/components/AppShell';

export default function Settings() {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  if (!profile) return null;

  const handleSaveUsername = async () => {
    setError('');
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      setError('Username: 3–24 characters, lowercase letters, numbers, underscores only.');
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', profile.id);
    if (updateError) {
      setError(updateError.message.includes('duplicate')
        ? 'That username is already taken.'
        : 'Could not update username.');
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleSignOutEverywhere = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    await signOut();
    navigate('/');
  };

  return (
    <AppShell>
      <div className="animate-fade-up max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-silver-400 mt-1">Account and page address.</p>

        {/* Page address */}
        <div className="panel p-6 sm:p-8 mt-8">
          <h2 className="font-display text-lg font-semibold text-white">Page address</h2>
          <p className="text-sm text-silver-400 mt-1">
            Changing this breaks any links you've already shared.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500 text-sm select-none">noctis.io/</span>
              <input
                type="text" value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="input-full !pl-[5.2rem]"
              />
            </div>
            <button onClick={handleSaveUsername} disabled={saving || username === profile.username} className="btn-primary shrink-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
            </button>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </div>

        {/* Account info */}
        <div className="panel p-6 sm:p-8 mt-4">
          <h2 className="font-display text-lg font-semibold text-white">Account</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-silver-400">Email</dt>
              <dd className="text-white font-medium truncate">{user?.email ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-silver-400">Member since</dt>
              <dd className="text-white font-medium">
                {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-silver-400">Role</dt>
              <dd className="font-medium capitalize" style={{ color: profile.role === 'admin' ? '#f87171' : '#4d9fff' }}>
                {profile.role}
              </dd>
            </div>
          </dl>
          <button onClick={handleSignOutEverywhere} className="btn-ghost mt-6">
            Sign out everywhere
          </button>
        </div>

        {/* Danger zone */}
        <div className="panel p-6 sm:p-8 mt-4 border-red-900/40">
          <h2 className="font-display text-lg font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger zone
          </h2>
          <p className="text-sm text-silver-400 mt-2">
            Account deletion removes your page, links, and badges permanently. Contact an
            administrator to request deletion — this protects against accidental and
            malicious account takeovers.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
