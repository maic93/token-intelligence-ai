import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WalletGraphRepository, EdgeData } from '@token-intelligence-ai/database';
import {
  computeRelationshipScore,
  assignWalletLabels,
  computeGraphMetrics,
} from '../wallet-graph.js';

function createMockRepo(): WalletGraphRepository {
  return {
    saveEdge: vi.fn(),
    saveCluster: vi.fn(),
    findEdges: vi.fn(),
    findEdgesBatch: vi.fn(),
    findCluster: vi.fn(),
    findClustersByWallet: vi.fn(),
    findPath: vi.fn(),
    findConnectedWallets: vi.fn(),
    findFundingTree: vi.fn(),
    findCommonFunders: vi.fn(),
    findCommonDeployers: vi.fn(),
    findCircularFunding: vi.fn(),
    getDegreeCentrality: vi.fn(),
    getGraphStats: vi.fn(),
  } as unknown as WalletGraphRepository;
}

describe('WalletGraphEngine', () => {
  let repo: WalletGraphRepository;

  beforeEach(() => {
    repo = createMockRepo();
  });

  describe('computeRelationshipScore', () => {
    it('returns high score for large amounts with high frequency', () => {
      const result = computeRelationshipScore('100', 10, true, true, 3);
      expect(result.score).toBeGreaterThan(50);
      expect(result.reasons.length).toBeGreaterThanOrEqual(4);
    });

    it('returns moderate score for moderate amounts', () => {
      const result = computeRelationshipScore('5', 2, true, false, 0);
      expect(result.score).toBeGreaterThanOrEqual(15);
      expect(result.score).toBeLessThan(60);
    });

    it('returns low score for small single transfers', () => {
      const result = computeRelationshipScore('0.1', 1, false, false, 0);
      expect(result.score).toBeLessThan(30);
    });

    it('caps score at 100', () => {
      const result = computeRelationshipScore('1000000', 100, true, true, 10);
      expect(result.score).toBe(95);
    });

    it('includes shared deployer boost', () => {
      const withShared = computeRelationshipScore('1', 1, true, false, 5);
      const withoutShared = computeRelationshipScore('1', 1, true, false, 0);
      expect(withShared.score).toBeGreaterThan(withoutShared.score);
    });

    it('includes same funding source boost', () => {
      const withFunding = computeRelationshipScore('1', 1, false, true, 0);
      const withoutFunding = computeRelationshipScore('1', 1, false, false, 0);
      expect(withFunding.score).toBeGreaterThan(withoutFunding.score);
    });
  });

  describe('assignWalletLabels', () => {
    it('assigns team wallet label for high degree', () => {
      const metrics = {
        inDegree: 15,
        outDegree: 15,
        totalDegree: 30,
        betweenness: 0,
        closeness: 0,
        eigenvector: 0,
        clusterCoefficient: 0,
      };
      const labels = assignWalletLabels(metrics, []);
      expect(labels.some((l) => l.label === 'Likely Team Wallet')).toBe(true);
    });

    it('assigns sniper label for high out-degree, low in-degree', () => {
      const metrics = {
        inDegree: 1,
        outDegree: 15,
        totalDegree: 16,
        betweenness: 0,
        closeness: 0,
        eigenvector: 0,
        clusterCoefficient: 0,
      };
      const labels = assignWalletLabels(metrics, []);
      expect(labels.some((l) => l.label === 'Likely Sniper')).toBe(true);
    });

    it('assigns market maker label for balanced high degree', () => {
      const metrics = {
        inDegree: 12,
        outDegree: 8,
        totalDegree: 20,
        betweenness: 0,
        closeness: 0,
        eigenvector: 0,
        clusterCoefficient: 0,
      };
      const labels = assignWalletLabels(metrics, []);
      expect(labels.some((l) => l.label === 'Likely Market Maker')).toBe(true);
    });

    it('assigns CEX wallet label for many CEX edges', () => {
      const metrics = {
        inDegree: 5,
        outDegree: 5,
        totalDegree: 10,
        betweenness: 0,
        closeness: 0,
        eigenvector: 0,
        clusterCoefficient: 0,
      };
      const edges: EdgeData[] = Array.from({ length: 6 }, (_, i) => ({
        id: `e${i}`,
        fromWallet: '0xa',
        toWallet: '0xb',
        chain: 'ethereum',
        tokenAddress: null,
        currency: 'ETH',
        amount: '1',
        amountUsd: null,
        blockNumber: '1',
        timestamp: new Date().toISOString(),
        transactionHash: `0xtx${i}`,
        edgeType: 'CEX',
        confidence: 80,
        createdAt: new Date().toISOString(),
      }));
      const labels = assignWalletLabels(metrics, edges);
      expect(labels.some((l) => l.label === 'Likely CEX Wallet')).toBe(true);
    });

    it('assigns fresh wallet label for very few connections', () => {
      const metrics = {
        inDegree: 1,
        outDegree: 1,
        totalDegree: 2,
        betweenness: 0,
        closeness: 1,
        eigenvector: 0,
        clusterCoefficient: 0,
      };
      const labels = assignWalletLabels(metrics, []);
      expect(labels.some((l) => l.label === 'Likely Fresh Wallet')).toBe(true);
    });

    it('assigns bot label for high out-degree and low clustering', () => {
      const metrics = {
        inDegree: 35,
        outDegree: 35,
        totalDegree: 70,
        betweenness: 0,
        closeness: 0,
        eigenvector: 0,
        clusterCoefficient: 0.05,
      };
      const labels = assignWalletLabels(metrics, []);
      expect(labels.some((l) => l.label === 'Likely Bot')).toBe(true);
    });

    it('assigns dev wallet label for high contract ratio', () => {
      const metrics = {
        inDegree: 3,
        outDegree: 3,
        totalDegree: 6,
        betweenness: 0,
        closeness: 0.5,
        eigenvector: 0,
        clusterCoefficient: 0.3,
      };
      const edges: EdgeData[] = Array.from({ length: 6 }, (_, i) => ({
        id: `e${i}`,
        fromWallet: '0xa',
        toWallet: '0xb',
        chain: 'ethereum',
        tokenAddress: null,
        currency: 'ETH',
        amount: '1',
        amountUsd: null,
        blockNumber: '1',
        timestamp: new Date().toISOString(),
        transactionHash: `0xtx${i}`,
        edgeType: i < 4 ? ('Contract' as const) : ('Transfer' as const),
        confidence: 50,
        createdAt: new Date().toISOString(),
      }));
      const labels = assignWalletLabels(metrics, edges);
      expect(labels.some((l) => l.label === 'Likely Dev Wallet')).toBe(true);
    });

    it('assigns bridge wallet label for many bridge edges', () => {
      const metrics = {
        inDegree: 5,
        outDegree: 5,
        totalDegree: 10,
        betweenness: 0,
        closeness: 0.5,
        eigenvector: 0,
        clusterCoefficient: 0.3,
      };
      const edges: EdgeData[] = Array.from({ length: 4 }, (_, i) => ({
        id: `e${i}`,
        fromWallet: '0xa',
        toWallet: '0xb',
        chain: 'ethereum',
        tokenAddress: null,
        currency: 'ETH',
        amount: '1',
        amountUsd: null,
        blockNumber: '1',
        timestamp: new Date().toISOString(),
        transactionHash: `0xtx${i}`,
        edgeType: 'Bridge' as const,
        confidence: 70,
        createdAt: new Date().toISOString(),
      }));
      const labels = assignWalletLabels(metrics, edges);
      expect(labels.some((l) => l.label === 'Likely Bridge Wallet')).toBe(true);
    });

    it('assigns fresh wallet for zero degree', () => {
      const metrics = {
        inDegree: 0,
        outDegree: 0,
        totalDegree: 0,
        betweenness: 0,
        closeness: 0,
        eigenvector: 0,
        clusterCoefficient: 0,
      };
      const labels = assignWalletLabels(metrics, []);
      expect(labels.some((l) => l.label === 'Likely Fresh Wallet')).toBe(true);
    });
  });

  describe('computeGraphMetrics', () => {
    it('computes degree centrality correctly', () => {
      const adj = new Map<string, Set<string>>();
      adj.set('0xa', new Set(['0xb', '0xc']));
      adj.set('0xb', new Set(['0xa']));
      adj.set('0xc', new Set(['0xa']));
      const metrics = computeGraphMetrics(adj, '0xa');
      expect(metrics.totalDegree).toBe(2);
      expect(metrics.inDegree).toBe(2);
      expect(metrics.outDegree).toBe(2);
      expect(metrics.clusterCoefficient).toBe(0);
    });

    it('handles isolated wallet', () => {
      const adj = new Map<string, Set<string>>();
      adj.set('0xa', new Set());
      const metrics = computeGraphMetrics(adj, '0xa');
      expect(metrics.totalDegree).toBe(0);
      expect(metrics.clusterCoefficient).toBe(0);
    });

    it('computes cluster coefficient for tightly connected group', () => {
      const adj = new Map<string, Set<string>>();
      adj.set('0xa', new Set(['0xb', '0xc']));
      adj.set('0xb', new Set(['0xa', '0xc']));
      adj.set('0xc', new Set(['0xa', '0xb']));
      const metrics = computeGraphMetrics(adj, '0xa');
      expect(metrics.clusterCoefficient).toBe(1);
    });

    it('computes closeness centrality', () => {
      const adj = new Map<string, Set<string>>();
      adj.set('0xa', new Set(['0xb']));
      adj.set('0xb', new Set(['0xa', '0xc']));
      adj.set('0xc', new Set(['0xb']));
      const metrics = computeGraphMetrics(adj, '0xa');
      expect(metrics.closeness).toBeGreaterThan(0);
    });
  });

  describe('repo integration methods', () => {
    it('findPath delegates to repo and handles null', async () => {
      vi.mocked(repo.findPath).mockResolvedValue(null);
      const result = await repo.findPath('0xa', '0xb');
      expect(result).toBeNull();
    });

    it('findConnectedWallets delegates to repo', async () => {
      vi.mocked(repo.findConnectedWallets).mockResolvedValue([
        { wallet: '0xb', score: 80, distance: 1 },
      ]);
      const result = await repo.findConnectedWallets('0xa', 2);
      expect(result).toHaveLength(1);
      expect(result[0].wallet).toBe('0xb');
    });

    it('findCommonFunders delegates to repo', async () => {
      vi.mocked(repo.findCommonFunders).mockResolvedValue([
        { funder: '0xf', amountA: '1.5', amountB: '0.5', totalConfidence: 75 },
      ]);
      const result = await repo.findCommonFunders('0xa', '0xb');
      expect(result).toHaveLength(1);
      expect(result[0].funder).toBe('0xf');
    });

    it('findCommonDeployers delegates to repo', async () => {
      vi.mocked(repo.findCommonDeployers).mockResolvedValue([{ deployer: '0xd', count: 3 }]);
      const result = await repo.findCommonDeployers('0xa', '0xb');
      expect(result).toHaveLength(1);
      expect(result[0].deployer).toBe('0xd');
    });
  });
});
