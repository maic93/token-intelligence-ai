import { useState, useCallback } from 'react';
import { WalletGraph } from './WalletGraph';
import { ClusterExplorer } from './ClusterExplorer';
import { FundingTree } from './FundingTree';
import { Share2, Search, Code2, Activity, Users, GitBranch } from 'lucide-react';

const API_BASE = '/api';

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  score: number;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
  confidence: number;
}

interface ConnectedWallet {
  wallet: string;
  score: number;
  distance: number;
}

interface ClusterData {
  clusterId: string;
  members: Array<{ wallet: string; role: string; score: number; depth: number }>;
  centralWallet: string | null;
  avgScore: number;
  size: number;
  metrics: { degreeCentrality: number; density: number };
}

interface GraphMetrics {
  totalDegree: number;
  inDegree: number;
  outDegree: number;
  betweenness: number;
  closeness: number;
  eigenvector: number;
  clusterCoefficient: number;
}

interface WalletLabel {
  label: string;
  confidence: number;
  reason: string;
}

interface CommonFunder {
  funder: string;
  amountA: string;
  amountB: string;
  totalConfidence: number;
}

interface ClusterResponse {
  clusters: ClusterData[];
  metrics: GraphMetrics | null;
  labels: WalletLabel[];
}

interface TreeResponse {
  tree: {
    funders: Array<{
      wallet: string;
      funders: Array<{ from: string; amount: string; timestamp: string; confidence: number }>;
      depth: number;
    }>;
  };
}

interface ConnectedResponse {
  connected: ConnectedWallet[];
}

