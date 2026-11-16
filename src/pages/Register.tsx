import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      setError('Username: 3–24 characters, lowercase letters, numbers, underscores only.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'That email is already registered. Try signing in.'
          : error.message
      );
      setBusy(false);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-void-950 bg-noise-grid flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="w-9 h-9 rounded-lg bg-volt-500/10 border border-volt-500/40 flex items-center justify-center">
            <Zap className="w-4 h-4 text-volt-400" />
          </span>
          <span className="font-display font-bold text-xl tracking-tight text-white">NOCTIS</span>
        </Link>

        <div className="panel p-8">
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Claim your name</h1>
          <p className="text-sm text-silver-400 mt-1.5">Your username becomes your page address.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="field-label" htmlFor="username">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-silver-500 text-sm select-none">noctis.io/</span>
                <input
                  id="username" type="text" required
                  value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="yourname" className="input-full !pl-[5.2rem]"
                />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email" type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@underground.io" className="input-full"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password" type="password" required autoComplete="new-password" minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ characters" className="input-full"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-silver-400 mt-6 text-center">
            Already inside?{' '}
            <Link to="/login" className="text-volt-400 hover:text-volt-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
