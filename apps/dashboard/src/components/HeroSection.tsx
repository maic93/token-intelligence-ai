import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Coins, ShieldCheck, Link2, Wifi } from 'lucide-react';
import { useStats } from '../hooks/useStats';

interface HeroMetric {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <>{count.toLocaleString()}</>;
}

export function HeroSection() {
  const { stats } = useStats();

  const metrics: HeroMetric[] = [
    {
      icon: <Coins size={16} />,
      value: stats?.totalTokens ?? 0,
      label: 'Tokens Indexed',
      color: '#6366f1',
    },
    {
      icon: <ShieldCheck size={16} />,
      value: stats?.totalTokens ?? 0,
      label: 'Risk Analyses',
      color: '#22c55e',
    },
    {
      icon: <Link2 size={16} />,
      value: stats?.chains.length ?? 0,
      label: 'Chains',
      color: '#f97316',
    },
    { icon: <Wifi size={16} />, value: stats ? 1 : 0, label: 'WebSocket', color: '#84cc16' },
  ];

  return (
    <section className="hero-section">
      <motion.h1
        className="hero-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Token Intelligence
      </motion.h1>
      <motion.p
        className="hero-subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        Real-time token discovery and risk analysis
      </motion.p>
      <div className="hero-metrics">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="hero-metric"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
          >
            <div
              className="hero-metric-icon"
              style={{ background: `${m.color}15`, color: m.color }}
            >
              {m.icon}
            </div>
            <div>
              <div className="hero-metric-value" style={{ color: m.color }}>
                <AnimatedCounter target={m.value} />
              </div>
              <div className="hero-metric-label">{m.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
