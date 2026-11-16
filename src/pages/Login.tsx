import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader2, Ghost } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message.includes('Invalid login')
          ? 'Wrong email or password.'
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
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-silver-400 mt-1.5">Sign in to your command center.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                id="password" type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="input-full"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <span className="flex-1 border-t border-silver-600/40" />
            <span className="text-xs text-silver-500 uppercase tracking-wider">or</span>
            <span className="flex-1 border-t border-silver-600/40" />
          </div>

          <button
            type="button"
            onClick={async () => {
              setError('');
              setBusy(true);
              const { error } = await supabase.auth.signInWithPassword({
                email: 'reviewer@noctis.app',
                password: 'NoctisReview2026!',
              });
              if (error) {
                setError('Review access is unavailable right now.');
                setBusy(false);
                return;
              }
              navigate('/dashboard');
            }}
            disabled={busy}
            className="btn-ghost w-full"
          >
            <Ghost className="w-4 h-4" />
            Enter review mode
          </button>
          <p className="text-xs text-silver-600 text-center mt-3">
            One-click demo access for design and functionality review.
          </p>

          <p className="text-sm text-silver-400 mt-6 text-center">
            No account?{' '}
            <Link to="/register" className="text-volt-400 hover:text-volt-300 font-medium">
              Join the underground
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
