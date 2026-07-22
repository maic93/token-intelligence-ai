interface ClusterExplorerProps {
  clusters: Array<{
    clusterId: string;
    members: Array<{ wallet: string; role: string; score: number; depth: number }>;
    centralWallet: string | null;
    avgScore: number;
    size: number;
    metrics: { degreeCentrality: number; density: number };
  }>;
  onWalletClick?: (wallet: string) => void;
}

export function ClusterExplorer({ clusters, onWalletClick }: ClusterExplorerProps) {
  if (!clusters || clusters.length === 0) {
    return <div className="empty-state">No clusters found</div>;
  }

  return (
    <div className="cluster-explorer">
      <div className="cluster-grid">
        {clusters.map((cluster) => (
          <div key={cluster.clusterId} className="cluster-card">
            <div className="cluster-header">
              <div className="cluster-title">{cluster.clusterId}</div>
              <div className="cluster-badges">
                <span className="badge badge-info">{cluster.size} members</span>
                <span className="badge badge-primary">Score: {cluster.avgScore}</span>
              </div>
            </div>
            <div className="cluster-metrics">
              <div className="metric">
                <span className="metric-label">Centrality</span>
                <span className="metric-value">{cluster.metrics.degreeCentrality.toFixed(1)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Density</span>
                <span className="metric-value">{(cluster.metrics.density * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="cluster-members">
              <div className="section-subtitle">Members</div>
              {cluster.members.map((member) => (
                <div
                  key={member.wallet}
                  className="member-row"
                  onClick={() => onWalletClick?.(member.wallet)}
                  style={{ cursor: onWalletClick ? 'pointer' : 'default' }}
                >
                  <div className="member-address">{member.wallet.slice(0, 10)}...</div>
                  <div className="member-details">
                    <span className={`badge badge-role badge-${member.role}`}>{member.role}</span>
                    <span className="badge badge-score">Score: {member.score}</span>
                    <span className="badge badge-depth">Depth: {member.depth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
