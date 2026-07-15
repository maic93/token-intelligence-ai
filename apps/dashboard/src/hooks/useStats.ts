import { useState, useEffect } from 'react';
import type { StatsData } from '../types';
import { fetchStats } from '../api';

const POLL_INTERVAL = 30_000;

export function useStats(): {
  stats: StatsData | null;
  loading: boolean;
  error: string | null;
} {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetchStats();
        if (active) {
          setStats(res.data);
          setError(null);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to fetch stats');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, error };
}
