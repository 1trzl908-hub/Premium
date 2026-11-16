import {
  Award, BadgeCheck, Bug, Crown, Flame, Gem, Ghost, Layers, Moon,
  Shield, Sprout, TrendingUp, Zap,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  'award': Award,
  'badge-check': BadgeCheck,
  'bug': Bug,
  'crown': Crown,
  'flame': Flame,
  'gem': Gem,
  'ghost': Ghost,
  'layers': Layers,
  'moon': Moon,
  'shield': Shield,
  'sprout': Sprout,
  'trending-up': TrendingUp,
  'zap': Zap,
};

export function BadgeIcon({ icon, className }: { icon: string; className?: string }) {
  const Cmp = iconMap[icon] ?? Award;
  return <Cmp className={className} />;
}
