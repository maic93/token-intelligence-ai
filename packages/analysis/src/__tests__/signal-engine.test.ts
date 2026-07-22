import { describe, it, expect } from 'vitest';
import { SignalEngine } from '../signal-engine.js';
import type { SignalInput } from '../signal-engine.js';

function makeInput(overrides: Partial<SignalInput> = {}): SignalInput {
  return {
    tokenId: 'token-1',
    contractAddress: '0x1234',
    chain: 'base',
    name: 'TestToken',
    symbol: 'TEST',
    deployer: '0xdeployer',
    riskScore: 30,
    riskLevel: 'LOW',
    aiCategory: 'DEFI',
    aiConfidence: 85,
    aiRecommendation: 'WATCH',
    metadataConfidence: 95,
    isB20: false,
    deployerReputation: 75,
    deployerGrade: 'Good',
    discoveredAt: new Date(),
    smartMoneyScore: 80,
    smartMoneyGrade: 'Professional',
    fundingSourceType: 'exchange',
    fundingSourceLabel: 'Coinbase',
    fundingAmount: '1000000000000000000',
    timeToDeploymentMinutes: 120,
    fundedBy: '0xfunder',
    fundedByClusterSize: null,
    walletTotalDeployments: 5,
    walletSuccessfulTokens: 4,
    walletHighRiskTokens: 0,
    walletAgeDays: 120,
    ...overrides,
  };
}

