import { useState } from 'react';

interface FundingTreeProps {
  tree: Array<{
    wallet: string;
    funders: Array<{ from: string; amount: string; timestamp: string; confidence: number }>;
    depth: number;
  }>;
  onWalletClick?: (wallet: string) => void;
}

function FundingNode({
  node,
  depth,
  onWalletClick,
}: {
  node: FundingTreeProps['tree'][0];
  depth: number;
  onWalletClick?: (wallet: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);

  return (
    <div className="funding-node" style={{ marginLeft: depth * 24 }}>
      <div className="funding-node-header" onClick={() => setExpanded(!expanded)}>
        <span className="funding-expand-icon">{expanded ? '▼' : '▶'}</span>
        <span
          className="funding-wallet"
          onClick={(e) => {
            e.stopPropagation();
            onWalletClick?.(node.wallet);
          }}
          style={{ cursor: onWalletClick ? 'pointer' : 'default' }}
        >
          {node.wallet.slice(0, 10)}...
        </span>
        <span className="badge badge-depth">Depth {node.depth}</span>
        <span className="badge badge-info">{node.funders.length} funders</span>
      </div>
      {expanded && (
        <div className="funding-funders">
          {node.funders.length === 0 && <div className="funding-empty">No known funders</div>}
          {node.funders.map((funder, i) => (
            <div key={i} className="funder-row">
              <span
                className="funder-address"
                onClick={() => onWalletClick?.(funder.from)}
                style={{ cursor: onWalletClick ? 'pointer' : 'default' }}
              >
                {funder.from.slice(0, 10)}...
              </span>
              <span className="funder-amount">{funder.amount}</span>
              <span className="funder-confidence">Conf: {funder.confidence}%</span>
              <span className="funder-time">{new Date(funder.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FundingTree({ tree, onWalletClick }: FundingTreeProps) {
  if (!tree || tree.length === 0) {
    return <div className="empty-state">No funding tree data</div>;
  }

  return (
    <div className="funding-tree">
      <div className="funding-tree-header">
        <div className="section-subtitle">Funding Tree</div>
      </div>
      <div className="funding-tree-nodes">
        {tree.map((node, i) => (
          <FundingNode
            key={`${node.wallet}-${i}`}
            node={node}
            depth={node.depth}
            onWalletClick={onWalletClick}
          />
        ))}
      </div>
    </div>
  );
}
