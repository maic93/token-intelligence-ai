import type { WalletGraphRepository, EdgeData } from '@token-intelligence-ai/database';

export type { WalletEdgeType } from '@token-intelligence-ai/database';
export { WALLET_EDGE_TYPES } from '@token-intelligence-ai/database';

export interface WalletClusterResult {
  clusterId: string;
  members: { wallet: string; role: string; score: number; depth: number }[];
  centralWallet: string | null;
  avgScore: number;
  size: number;
  metrics: {
    degreeCentrality: number;
    density: number;
  };
}

export interface RelationshipScore {
  wallet: string;
  score: number;
  reasons: string[];
}

export interface GraphMetrics {
  inDegree: number;
  outDegree: number;
  totalDegree: number;
  betweenness: number;
  closeness: number;
  eigenvector: number;
  clusterCoefficient: number;
}

export interface WalletLabel {
  label: string;
  confidence: number;
  reason: string;
}

function computeRelationshipScore(
  amount: string,
  frequency: number,
  sameChain: boolean,
  sameFundingSource: boolean,
  sharedDeployers: number,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const amountNum = parseFloat(amount) || 0;
  if (amountNum >= 10) {
    score += 20;
    reasons.push('Large transfer amount');
  } else if (amountNum >= 1) {
    score += 10;
    reasons.push('Moderate transfer amount');
  } else {
    score += 5;
    reasons.push('Small transfer amount');
  }

  if (frequency >= 5) {
    score += 25;
    reasons.push('High transfer frequency');
  } else if (frequency >= 2) {
    score += 15;
    reasons.push('Multiple transfers');
  } else {
    score += 5;
    reasons.push('Single transfer');
  }

  if (sameChain) {
    score += 10;
    reasons.push('Same chain');
  }
  if (sameFundingSource) {
    score += 15;
    reasons.push('Same funding source');
  }
  if (sharedDeployers > 0) {
    score += Math.min(sharedDeployers * 5, 25);
    reasons.push(`Shared ${sharedDeployers} deployer(s)`);
  }

  return { score: Math.min(score, 100), reasons };
}

function computeBetweenness(adjacency: Map<string, Set<string>>, node: string): number {
  let betweenness = 0;
  const nodes = Array.from(adjacency.keys());
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i] === node || nodes[j] === node) continue;
      const paths = bfsShortestPaths(adjacency, nodes[i], nodes[j]);
      if (paths.length === 0) continue;
      const throughNode = paths.filter((p) => p.includes(node));
      betweenness += throughNode.length / paths.length;
    }
  }
  return Math.round(betweenness * 100) / 100;
}

function bfsShortestPaths(
  adjacency: Map<string, Set<string>>,
  start: string,
  end: string,
): string[][] {
  if (!adjacency.has(start) || !adjacency.has(end)) return [];
  const visited = new Set<string>([start]);
  const queue: { node: string; path: string[] }[] = [{ node: start, path: [start] }];
  const result: string[][] = [];

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    if (node === end) {
      result.push(path);
      continue;
    }
    if (result.length > 0 && path.length >= result[0].length) continue;

    const neighbors = adjacency.get(node);
    if (!neighbors) continue;
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }
  return result;
}

function computeCloseness(adjacency: Map<string, Set<string>>, node: string): number {
  const distances = new Map<string, number>();
  const queue: { node: string; dist: number }[] = [{ node, dist: 0 }];
  distances.set(node, 0);

  while (queue.length > 0) {
    const { node: current, dist } = queue.shift()!;
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;
    for (const neighbor of neighbors) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, dist + 1);
        queue.push({ node: neighbor, dist: dist + 1 });
      }
    }
  }

  const totalDist = Array.from(distances.values()).reduce((s, d) => s + d, 0);
  const reachable = distances.size - 1;
  if (reachable === 0 || totalDist === 0) return 0;
  return Math.round((reachable / totalDist) * 100) / 100;
}

function computeEigenvector(
  adjacency: Map<string, Set<string>>,
  iterations = 10,
): Map<string, number> {
  const scores = new Map<string, number>();
  for (const node of adjacency.keys()) scores.set(node, 1);

  for (let iter = 0; iter < iterations; iter++) {
    const newScores = new Map<string, number>();
    for (const node of adjacency.keys()) {
      let sum = 0;
      const neighbors = adjacency.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          sum += scores.get(neighbor) ?? 0;
        }
      }
      newScores.set(node, sum);
    }
    const norm = Math.sqrt(Array.from(newScores.values()).reduce((s, v) => s + v * v, 0));
    if (norm > 0) {
      for (const [node, score] of newScores) scores.set(node, score / norm);
    }
  }
  return scores;
}

