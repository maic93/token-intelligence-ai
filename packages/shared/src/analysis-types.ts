export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFactor {
  rule: string;
  passed: boolean;
  penalty: number;
  reason: string;
}

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: RiskLevel;
  explanation: string;
  factors: RiskFactor[];
  analyzedAt: string;
}

export interface RpcProvider {
  ethCall(to: string, data: string): Promise<string>;
  getCode(address: string): Promise<string>;
  getBalance(address: string): Promise<string>;
}

export interface TokenSecurityMetrics {
  ownerRenounced: boolean;
  mintable: boolean;
  pausable: boolean;
  blacklistFunction: boolean;
  proxyContract: boolean;
  verifiedSource: boolean;
  buyTax: number;
  sellTax: number;
  liquidityLocked: boolean;
  liquidityPercent: number;
  holderCount: number;
  top10HolderPercent: number;
  top1HolderPercent: number;
}

export type TokenAnalysisData = RiskAnalysis & TokenSecurityMetrics;
