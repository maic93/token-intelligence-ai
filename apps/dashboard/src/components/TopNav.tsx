import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Search, X, ExternalLink, Sun, Bell, Globe } from 'lucide-react';

interface TopNavProps {
  connected: boolean;
  onMenuToggle: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadCount?: number;
  onBellClick?: () => void;
  selectedChain?: string;
  onChainChange?: (chain: string) => void;
}

export function TopNav({
  connected,
  onMenuToggle,
  searchQuery,
  onSearchChange,
  unreadCount = 0,
  onBellClick,
  selectedChain = '',
  onChainChange,
}: TopNavProps) {
  const handleClear = useCallback(() => onSearchChange(''), [onSearchChange]);
  const [chains, setChains] = useState<{ name: string; displayName: string }[]>([]);

  useEffect(() => {
    fetch('/api/chains')
      .then((r) => r.json())
      .then((res) =>
        setChains((res.data?.chains ?? []).filter((c: { enabled: boolean }) => c.enabled)),
      )
      .catch(() => {});
  }, []);

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
        <a className="nav-brand" href="#">
          <div className="nav-brand-icon">TI</div>
          <span className="nav-brand-text">TokenIntel</span>
        </a>
      </div>

      <div className="top-nav-center">
        <div className="chain-selector-nav">
          <Globe size={14} />
          <select value={selectedChain} onChange={(e) => onChainChange?.(e.target.value)}>
            <option value="">All Chains</option>
            {chains.map((c) => (
              <option key={c.name} value={c.name}>
                {c.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="search-wrapper">
          <Search className="search-icon" size={15} />
          <input
            className="search-input"
            type="text"
            placeholder="Search tokens, addresses, deployers..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search tokens"
          />
          {searchQuery && (
            <motion.button
              className="search-clear"
              onClick={handleClear}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              aria-label="Clear search"
            >
              <X size={14} />
            </motion.button>
          )}
        </div>
      </div>

      <div className="top-nav-right">
        <div className="connection-indicator">
          <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span>{connected ? 'Live' : 'Reconnecting...'}</span>
        </div>

        {onBellClick && (
          <button
            className="header-btn"
            onClick={onBellClick}
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="alert-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>
        )}

        <a
          className="github-btn"
          href="https://github.com/maic93/token-intelligence-ai"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={14} />
          <span>Star</span>
        </a>

        <button className="header-btn-ghost" aria-label="Toggle theme" disabled>
          <Sun size={15} />
        </button>
      </div>
    </header>
  );
}