function computeClusterCoefficient(adjacency: Map<string, Set<string>>, node: string): number {
  const neighbors = adjacency.get(node);
  if (!neighbors || neighbors.size < 2) return 0;
  let connections = 0;
  const neighborArr = Array.from(neighbors);
  for (let i = 0; i < neighborArr.length; i++) {
    for (let j = i + 1; j < neighborArr.length; j++) {
      const n1 = adjacency.get(neighborArr[i]);
      if (n1 && n1.has(neighborArr[j])) connections++;
    }
  }
  const possible = (neighbors.size * (neighbors.size - 1)) / 2;
  return possible > 0 ? connections / possible : 0;
}

export async function buildWalletGraph(
  repo: WalletGraphRepository,
  wallets: string[],
): Promise<{ edges: EdgeData[]; adjacency: Map<string, Set<string>> }> {
  const edges = await repo.findEdgesBatch(wallets, wallets);
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!adjacency.has(edge.fromWallet)) adjacency.set(edge.fromWallet, new Set());
    if (!adjacency.has(edge.toWallet)) adjacency.set(edge.toWallet, new Set());
    adjacency.get(edge.fromWallet)!.add(edge.toWallet);
    adjacency.get(edge.toWallet)!.add(edge.fromWallet);
  }
  return { edges, adjacency };
}

export async function findRecursiveFunding(
  repo: WalletGraphRepository,
  wallet: string,
  depth = 5,
): Promise<{ chain: string[]; time: string[]; amount: string[]; edgeConfidence: number[] }> {
  const tree = await repo.findFundingTree(wallet, depth);
  const chain: string[] = [];
  const time: string[] = [];
  const amount: string[] = [];
  const edgeConfidence: number[] = [];
  for (const node of tree) {
    for (const funder of node.funders) {
      chain.push(wallet);
      time.push(funder.timestamp);
      amount.push(funder.amount);
      edgeConfidence.push(funder.confidence);
    }
  }
  return { chain, time, amount, edgeConfidence };
}

export async function findFundingClusters(
  repo: WalletGraphRepository,
  _wallets: string[],
): Promise<WalletClusterResult[]> {
  const clusters: WalletClusterResult[] = [];
  const clusterMap = new Map<
    string,
    {
      wallets: Set<string>;
      roles: Map<string, string>;
      scores: Map<string, number>;
      depths: Map<string, number>;
    }
  >();

  const allEdges = await repo.findEdges(undefined, undefined, undefined, undefined, 1000);
  for (const edge of allEdges) {
    const clusterKey = `${edge.fromWallet}-${edge.toWallet}`;
    if (!clusterMap.has(clusterKey)) {
      clusterMap.set(clusterKey, {
        wallets: new Set(),
        roles: new Map(),
        scores: new Map(),
        depths: new Map(),
      });
    }
    const cluster = clusterMap.get(clusterKey)!;
    cluster.wallets.add(edge.fromWallet);
    cluster.wallets.add(edge.toWallet);
    const existingScore = cluster.scores.get(edge.fromWallet) ?? 0;
    cluster.scores.set(edge.fromWallet, existingScore + edge.confidence);
    cluster.scores.set(edge.toWallet, (cluster.scores.get(edge.toWallet) ?? 0) + edge.confidence);
  }

  let clusterIdx = 0;
  for (const [, data] of clusterMap) {
    if (data.wallets.size < 2) continue;
    const walletArr = Array.from(data.wallets);
    const centralWallet = walletArr.reduce((a, b) =>
      (data.scores.get(a) ?? 0) > (data.scores.get(b) ?? 0) ? a : b,
    );
    const avgScore = Math.round(
      Array.from(data.scores.values()).reduce((s, v) => s + v, 0) / data.scores.size,
    );
    const adj = new Map<string, Set<string>>();
    for (const w of walletArr) adj.set(w, new Set(walletArr.filter((x) => x !== w)));

    const clusterId = `cg-${clusterIdx++}`;
    for (const w of walletArr) {
      const role = w === centralWallet ? 'central' : 'member';
      await repo.saveCluster(clusterId, w, role, data.scores.get(w) ?? 0, 1);
    }

    clusters.push({
      clusterId,
      members: walletArr.map((w) => ({
        wallet: w,
        role: data.roles.get(w) ?? 'member',
        score: data.scores.get(w) ?? 0,
        depth: data.depths.get(w) ?? 0,
      })),
      centralWallet,
      avgScore,
      size: data.wallets.size,
      metrics: {
        degreeCentrality: data.wallets.size - 1,
        density: data.wallets.size > 1 ? 1 : 0,
      },
    });
  }

  return clusters.sort((a, b) => b.avgScore - a.avgScore).slice(0, 50);
}

