import { useState, useRef, useEffect } from 'react';

interface AlertItem {
  id: string;
  message: string;
  eventType: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  createdAt: string;
  seen: boolean;
}

interface Props {
  unreadCount: number;
  alerts: AlertItem[];
  onMarkAllSeen: () => void;
  onClearAll: () => void;
}

export function AlertBell({ unreadCount, alerts, onMarkAllSeen, onClearAll }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggle = () => {
    if (!open) onMarkAllSeen();
    setOpen((prev) => !prev);
  };

  const recentAlerts = alerts.slice(0, 50);

  return (
    <div className="alert-bell" ref={ref}>
      <button className="alert-bell-btn" onClick={handleToggle} type="button" title="Alerts">
        <span className="alert-bell-icon">{'\uD83D\uDD14'}</span>
        {unreadCount > 0 && (
          <span className="alert-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="alert-bell-dropdown">
          <div className="alert-bell-header">
            <span>Recent Alerts</span>
            <div className="alert-bell-actions">
              {alerts.length > 0 && (
                <button className="alert-bell-clear" onClick={onClearAll} type="button">
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div className="alert-bell-list">
            {recentAlerts.length === 0 ? (
              <div className="alert-bell-empty">No alerts</div>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-bell-item ${!alert.seen ? 'alert-bell-item--new' : ''}`}
                >
                  <div className="alert-bell-item-msg">{alert.message}</div>
                  <div className="alert-bell-item-meta">
                    {new Date(alert.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
