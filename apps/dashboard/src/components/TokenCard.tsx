import type { Token } from '../api.js';

interface Props {
  token: Token;
}

const CHAIN_COLORS: Record<string, string> = {
  base: '#0052ff',
  ethereum: '#627eea',
  polygon: '#8247e5',
  robinhood: '#00c805',
};

export function TokenCard({ token }: Props) {
  const chainColor = CHAIN_COLORS[token.chain] ?? '#8b949e';
  const addressShort = `${token.contractAddress.slice(0, 6)}...${token.contractAddress.slice(-4)}`;
  const deployerShort = `${token.deployer.slice(0, 6)}...${token.deployer.slice(-4)}`;
  const timeAgo = getTimeAgo(new Date(token.blockTimestamp));

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.chainBadge(chainColor)}>{token.chain}</div>
        <span style={styles.time}>{timeAgo}</span>
      </div>

      <div style={styles.body}>
        <h3 style={styles.symbol}>{token.tokenSymbol || '???'}</h3>
        <p style={styles.name}>{token.tokenName || 'Unknown Token'}</p>
      </div>

      <div style={styles.details}>
        <DetailRow label="Address" value={addressShort} />
        <DetailRow label="Deployer" value={deployerShort} />
        <DetailRow label="Decimals" value={String(token.decimals)} />
        <DetailRow label="Supply" value={formatSupply(token.totalSupply)} />
        <DetailRow label="Block" value={`#${Number(token.blockNumber).toLocaleString()}`} />
      </div>

      <a
        style={styles.link}
        href={`https://basescan.org/tx/${token.transactionHash}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Basescan →
      </a>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value}</span>
    </div>
  );
}

function formatSupply(supply: string): string {
  if (!supply || supply === '0') return '0';
  const num = BigInt(supply);
  if (num === 0n) return '0';
  const str = num.toString();
  if (str.length > 18) {
    const whole = str.slice(0, -18);
    const dec = str.slice(-18, -14);
    return `${whole}.${dec}...`;
  }
  return `0.${str.padStart(18, '0').slice(0, 4)}...`;
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles: Record<string, any> = {
  card: {
    backgroundColor: '#161b22',
    border: '1px solid #30363d',
    borderRadius: 12,
    padding: 20,
    transition: 'border-color 0.2s',
    cursor: 'default',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chainBadge: (color: string) => ({
    padding: '4px 10px',
    borderRadius: 20,
    backgroundColor: color + '20',
    color: color,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  }),
  time: {
    fontSize: 12,
    color: '#8b949e',
  },
  body: {
    marginBottom: 16,
  },
  symbol: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: '#e1e4e8',
    fontFamily: 'monospace',
  },
  name: {
    fontSize: 13,
    color: '#8b949e',
    margin: '4px 0 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  details: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
  },
  label: {
    color: '#8b949e',
  },
  value: {
    color: '#e1e4e8',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  link: {
    display: 'block',
    textAlign: 'center' as const,
    padding: '8px',
    borderRadius: 8,
    backgroundColor: '#21262d',
    color: '#58a6ff',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
  },
};
