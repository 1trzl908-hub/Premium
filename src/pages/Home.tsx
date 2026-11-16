import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Eye, Link2, MousePointerClick, Palette,
  Shield, Sparkles, Zap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/lib/auth';

const features = [
  {
    icon: Link2,
    title: 'One link, everything',
    body: 'A single address that carries your entire presence — every platform, project, and drop in one curated stack.',
  },
  {
    icon: Palette,
    title: 'Engineered appearance',
    body: 'Accent colors, card finishes, and background atmospheres. Tune every pixel until the page feels like you.',
  },
  {
    icon: BadgeCheck,
    title: 'Badge collection',
    body: 'Earn, collect, and display verification badges. Proof of status, rendered on your page for everyone to see.',
  },
  {
    icon: Eye,
    title: 'Know your reach',
    body: 'Profile views and per-link click tracking built in. Understand exactly what your audience responds to.',
  },
];

const stats = [
  { value: '12K+', label: 'Pages forged' },
  { value: '2.4M', label: 'Clicks routed' },
  { value: '99.9%', label: 'Uptime' },
];

export default function Home() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-void-950 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-noise-grid" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] bg-volt-500/10 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-28 text-center">
            <div className="inline-flex items-center gap-2 border border-volt-500/30 bg-volt-500/5 rounded-full px-4 py-1.5 text-xs font-medium text-volt-300 animate-fade-up">
              <Sparkles className="w-3.5 h-3.5" />
              The underground link exchange
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight mt-8 animate-fade-up" style={{ animationDelay: '80ms' }}>
              <span className="text-gradient-silver">One link.</span>
              <br />
              <span className="text-white">Every version of you.</span>
            </h1>
            <p className="text-silver-300 text-lg max-w-xl mx-auto mt-6 leading-relaxed animate-fade-up" style={{ animationDelay: '160ms' }}>
              Forge a dark, personal corner of the internet. Curate your links, collect
              badges, and share a page that actually looks like it was built by hand.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 animate-fade-up" style={{ animationDelay: '240ms' }}>
              {profile ? (
                <Link to="/dashboard" className="btn-primary !px-7 !py-3 text-base">
                  Open dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link to="/register" className="btn-primary !px-7 !py-3 text-base">
                  Claim your link <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link to="/login" className="btn-ghost !px-7 !py-3 text-base">Sign in</Link>
            </div>
            <p className="mt-5 text-sm animate-fade-up" style={{ animationDelay: '280ms' }}>
              <Link to="/reviewer" className="text-silver-500 hover:text-volt-300 transition-colors">
                or preview a live page →
              </Link>
            </p>

            <div className="flex items-center justify-center gap-10 sm:gap-14 mt-16 animate-fade-up" style={{ animationDelay: '320ms' }}>
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-silver-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-28">
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="panel panel-hover p-7 group animate-fade-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-volt-500/10 border border-volt-500/30 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(77,159,255,0.3)] transition-shadow">
                  <f.icon className="w-5 h-5 text-volt-400" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mt-5">{f.title}</h3>
                <p className="text-sm text-silver-400 leading-relaxed mt-2">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-28">
          <div className="panel p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-volt-500/5 rounded-full blur-3xl" />
            <h2 className="font-display text-3xl font-bold text-white tracking-tight">In and out in minutes</h2>
            <div className="grid sm:grid-cols-3 gap-8 mt-10">
              {[
                { n: '01', title: 'Claim a name', body: 'Register and your username becomes your permanent address.' },
                { n: '02', title: 'Curate the stack', body: 'Add links, write your bio, tune the look until it feels right.' },
                { n: '03', title: 'Share the page', body: 'One URL for every bio, post, and profile you own.' },
              ].map((s) => (
                <div key={s.n}>
                  <div className="font-display text-sm font-bold text-volt-400 tracking-widest">{s.n}</div>
                  <h3 className="font-display font-semibold text-white mt-3">{s.title}</h3>
                  <p className="text-sm text-silver-400 mt-2 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-28">
          <div className="relative rounded-2xl border border-volt-500/30 bg-gradient-to-b from-volt-500/10 to-transparent p-10 sm:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-noise-grid opacity-50" />
            <div className="relative">
              <Zap className="w-8 h-8 text-volt-400 mx-auto" />
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mt-4">
                Your corner of the underground is waiting
              </h2>
              <p className="text-silver-300 mt-3 max-w-md mx-auto">
                Free to join. Built for people who care how things look.
              </p>
              <Link to={profile ? '/dashboard' : '/register'} className="btn-primary !px-7 !py-3 text-base mt-8">
                {profile ? 'Go to dashboard' : 'Get started'} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