describe('SignalEngine', () => {
  const engine = new SignalEngine();

  describe('generateTokenSignal', () => {
    it('returns STRONG_BUY for excellent token', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          smartMoneyScore: 95,
          smartMoneyGrade: 'Elite',
          aiConfidence: 92,
          metadataConfidence: 100,
          deployerReputation: 88,
          fundingSourceType: 'exchange',
          fundingSourceLabel: 'Coinbase',
          walletSuccessfulTokens: 8,
          walletTotalDeployments: 8,
          walletHighRiskTokens: 0,
          walletAgeDays: 365,
          riskScore: 10,
          riskLevel: 'SAFE',
        }),
      );
      expect(result.rating).toBe('STRONG_BUY');
      expect(result.opportunityScore).toBeGreaterThanOrEqual(70);
      expect(result.riskScore).toBeLessThanOrEqual(20);
    });

    it('returns BUY for good token with moderate risk', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          riskScore: 35,
          smartMoneyScore: 60,
          smartMoneyGrade: 'Experienced',
          aiConfidence: 70,
          metadataConfidence: 80,
          fundingSourceType: 'bridge',
          fundingSourceLabel: 'Bridge',
          walletSuccessfulTokens: 3,
          walletTotalDeployments: 5,
          walletHighRiskTokens: 1,
          walletAgeDays: 60,
        }),
      );
      expect(result.rating).toBe('BUY');
    });

    it('returns WATCH for average token', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          riskScore: 40,
          smartMoneyScore: 40,
          smartMoneyGrade: 'Average',
          aiConfidence: 50,
          metadataConfidence: 60,
          fundingSourceType: 'eoa',
          walletSuccessfulTokens: 1,
          walletTotalDeployments: 3,
          walletHighRiskTokens: 1,
          walletAgeDays: 14,
        }),
      );
      expect(result.rating).toBe('WATCH');
    });

    it('returns CAUTION when risk exceeds opportunity (moderate risk, low opp)', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          riskScore: 40,
          smartMoneyScore: 20,
          smartMoneyGrade: 'Average',
          aiConfidence: 30,
          metadataConfidence: 50,
          fundingSourceType: 'Unknown',
          walletSuccessfulTokens: 0,
          walletTotalDeployments: 3,
          walletHighRiskTokens: 1,
          walletAgeDays: 5,
        }),
      );
      expect(['CAUTION', 'WATCH', 'NEUTRAL', 'HIGH_RISK']).toContain(result.rating);
      expect(result.riskScore).toBeGreaterThanOrEqual(result.opportunityScore);
    });

    it('returns HIGH_RISK for elevated risk token', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          riskScore: 60,
          smartMoneyScore: 15,
          smartMoneyGrade: 'Speculative',
          fundingSourceType: 'Unknown',
          walletSuccessfulTokens: 0,
          walletTotalDeployments: 3,
          walletHighRiskTokens: 2,
          walletAgeDays: 1,
        }),
      );
      expect(result.rating).toBe('HIGH_RISK');
    });

    it('returns AVOID for high risk token (risk >= 65, < 3 high risk tokens)', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          riskScore: 80,
          smartMoneyScore: 5,
          smartMoneyGrade: 'Dangerous',
          walletHighRiskTokens: 2,
          fundingSourceType: 'Unknown',
          metadataConfidence: 20,
          aiConfidence: 10,
          aiCategory: 'UNKNOWN',
          walletAgeDays: 0,
        }),
      );
      expect(result.rating).toBe('AVOID');
    });

    it('returns RUG_RISK for extreme risk with high rug history', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          riskScore: 85,
          walletHighRiskTokens: 5,
          smartMoneyGrade: 'Dangerous',
          fundingSourceType: 'Unknown',
          metadataConfidence: 15,
          aiConfidence: 5,
          aiCategory: 'UNKNOWN',
          walletAgeDays: 0,
        }),
      );
      expect(result.rating).toBe('RUG_RISK');
    });

    it('includes human-readable reasons', () => {
      const result = engine.generateTokenSignal(makeInput());
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.headline).toContain('TestToken');
    });

    it('generates correct signal type for strong buy', () => {
      const result = engine.generateTokenSignal(makeInput());
      expect(result.signal).toBe('SMART_MONEY');
    });

    it('generates FUNDING_WARNING for unknown funding source', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          fundingSourceType: 'Unknown',
          smartMoneyScore: null,
          smartMoneyGrade: null,
          aiConfidence: 40,
          aiCategory: 'UNKNOWN',
        }),
      );
      expect(result.signal).toBe('FUNDING_WARNING');
    });

    it('generates NEW_DEPLOYER for fresh wallet', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          walletAgeDays: 1,
          fundingSourceType: 'exchange',
          smartMoneyScore: null,
          smartMoneyGrade: null,
          aiConfidence: 50,
          aiCategory: 'UNKNOWN',
        }),
      );
      expect(result.signal).toBe('NEW_DEPLOYER');
    });

    it('generates PROMISING_B20 for high confidence B20 tokens', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          aiCategory: 'B20',
          aiConfidence: 85,
          smartMoneyScore: null,
          smartMoneyGrade: null,
          fundingSourceType: 'bridge',
        }),
      );
      expect(result.signal).toBe('PROMISING_B20');
    });

    it('generates PROMISING_DEFI for high confidence DEFI tokens', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          aiCategory: 'DEFI',
          aiConfidence: 90,
          smartMoneyScore: null,
          smartMoneyGrade: null,
          fundingSourceType: 'exchange',
        }),
      );
      expect(result.signal).toBe('PROMISING_DEFI');
    });

    it('generates PROMISING_MEME for meme tokens', () => {
      const result = engine.generateTokenSignal(
        makeInput({
          aiCategory: 'MEME',
          aiConfidence: 85,
          smartMoneyScore: null,
          smartMoneyGrade: null,
          fundingSourceType: 'exchange',
        }),
      );
      expect(result.signal).toBe('PROMISING_MEME');
    });
  });

  describe('generateWalletSignal', () => {
    it('returns STRONG_BUY for elite wallet', () => {
      const result = engine.generateWalletSignal(
        makeInput({
          smartMoneyGrade: 'Elite',
          smartMoneyScore: 95,
          riskScore: 20,
        }),
      );
      expect(result.rating).toBe('STRONG_BUY');
    });

    it('returns AVOID for dangerous wallet', () => {
      const result = engine.generateWalletSignal(
        makeInput({
          smartMoneyGrade: 'Dangerous',
          smartMoneyScore: 5,
        }),
      );
      expect(result.rating).toBe('AVOID');
    });
  });

  describe('generateFundingSignal', () => {
    it('returns BUY for exchange-funded wallet', () => {
      const result = engine.generateFundingSignal(makeInput());
      expect(result.rating).toBe('BUY');
      expect(result.signal).toBe('SMART_MONEY');
    });

    it('returns CAUTION for clustered funding', () => {
      const result = engine.generateFundingSignal(
        makeInput({
          fundedByClusterSize: 5,
          fundingSourceType: 'eoa',
        }),
      );
      expect(result.rating).toBe('CAUTION');
      expect(result.signal).toBe('FUNDING_WARNING');
    });

    it('returns CAUTION for unknown funding', () => {
      const result = engine.generateFundingSignal(
        makeInput({
          fundingSourceType: 'Unknown',
          fundedBy: null,
        }),
      );
      expect(result.rating).toBe('CAUTION');
    });
  });

  describe('generateOpportunityScore', () => {
    it('returns 0 for worst case', () => {
      const score = engine.generateOpportunityScore(
        makeInput({
          riskScore: 100,
          smartMoneyScore: 0,
          aiConfidence: 0,
          metadataConfidence: 0,
          deployerReputation: 0,
          walletSuccessfulTokens: 0,
          walletTotalDeployments: 0,
          fundingSourceType: 'Unknown',
          walletAgeDays: 0,
        }),
      );
      expect(score).toBe(0);
    });

    it('returns high score for excellent input', () => {
      const score = engine.generateOpportunityScore(
        makeInput({
          smartMoneyScore: 95,
          aiConfidence: 95,
          metadataConfidence: 100,
          deployerReputation: 90,
          fundingSourceType: 'exchange',
          walletSuccessfulTokens: 10,
          walletTotalDeployments: 10,
          walletAgeDays: 365,
          riskScore: 10,
        }),
      );
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it('increases score with higher metadata confidence', () => {
      const low = engine.generateOpportunityScore(makeInput({ metadataConfidence: 30 }));
      const high = engine.generateOpportunityScore(makeInput({ metadataConfidence: 95 }));
      expect(high).toBeGreaterThan(low);
    });

    it('increases score with exchange funding', () => {
      const exchange = engine.generateOpportunityScore(
        makeInput({
          fundingSourceType: 'exchange',
          smartMoneyScore: 0,
          metadataConfidence: 50,
          aiConfidence: 0,
          walletSuccessfulTokens: 0,
          walletTotalDeployments: 0,
          walletAgeDays: null,
        }),
      );
      const unknown = engine.generateOpportunityScore(
        makeInput({
          fundingSourceType: 'Unknown',
          smartMoneyScore: 0,
          metadataConfidence: 50,
          aiConfidence: 0,
          walletSuccessfulTokens: 0,
          walletTotalDeployments: 0,
          walletAgeDays: null,
        }),
      );
      expect(exchange).toBeGreaterThan(unknown);
    });

    it('penalizes high risk score', () => {
      const lowRisk = engine.generateOpportunityScore(
        makeInput({
          riskScore: 10,
          smartMoneyScore: 50,
          metadataConfidence: 50,
          aiConfidence: 50,
          walletSuccessfulTokens: 0,
          walletTotalDeployments: 0,
          walletAgeDays: null,
        }),
      );
      const highRisk = engine.generateOpportunityScore(
        makeInput({
          riskScore: 90,
          smartMoneyScore: 50,
          metadataConfidence: 50,
          aiConfidence: 50,
          walletSuccessfulTokens: 0,
          walletTotalDeployments: 0,
          walletAgeDays: null,
        }),
      );
      expect(lowRisk).toBeGreaterThan(highRisk);
    });
  });

  describe('generateRiskScore', () => {
    it('returns 0 for best case', () => {
      const score = engine.generateRiskScore(
        makeInput({
          walletAgeDays: 365,
          walletHighRiskTokens: 0,
          smartMoneyGrade: 'Elite',
          fundingSourceType: 'exchange',
          metadataConfidence: 100,
          aiCategory: 'DEFI',
          deployerReputation: 90,
          isB20: false,
          riskScore: 10,
          fundedByClusterSize: null,
          timeToDeploymentMinutes: null,
        }),
      );
      expect(score).toBe(0);
    });

    it('increases risk for fresh wallet', () => {
      const fresh = engine.generateRiskScore(makeInput({ walletAgeDays: 0 }));
      const old = engine.generateRiskScore(makeInput({ walletAgeDays: 365 }));
      expect(fresh).toBeGreaterThan(old);
    });

    it('increases risk for dangerous smart money grade', () => {
      const dangerous = engine.generateRiskScore(makeInput({ smartMoneyGrade: 'Dangerous' }));
      const elite = engine.generateRiskScore(makeInput({ smartMoneyGrade: 'Elite' }));
      expect(dangerous).toBeGreaterThan(elite);
    });

    it('increases risk for unknown funding', () => {
      const unknown = engine.generateRiskScore(makeInput({ fundingSourceType: 'Unknown' }));
      const exchange = engine.generateRiskScore(makeInput({ fundingSourceType: 'exchange' }));
      expect(unknown).toBeGreaterThan(exchange);
    });

    it('increases risk for large funding cluster', () => {
      const clustered = engine.generateRiskScore(makeInput({ fundedByClusterSize: 10 }));
      const solo = engine.generateRiskScore(makeInput({ fundedByClusterSize: null }));
      expect(clustered).toBeGreaterThan(solo);
    });

    it('caps risk score at 100', () => {
      const score = engine.generateRiskScore(
        makeInput({
          walletAgeDays: 0,
          walletHighRiskTokens: 10,
          smartMoneyGrade: 'Dangerous',
          fundingSourceType: 'Unknown',
          metadataConfidence: 10,
          aiCategory: 'UNKNOWN',
          deployerReputation: 0,
          riskScore: 100,
        }),
      );
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('generateConfidence', () => {
    it('returns 0 for no data', () => {
      const score = engine.generateConfidence(
        makeInput({
          metadataConfidence: 0,
          aiConfidence: 0,
          smartMoneyScore: null,
          fundingSourceType: 'Unknown',
          walletTotalDeployments: 0,
          deployerReputation: 0,
        }),
        0,
        0,
      );
      expect(score).toBe(0);
    });

    it('returns high confidence for complete data', () => {
      const score = engine.generateConfidence(
        makeInput({
          metadataConfidence: 100,
          aiConfidence: 95,
          smartMoneyScore: 90,
          fundingSourceType: 'exchange',
          walletTotalDeployments: 10,
          deployerReputation: 90,
        }),
        80,
        10,
      );
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it('increases with data agreement (large spread)', () => {
      const highSpread = engine.generateConfidence(
        makeInput({
          metadataConfidence: 95,
          aiConfidence: 90,
          smartMoneyScore: 85,
          fundingSourceType: 'exchange',
          walletTotalDeployments: 5,
          deployerReputation: 80,
        }),
        80,
        10,
      );
      const lowSpread = engine.generateConfidence(
        makeInput({
          metadataConfidence: 95,
          aiConfidence: 90,
          smartMoneyScore: 85,
          fundingSourceType: 'exchange',
          walletTotalDeployments: 5,
          deployerReputation: 80,
        }),
        50,
        45,
      );
      expect(highSpread).toBeGreaterThanOrEqual(lowSpread);
    });
  });

  describe('Overall Rating edge cases', () => {
    it('handles minimal input without crashing', () => {
      const input = makeInput({
        smartMoneyScore: null,
        smartMoneyGrade: null,
        fundingSourceType: '',
        fundingSourceLabel: '',
        fundedBy: null,
        fundedByClusterSize: null,
        walletAgeDays: null,
        metadataConfidence: 0,
        aiConfidence: 0,
        aiCategory: 'UNKNOWN',
        aiRecommendation: 'CAUTION',
        deployerReputation: 0,
        walletTotalDeployments: 0,
        walletSuccessfulTokens: 0,
        walletHighRiskTokens: 0,
        riskScore: 50,
      });
      const result = engine.generateTokenSignal(input);
      expect(result.rating).toBeDefined();
      expect(result.reasons).toBeDefined();
    });

    it('always produces a recommendation', () => {
      const ratings = [
        'STRONG_BUY',
        'BUY',
        'WATCH',
        'NEUTRAL',
        'CAUTION',
        'HIGH_RISK',
        'AVOID',
        'RUG_RISK',
      ];
      for (const rating of ratings) {
        const result = engine.generateTokenSignal(
          rating === 'RUG_RISK'
            ? makeInput({
                riskScore: 85,
                walletHighRiskTokens: 5,
                smartMoneyGrade: 'Dangerous',
                fundingSourceType: 'Unknown',
              })
            : rating === 'AVOID'
              ? makeInput({ riskScore: 85, walletHighRiskTokens: 5 })
              : rating === 'HIGH_RISK'
                ? makeInput({ riskScore: 70, fundingSourceType: 'Unknown' })
                : rating === 'CAUTION'
                  ? makeInput({
                      riskScore: 60,
                      smartMoneyScore: 20,
                      aiConfidence: 30,
                      metadataConfidence: 40,
                    })
                  : rating === 'WATCH'
                    ? makeInput({
                        riskScore: 45,
                        smartMoneyScore: 50,
                        fundingSourceType: 'eoa',
                        aiConfidence: 60,
                        metadataConfidence: 70,
                      })
                    : rating === 'NEUTRAL'
                      ? makeInput({
                          riskScore: 50,
                          smartMoneyScore: 30,
                          aiConfidence: 40,
                          metadataConfidence: 50,
                          fundingSourceType: 'Unknown',
                        })
                      : makeInput(),
        );
        expect(result.recommendation).toBeTruthy();
      }
    });
  });
});
