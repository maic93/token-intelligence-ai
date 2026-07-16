import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color?: string;
  loading?: boolean;
  index?: number;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  color = 'accent',
  loading,
  index = 0,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="skeleton-stat">
        <div className="skeleton skeleton-stat-icon" />
        <div className="skeleton-stat-body">
          <div className="skeleton skeleton-line skeleton-line-lg" />
          <div className="skeleton skeleton-line skeleton-line-sm" style={{ marginTop: 6 }} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      <div className={`stat-card-icon ${color}`}>{icon}</div>
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
      {trend && (
        <div className={`stat-card-trend ${trend}`}>
          {trend === 'up' && <TrendingUp size={12} />}
          {trend === 'down' && <TrendingDown size={12} />}
          {trend === 'neutral' && <Minus size={12} />}
          {trendLabel}
        </div>
      )}
    </motion.div>
  );
}
