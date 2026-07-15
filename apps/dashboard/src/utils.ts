export function explorerUrl(chain: string, address: string): string {
  const explorers: Record<string, string> = {
    base: 'https://basescan.org',
    robinhood: 'https://explorer.robinhood.com',
    ethereum: 'https://etherscan.io',
    polygon: 'https://polygonscan.com',
  };
  const base = explorers[chain] ?? explorers.base;
  return `${base}/address/${address}`;
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function timeAgo(timestamp: string): string {
  const ms = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
