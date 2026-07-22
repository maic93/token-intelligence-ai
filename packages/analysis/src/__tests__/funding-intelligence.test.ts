import { describe, it, expect } from 'vitest';
import { analyzeFunding, buildFundingGraph, parseFundingAmount } from '../funding-intelligence.js';
import type { RpcTraceCall } from '../funding-intelligence.js';

function makeTx(overrides: Partial<RpcTraceCall> = {}): RpcTraceCall {
  return {
    from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    value: '0x0de0b6b3a7640000',
    hash: '0x' + 'c'.repeat(64),
    blockNumber: 1n,
    timestamp: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('analyzeFunding', () => {
  const deployer = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const deployerBlockTimestamp = new Date('2025-01-01T12:00:00Z');

  it('returns Unknown when no inbound transfers', () => {
    const result = analyzeFunding(
      {
        deployer,
        deployerFirstSeen: deployerBlockTimestamp,
        deployerTxHash: '0x' + 'c'.repeat(64),
        deployerBlockNumber: 1n,
        deployerBlockTimestamp,
      },
      [],
    );
    expect(result.fundingSourceType).toBe('Unknown');
    expect(result.fundedBy).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('returns Unknown when inbound transfers have no native value', () => {
    const txs = [makeTx({ value: '0x0', to: deployer })];
    const result = analyzeFunding(
      {
        deployer,
        deployerFirstSeen: deployerBlockTimestamp,
        deployerTxHash: '0x' + 'c'.repeat(64),
        deployerBlockNumber: 1n,
        deployerBlockTimestamp,
      },
      txs,
    );
    expect(result.fundingSourceType).toBe('Unknown');
    expect(result.fundedBy).toBeNull();
  });

  it('detects first inbound native transfer', () => {
    const txs = [
      makeTx({
        from: '0xcccccccccccccccccccccccccccccccccccccccc',
        value: '0x0de0b6b3a7640000',
        to: deployer,
      }),
    ];
    const result = analyzeFunding(
      {
        deployer,
        deployerFirstSeen: deployerBlockTimestamp,
        deployerTxHash: '0x' + 'c'.repeat(64),
        deployerBlockNumber: 1n,
        deployerBlockTimestamp,
      },
      txs,
    );
    expect(result.fundedBy).toBe('0xcccccccccccccccccccccccccccccccccccccccc');
    expect(result.fundingSourceType).toBe('eoa');
    expect(result.confidence).toBeGreaterThanOrEqual(70);
  });

  it('uses the earliest inbound transfer', () => {
    const txs = [
      makeTx({
        from: '0xcccccccccccccccccccccccccccccccccccccccc',
        value: '0x0de0b6b3a7640000',
        to: deployer,
        blockNumber: 5n,
        timestamp: new Date('2025-01-01T10:00:00Z'),
      }),
      makeTx({
        from: '0xdddddddddddddddddddddddddddddddddddddddd',
        value: '0x0de0b6b3a7640000',
        to: deployer,
        blockNumber: 2n,
        timestamp: new Date('2025-01-01T08:00:00Z'),
      }),
    ];
    const result = analyzeFunding(
      {
        deployer,
        deployerFirstSeen: deployerBlockTimestamp,
        deployerTxHash: '0x' + 'c'.repeat(64),
        deployerBlockNumber: 1n,
        deployerBlockTimestamp,
      },
      txs,
    );
    expect(result.fundedBy).toBe('0xdddddddddddddddddddddddddddddddddddddddd');
  });

  it('ignores transfers to non-deployer', () => {
    const txs = [
      makeTx({
        from: '0xcccccccccccccccccccccccccccccccccccccccc',
        value: '0x0de0b6b3a7640000',
        to: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      }),
    ];
    const result = analyzeFunding(
      {
        deployer,
        deployerFirstSeen: deployerBlockTimestamp,
        deployerTxHash: '0x' + 'c'.repeat(64),
        deployerBlockNumber: 1n,
        deployerBlockTimestamp,
      },
      txs,
    );
    expect(result.fundingSourceType).toBe('Unknown');
  });

  it('calculates time to deployment', () => {
    const txs = [makeTx({ to: deployer, timestamp: new Date('2025-01-01T10:00:00Z') })];
    const result = analyzeFunding(
      {
        deployer,
        deployerFirstSeen: deployerBlockTimestamp,
        deployerTxHash: '0x' + 'c'.repeat(64),
        deployerBlockNumber: 1n,
        deployerBlockTimestamp,
      },
      txs,
    );
    expect(result.timeToDeploymentMinutes).toBe(120);
  });

  it('returns null time to deployment when no funding timestamp', () => {
    const result = analyzeFunding(
      {
        deployer,
        deployerFirstSeen: deployerBlockTimestamp,
        deployerTxHash: '0x' + 'c'.repeat(64),
        deployerBlockNumber: 1n,
        deployerBlockTimestamp,
      },
      [],
    );
    expect(result.timeToDeploymentMinutes).toBeNull();
  });
});

describe('parseFundingAmount', () => {
  it('converts wei to ETH', () => {
    expect(parseFundingAmount('0x0de0b6b3a7640000')).toBeCloseTo(1, 10);
  });

  it('converts large amounts correctly', () => {
    expect(parseFundingAmount('0x8ac7230489e80000')).toBeCloseTo(10, 10);
  });

  it('returns null for null input', () => {
    expect(parseFundingAmount(null)).toBeNull();
  });

  it('returns null for invalid hex', () => {
    expect(parseFundingAmount('invalid')).toBeNull();
  });
});

describe('buildFundingGraph', () => {
  it('returns empty graph for empty profiles', () => {
    const graph = buildFundingGraph([]);
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });

  it('builds nodes and edges for connected profiles', () => {
    const profiles = [
      { wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', fundedBy: '0xfunder' },
      { wallet: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', fundedBy: '0xfunder' },
    ];
    const graph = buildFundingGraph(profiles);
    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
  });

  it('includes unfunded wallets as nodes with no edge', () => {
    const profiles = [{ wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', fundedBy: null }];
    const graph = buildFundingGraph(profiles);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(0);
  });

  it('deduplicates nodes with same wallet and funder', () => {
    const profiles = [
      { wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', fundedBy: '0xfunder' },
      { wallet: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', fundedBy: '0xfunder' },
    ];
    const graph = buildFundingGraph(profiles);
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(2);
  });
});
