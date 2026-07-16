import { PrismaClient, TokenAnalysis } from '@prisma/client';
import type { RiskAnalysis } from '@token-intelligence-ai/shared';

export class AnalysisRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createAnalysis(tokenId: string, analysis: RiskAnalysis): Promise<TokenAnalysis> {
    return this.prisma.tokenAnalysis.create({
      data: {
        tokenId,
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        explanation: analysis.explanation,
        factors: JSON.parse(JSON.stringify(analysis.factors)),
        analyzedAt: new Date(analysis.analyzedAt),
      },
    });
  }

  async getLatestAnalysis(): Promise<TokenAnalysis | null> {
    return this.prisma.tokenAnalysis.findFirst({
      orderBy: { analyzedAt: 'desc' },
    });
  }

  async getAnalysisByToken(tokenId: string): Promise<TokenAnalysis | null> {
    return this.prisma.tokenAnalysis.findUnique({
      where: { tokenId },
    });
  }

  async getAnalysisByTokenAddress(
    chain: string,
    contractAddress: string,
  ): Promise<TokenAnalysis | null> {
    const token = await this.prisma.token.findUnique({
      where: {
        chain_contractAddress: {
          chain,
          contractAddress: contractAddress.toLowerCase(),
        },
      },
    });
    if (!token) return null;
    return this.prisma.tokenAnalysis.findUnique({
      where: { tokenId: token.id },
    });
  }

  async getDeployerTokenCount(deployer: string, chain: string): Promise<number> {
    return this.prisma.token.count({
      where: {
        deployer: deployer.toLowerCase(),
        chain,
      },
    });
  }
}
