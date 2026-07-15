import type { Token } from '../api.js';
import { useEffect, useState } from 'react';

interface Props {
  token: Token;
}

export function NewTokenBanner({ token }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [token]);

  if (!visible) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.icon}>🆕</div>
      <div style={styles.content}>
        <div style={styles.title}>New Token Discovered</div>
        <div style={styles.subtitle}>
          {token.tokenSymbol || '???'} on <strong>{token.chain}</strong>
        </div>
      </div>
      <button style={styles.close} onClick={() => setVisible(false)}>
        ×
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#1a2332',
    border: '1px solid #30363d',
    animation: 'slideIn 0.3s ease-out',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#58a6ff',
  },
  subtitle: {
    fontSize: 13,
    color: '#8b949e',
    marginTop: 2,
  },
  close: {
    background: 'none',
    border: 'none',
    color: '#8b949e',
    fontSize: 20,
    cursor: 'pointer',
    padding: '0 4px',
  },
};
