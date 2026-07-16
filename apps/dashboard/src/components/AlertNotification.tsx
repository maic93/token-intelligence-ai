import { useEffect, useState, useCallback, useRef } from 'react';

interface AlertItem {
  id: string;
  message: string;
  eventType: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  createdAt: string;
}

const AUTO_DISMISS_MS = 6000;
const MAX_VISIBLE = 3;

export function AlertNotification({ alerts }: { alerts: AlertItem[] }) {
  const [visible, setVisible] = useState<AlertItem[]>([]);
  const queueRef = useRef<AlertItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const showNext = useCallback(() => {
    setVisible((prev) => {
      if (prev.length >= MAX_VISIBLE) return prev;
      if (queueRef.current.length === 0) return prev;
      const next = queueRef.current.shift()!;
      const result = [...prev, next];
      const timer = setTimeout(() => {
        setVisible((v) => v.filter((a) => a.id !== next.id));
        timersRef.current.delete(next.id);
        showNext();
      }, AUTO_DISMISS_MS);
      timersRef.current.set(next.id, timer);
      return result;
    });
  }, []);

  useEffect(() => {
    for (const alert of alerts) {
      if (timersRef.current.has(alert.id)) continue;
      const alreadyVisible = visible.some((v) => v.id === alert.id);
      const alreadyQueued = queueRef.current.some((q) => q.id === alert.id);
      if (alreadyVisible || alreadyQueued) continue;
      queueRef.current.push(alert);
      showNext();
    }
  }, [alerts, showNext, visible]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (visible.length === 0) return null;

  return (
    <div className="alert-notifications">
      {visible.map((alert) => (
        <div key={alert.id} className={`alert-toast alert-toast--${alert.eventType.toLowerCase()}`}>
          <div className="alert-toast-content">
            <div className="alert-toast-message">{alert.message}</div>
            <div className="alert-toast-meta">
              {alert.tokenName} &middot; {alert.chain}
            </div>
          </div>
          <button
            className="alert-toast-close"
            onClick={() => {
              setVisible((v) => v.filter((a) => a.id !== alert.id));
              const timer = timersRef.current.get(alert.id);
              if (timer) clearTimeout(timer);
              timersRef.current.delete(alert.id);
              showNext();
            }}
            type="button"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
