import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-silver-600/30 mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-volt-500/10 border border-volt-500/40 flex items-center justify-center">
            <Zap className="w-3 h-3 text-volt-400" />
          </span>
          <span className="font-display font-bold text-sm tracking-tight text-white">NOCTIS</span>
        </div>
        <p className="text-xs text-silver-500">The underground link exchange.</p>
        <div className="flex items-center gap-4 text-xs text-silver-400">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/login" className="hover:text-white transition-colors">Sign in</Link>
          <Link to="/register" className="hover:text-white transition-colors">Join</Link>
        </div>
      </div>
    </footer>
  );
}