export async function detectClusters(repo: WalletGraphRepository): Promise<WalletClusterResult[]> {
  const wallets = Array.from(
    new Set([
      ...(await repo.findEdges(undefined, undefined, undefined, undefined, 1000)).flatMap((e) => [
        e.fromWallet,
        e.toWallet,
      ]),
    ]),
  );
  return findFundingClusters(repo, wallets);
}

export async function findShortestFundingPath(
  repo: WalletGraphRepository,
  from: string,
  to: string,
  depth = 5,
): Promise<{ path: string[]; confidence: number } | null> {
  const result = await repo.findPath(from, to, depth);
  if (!result) return null;
  return { path: result.wallets, confidence: result.totalConfidence };
}

export async function findConnectedWallets(
  repo: WalletGraphRepository,
  wallet: string,
  depth = 3,
): Promise<RelationshipScore[]> {
  const connected = await repo.findConnectedWallets(wallet, depth);
  return connected.map((c) => ({
    wallet: c.wallet,
    score: c.score,
    reasons: [`Distance: ${c.distance}`, `Confidence: ${c.score}`],
  }));
}

export async function findCommonFunders(
  repo: WalletGraphRepository,
  walletA: string,
  walletB: string,
): Promise<{ funder: string; amountA: string; amountB: string; totalConfidence: number }[]> {
  return repo.findCommonFunders(walletA, walletB);
}

export async function findCommonDeployers(
  repo: WalletGraphRepository,
  walletA: string,
  walletB: string,
): Promise<{ deployer: string; count: number }[]> {
  return repo.findCommonDeployers(walletA, walletB);
}

export async function findCircularFunding(
  repo: WalletGraphRepository,
): Promise<{ wallet: string; cycle: string[]; confidence: number }[]> {
  return repo.findCircularFunding(5);
}

export function assignWalletLabels(metrics: GraphMetrics, edges: EdgeData[]): WalletLabel[] {
  const labels: WalletLabel[] = [];

  if (metrics.totalDegree > 20) {
    labels.push({ label: 'Likely Team Wallet', confidence: 70, reason: 'High degree centrality' });
  }
  if (metrics.betweenness > 0.5) {
    labels.push({
      label: 'Likely Funding Wallet',
      confidence: 75,
      reason: 'High betweenness centrality',
    });
  }
  if (metrics.outDegree > 10 && metrics.inDegree < 3) {
    labels.push({ label: 'Likely Sniper', confidence: 65, reason: 'Many outgoing, few incoming' });
  }
  if (metrics.inDegree > 10 && metrics.outDegree > 5) {
    labels.push({
      label: 'Likely Market Maker',
      confidence: 60,
      reason: 'High inbound and outbound flow',
    });
  }

  const cexCount = edges.filter((e) => e.edgeType === 'CEX').length;
  if (cexCount > 5) {
    labels.push({
      label: 'Likely CEX Wallet',
      confidence: 80,
      reason: `${cexCount} CEX transactions`,
    });
  }

  const bridgeCount = edges.filter((e) => e.edgeType === 'Bridge').length;
  if (bridgeCount > 3) {
    labels.push({
      label: 'Likely Bridge Wallet',
      confidence: 75,
      reason: `${bridgeCount} bridge transactions`,
    });
  }

  if (metrics.totalDegree <= 2) {
    labels.push({ label: 'Likely Fresh Wallet', confidence: 50, reason: 'Very few connections' });
  }

  if (metrics.outDegree > 30 && metrics.clusterCoefficient < 0.1) {
    labels.push({ label: 'Likely Bot', confidence: 60, reason: 'High out-degree, low clustering' });
  }

  const totalEdges = edges.length;
  if (totalEdges > 0) {
    const contractRatio = edges.filter((e) => e.edgeType === 'Contract').length / totalEdges;
    if (contractRatio > 0.5) {
      labels.push({
        label: 'Likely Dev Wallet',
        confidence: 70,
        reason: 'High contract interaction ratio',
      });
    }
  }

  return labels;
}

export function computeGraphMetrics(
  adjacency: Map<string, Set<string>>,
  wallet: string,
): GraphMetrics {
  const neighbors = adjacency.get(wallet);
  const degree = neighbors?.size ?? 0;
  const inDegree = degree;
  const outDegree = degree;
  const totalDegree = degree;
  const betweennessVal = computeBetweenness(adjacency, wallet);
  const closeness = computeCloseness(adjacency, wallet);
  const eigenScores = computeEigenvector(adjacency);
  const eigenvector = eigenScores.get(wallet) ?? 0;
  const clusterCoefficient = computeClusterCoefficient(adjacency, wallet);

  return {
    inDegree,
    outDegree,
    totalDegree,
    betweenness: betweennessVal,
    closeness,
    eigenvector: Math.round(eigenvector * 100) / 100,
    clusterCoefficient: Math.round(clusterCoefficient * 100) / 100,
  };
}

export { computeRelationshipScore };
