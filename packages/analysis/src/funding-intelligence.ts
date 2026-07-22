import { classifyFundingSource } from '@token-intelligence-ai/shared';
import type { WalletGraphRepository, WalletEdgeType } from '@token-intelligence-ai/database';

export interface FundingAnalysisInput {
  deployer: string;
  deployerFirstSeen: Date | null;
  deployerTxHash: string;
  deployerBlockNumber: bigint;
  deployerBlockTimestamp: Date;
}

export interface FundingResult {
  fundedBy: string | null;
  fundingTxHash: string | null;
  fundingAmount: string | null;
  fundingTimestamp: Date | null;
  fundingBlock: string | null;
  fundingSourceType: string;
  fundingSourceLabel: string;
  timeToDeploymentMinutes: number | null;
  confidence: number;
  reasons: string[];
}

export interface RpcTraceCall {
  from: string;
  to: string;
  value: string;
  hash: string;
  blockNumber: bigint;
  timestamp: Date;
}

export function analyzeFunding(
  input: FundingAnalysisInput,
  incomingTxs: RpcTraceCall[],
): FundingResult {
  const reasons: string[] = [];
  const deployer = input.deployer.toLowerCase();

  const sorted = [...incomingTxs].sort((a, b) => {
    if (a.blockNumber < b.blockNumber) return -1;
    if (a.blockNumber > b.blockNumber) return 1;
    return 0;
  });

  const firstInbound = sorted.find(
    (tx) => tx.to.toLowerCase() === deployer && BigInt(tx.value || '0') > BigInt(0),
  );

  if (!firstInbound) {
    return emptyResult(deployer, reasons);
  }

  const fundedBy = firstInbound.from.toLowerCase();
  const classification = classifyFundingSource(fundedBy);
  const fundingTimestamp = firstInbound.timestamp;

  let timeToDeploymentMinutes: number | null = null;
  if (input.deployerBlockTimestamp && fundingTimestamp) {
    const diffMs = input.deployerBlockTimestamp.getTime() - fundingTimestamp.getTime();
    timeToDeploymentMinutes = Math.max(0, Math.round((diffMs / (1000 * 60)) * 100) / 100);
  }

  let confidence = 70;
  reasons.push('First inbound transfer found');

  if (classification.type === 'exchange') {
    confidence += 20;
    reasons.push(`Funded from ${classification.source}`);
  } else if (classification.type === 'bridge') {
    confidence += 15;
    reasons.push(`Funded via bridge from ${classification.source}`);
  }

  if (timeToDeploymentMinutes !== null && timeToDeploymentMinutes < 60) {
    confidence += 5;
    reasons.push('Funded less than 1 hour before deployment');
  }

  if (timeToDeploymentMinutes !== null && timeToDeploymentMinutes < 1440) {
    confidence += 3;
    reasons.push('Funded less than 24 hours before deployment');
  }

  const amountWei = BigInt(firstInbound.value);
  if (amountWei > BigInt(0)) {
    const amountEth = Number(amountWei) / 1e18;
    if (amountEth >= 10) {
      confidence += 5;
      reasons.push('Large funding amount detected');
    } else if (amountEth >= 1) {
      confidence += 2;
      reasons.push('Moderate funding amount');
    }
  }

  confidence = Math.min(100, Math.max(0, confidence));

  return {
    fundedBy,
    fundingTxHash: firstInbound.hash,
    fundingAmount: firstInbound.value,
    fundingTimestamp,
    fundingBlock: firstInbound.blockNumber.toString(),
    fundingSourceType: classification.type,
    fundingSourceLabel: classification.source,
    timeToDeploymentMinutes,
    confidence,
    reasons,
  };
}

function emptyResult(_deployer: string, _reasons: string[]): FundingResult {
  return {
    fundedBy: null,
    fundingTxHash: null,
    fundingAmount: null,
    fundingTimestamp: null,
    fundingBlock: null,
    fundingSourceType: 'Unknown',
    fundingSourceLabel: 'Unknown',
    timeToDeploymentMinutes: null,
    confidence: 0,
    reasons: ['No inbound funding found'],
  };
}

export function parseFundingAmount(wei: string | null): number | null {
  if (!wei) return null;
  try {
    return Number(BigInt(wei)) / 1e18;
  } catch {
    return null;
  }
}

export async function buildFundingGraph(
  profiles: {
    wallet: string;
    fundedBy: string | null;
    chain?: string;
    amount?: string;
    timestamp?: Date;
    txHash?: string;
    blockNumber?: bigint;
  }[],
  repo?: WalletGraphRepository,
  _maxDepth: number = 5,
): Promise<{ nodes: { id: string; label: string }[]; edges: { from: string; to: string }[] }> {
  const nodes = new Map<string, { id: string; label: string }>();
  const edges: { from: string; to: string }[] = [];

  const addNode = (id: string) => {
    if (!nodes.has(id)) {
      nodes.set(id, { id, label: id.slice(0, 10) + '...' + id.slice(-6) });
    }
  };

  for (const p of profiles) {
    addNode(p.wallet);
    if (p.fundedBy) {
      addNode(p.fundedBy);
      edges.push({ from: p.fundedBy, to: p.wallet });
      if (repo && p.txHash && p.amount && p.timestamp && p.blockNumber) {
        await repo
          .saveEdge({
            fromWallet: p.fundedBy,
            toWallet: p.wallet,
            chain: p.chain ?? 'ethereum',
            amount: p.amount,
            blockNumber: p.blockNumber,
            timestamp: p.timestamp,
            transactionHash: p.txHash,
            edgeType: 'Funding' as WalletEdgeType,
            confidence: 80,
          })
          .catch(() => {});
      }
    }
  }

  return { nodes: Array.from(nodes.values()), edges };
}
