import { useEffect, useState } from 'react';
import { fetchChains } from '../api';
import type { ChainInfo } from '../types';

interface ChainSelectorProps {
  selected: string;
  onChange: (chain: string) => void;
}

export function ChainSelector({ selected, onChange }: ChainSelectorProps) {
  const [chains, setChains] = useState<ChainInfo[]>([]);

  useEffect(() => {
    let active = true;
    fetchChains()
      .then((res) => {
        if (active) setChains(res.data.chains);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="chain-selector">
      <select value={selected} onChange={(e) => onChange(e.target.value)}>
        <option value="">All Chains</option>
        {chains
          .filter((c) => c.enabled)
          .map((c) => (
            <option key={c.name} value={c.name}>
              {c.displayName}
            </option>
          ))}
      </select>
    </div>
  );
}
