import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-void-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-volt-500/30 border-t-volt-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-void-950 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">{children}</main>
    </div>
  );
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-void-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-volt-500/30 border-t-volt-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (!profile) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
