import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, LogOut, Shield, User, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { profile, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/editor', label: 'Editor' },
    { to: '/badges', label: 'Badges' },
    { to: '/settings', label: 'Settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-silver-600/30 bg-void-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-8 h-8 rounded-lg bg-volt-500/10 border border-volt-500/40 flex items-center justify-center group-hover:shadow-[0_0_16px_rgba(77,159,255,0.4)] transition-shadow">
            <Zap className="w-4 h-4 text-volt-400" />
          </span>
          <span className="font-display font-700 font-bold tracking-tight text-white">NOCTIS</span>
        </Link>

        {profile && (
          <>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-volt-400 bg-volt-500/10' : 'text-silver-300 hover:text-white hover:bg-void-700'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                      isActive ? 'text-volt-400 bg-volt-500/10' : 'text-silver-300 hover:text-white hover:bg-void-700'
                    }`
                  }
                >
                  <Shield className="w-4 h-4" /> Admin
                </NavLink>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to={`/${profile.username}`}
                className="hidden sm:inline-flex btn-ghost !py-2 !px-3.5"
              >
                <User className="w-4 h-4" /> My page
              </Link>
              <button onClick={handleSignOut} className="btn-ghost !py-2 !px-3.5" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
              <button
                className="md:hidden btn-ghost !py-2 !px-3"
                onClick={() => setMobileOpen((v) => !v)}
                title="Menu"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {!profile && !mobileOpen && (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost !py-2">Sign in</Link>
            <Link to="/register" className="btn-primary !py-2">Get started</Link>
          </div>
        )}
      </div>

      {profile && mobileOpen && (
        <nav className="md:hidden border-t border-silver-600/30 px-4 py-3 flex flex-col gap-1 bg-void-900">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'text-volt-400 bg-volt-500/10' : 'text-silver-300'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-silver-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Admin
            </NavLink>
          )}
        </nav>
      )}
    </header>
  );
}
