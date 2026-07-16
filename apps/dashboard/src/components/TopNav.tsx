import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Menu, Search, X, ExternalLink, Sun, Bell } from 'lucide-react';

interface TopNavProps {
  connected: boolean;
  onMenuToggle: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadCount?: number;
  onBellClick?: () => void;
}

export function TopNav({
  connected,
  onMenuToggle,
  searchQuery,
  onSearchChange,
  unreadCount = 0,
  onBellClick,
}: TopNavProps) {
  const handleClear = useCallback(() => onSearchChange(''), [onSearchChange]);

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