export function WalletGraphDashboard() {
  const [tab, setTab] = useState<'graph' | 'clusters' | 'funding'>('graph');
  const [walletInput, setWalletInput] = useState('');
  const [walletA, setWalletA] = useState('');
  const [walletB, setWalletB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [fundingTree, setFundingTree] = useState<
    Array<{
      wallet: string;
      funders: Array<{ from: string; amount: string; timestamp: string; confidence: number }>;
      depth: number;
    }>
  >([]);
  const [connected, setConnected] = useState<ConnectedWallet[]>([]);
  const [metrics, setMetrics] = useState<GraphMetrics | null>(null);
  const [labels, setLabels] = useState<WalletLabel[]>([]);
  const [pathResult, setPathResult] = useState<{ path: string[]; confidence: number } | null>(null);
  const [commonFunders, setCommonFunders] = useState<CommonFunder[]>([]);

  const fetchGraph = useCallback(async (wallet: string) => {
    setLoading(true);
    setError('');
    try {
      const [clusterRes, treeRes, connectedRes] = await Promise.all([
        fetch(`${API_BASE}/graph/cluster/${wallet}`).then(
          (r) => r.json() as Promise<ClusterResponse>,
        ),
        fetch(`${API_BASE}/graph/tree/${wallet}`).then((r) => r.json() as Promise<TreeResponse>),
        fetch(`${API_BASE}/graph/connected?wallet=${wallet}&depth=2`).then(
          (r) => r.json() as Promise<ConnectedResponse>,
        ),
      ]);

      setClusters(clusterRes.clusters ?? []);
      setMetrics(clusterRes.metrics ?? null);
      setLabels(clusterRes.labels ?? []);
      setFundingTree(treeRes.tree?.funders ?? []);
      setConnected(connectedRes.connected ?? []);

      const allWallets = new Set<string>();
      allWallets.add(wallet.toLowerCase());
      for (const c of connectedRes.connected ?? []) {
        allWallets.add(c.wallet);
      }

      const nodes: GraphNode[] = Array.from(allWallets).map((w) => ({
        id: w,
        label: w === wallet.toLowerCase() ? 'Target' : w.slice(0, 6),
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 20,
        color: w === wallet.toLowerCase() ? '#3b82f6' : '#10b981',
        score:
          w === wallet.toLowerCase()
            ? 100
            : (connectedRes.connected?.find((c: ConnectedWallet) => c.wallet === w)?.score ?? 50),
      }));

      const edges: GraphEdge[] = [];
      for (const c of connectedRes.connected ?? []) {
        edges.push({
          from: wallet.toLowerCase(),
          to: c.wallet,
          label: `Dist: ${c.distance}`,
          confidence: c.score,
        });
      }

      setGraphNodes(nodes);
      setGraphEdges(edges);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPath = useCallback(async () => {
    if (!walletA || !walletB) return;
    setLoading(true);
    setError('');
    try {
      const [pathRes, fundersRes] = await Promise.all([
        fetch(`${API_BASE}/graph/path?from=${walletA}&to=${walletB}`).then((r) => r.json()),
        fetch(`${API_BASE}/graph/common-funders?walletA=${walletA}&walletB=${walletB}`).then(
          (r) => r.json() as Promise<{ commonFunders: CommonFunder[] }>,
        ),
      ]);
      setPathResult(pathRes.path ? pathRes : null);
      setCommonFunders(fundersRes.commonFunders ?? []);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [walletA, walletB]);

  return (
    <div className="wallet-graph-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <Share2 className="header-icon" />
          <div>
            <h1>Wallet Graph Intelligence</h1>
            <p className="header-subtitle">
              Explore on-chain wallet relationships, funding flows, and hidden clusters
            </p>
          </div>
        </div>
      </div>

      <div className="search-section">
        <div className="search-row">
          <input
            type="text"
            className="search-input"
            placeholder="Enter wallet address..."
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && walletInput) fetchGraph(walletInput);
            }}
          />
          <button
            className="btn btn-primary"
            onClick={() => walletInput && fetchGraph(walletInput)}
            disabled={loading}
          >
            <Search size={16} /> Analyze
          </button>
        </div>
      </div>

      <div className="comparison-section">
        <div className="comparison-row">
          <input
            type="text"
            className="search-input"
            placeholder="Wallet A"
            value={walletA}
            onChange={(e) => setWalletA(e.target.value)}
          />
          <input
            type="text"
            className="search-input"
            placeholder="Wallet B"
            value={walletB}
            onChange={(e) => setWalletB(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={fetchPath}
            disabled={loading || !walletA || !walletB}
          >
            <Code2 size={16} /> Compare
          </button>
        </div>
      </div>

      {loading && <div className="loading-indicator">Analyzing wallet graph...</div>}
      {error && <div className="error-message">{error}</div>}

      {pathResult && (
        <div className="path-result card">
          <div className="card-header">
            <GitBranch size={16} />
            <span>Shortest Path</span>
          </div>
          <div className="path-wallets">
            {pathResult.path.map((w, i) => (
              <span key={w} className="path-wallet">
                {w.slice(0, 10)}...
                {i < pathResult.path.length - 1 && <span className="path-arrow"> → </span>}
              </span>
            ))}
          </div>
          <div className="path-confidence">Confidence: {pathResult.confidence}%</div>
        </div>
      )}

      {commonFunders.length > 0 && (
        <div className="common-funders card">
          <div className="card-header">
            <Users size={16} />
            <span>Common Funders</span>
          </div>
          <div className="funder-list">
            {commonFunders.map((f) => (
              <div key={f.funder} className="funder-item">
                <span className="funder-address">{f.funder.slice(0, 10)}...</span>
                <span className="funder-amounts">
                  A: {f.amountA} | B: {f.amountB}
                </span>
                <span className="badge badge-info">Conf: {f.totalConfidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tab-bar">
        <button
          className={`tab ${tab === 'graph' ? 'active' : ''}`}
          onClick={() => setTab('graph')}
        >
          <Share2 size={14} /> Graph
        </button>
        <button
          className={`tab ${tab === 'clusters' ? 'active' : ''}`}
          onClick={() => setTab('clusters')}
        >
          <Activity size={14} /> Clusters
        </button>
        <button
          className={`tab ${tab === 'funding' ? 'active' : ''}`}
          onClick={() => setTab('funding')}
        >
          <GitBranch size={14} /> Funding Tree
        </button>
      </div>

      {tab === 'graph' && (
        <div className="graph-section">
          {graphNodes.length > 0 ? (
            <>
              <WalletGraph nodes={graphNodes} edges={graphEdges} width={800} height={500} />
              {metrics && (
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-title">Degree Centrality</div>
                    <div className="metric-value">{metrics.totalDegree}</div>
                    <div className="metric-sub">
                      In: {metrics.inDegree} / Out: {metrics.outDegree}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-title">Betweenness</div>
                    <div className="metric-value">{metrics.betweenness}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-title">Closeness</div>
                    <div className="metric-value">{metrics.closeness}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-title">Eigenvector</div>
                    <div className="metric-value">{metrics.eigenvector}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-title">Cluster Coeff</div>
                    <div className="metric-value">{metrics.clusterCoefficient}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-title">Wallet Labels</div>
                    <div className="metric-labels">
                      {labels.map((l, i) => (
                        <div key={i} className="label-item">
                          <span className="label-name">{l.label}</span>
                          <span className="label-conf">({l.confidence}%)</span>
                        </div>
                      ))}
                      {labels.length === 0 && <span className="text-muted">None assigned</span>}
                    </div>
                  </div>
                </div>
              )}
              {connected.length > 0 && (
                <div className="connected-wallets card">
                  <div className="card-header">
                    <Users size={16} />
                    <span>Connected Wallets ({connected.length})</span>
                  </div>
                  <div className="connected-list">
                    {connected.map((c) => (
                      <div key={c.wallet} className="connected-item">
                        <span className="connected-address">{c.wallet.slice(0, 10)}...</span>
                        <span className="badge badge-info">Score: {c.score}</span>
                        <span className="badge badge-secondary">Dist: {c.distance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            !loading && (
              <div className="empty-state">Enter a wallet address to explore its graph</div>
            )
          )}
        </div>
      )}

      {tab === 'clusters' && (
        <ClusterExplorer clusters={clusters} onWalletClick={(w) => setWalletInput(w)} />
      )}

      {tab === 'funding' && (
        <FundingTree tree={fundingTree} onWalletClick={(w) => setWalletInput(w)} />
      )}
    </div>
  );
}
