import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, TokenRepository } from '@token-intelligence-ai/database';

const tokenRepo = new TokenRepository(prisma);
const router: RouterType = Router();

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address format');
const chainEnum = z.enum(['base', 'robinhood', 'ethereum', 'polygon']).optional();

router.get('/:address', async (req, res, next) => {
  try {
    const deployer = addressSchema.parse(req.params.address).toLowerCase();
    const chain = req.query.chain as string | undefined;
    const parsedChain = chain
      ? (chainEnum.parse(chain) as 'base' | 'robinhood' | 'ethereum' | 'polygon')
      : undefined;

    const [tokens, summary] = await Promise.all([
      tokenRepo.getTokensByDeployer(deployer, parsedChain),
      tokenRepo.getDeployerSummary(deployer, parsedChain),
    ]);

    if (tokens.length === 0) {
      res.status(404).json({ error: 'No tokens found for this deployer' });
      return;
    }

    const tokenIds = tokens.map((t) => t.id);
    const analyses = await prisma.tokenAnalysis.findMany({
      where: { tokenId: { in: tokenIds } },
      select: { tokenId: true, riskScore: true, riskLevel: true },
    });
    const analysisMap = new Map(analyses.map((a) => [a.tokenId, a]));

    const riskScores = analyses.map((a) => a.riskScore);
    const averageRisk =
      riskScores.length > 0
        ? Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length)
        : null;

    res.json({
      data: {
        deployer,
        totalContracts: summary.totalContracts,
        chains: summary.chains,
        firstDeployment: summary.firstDeployment?.toISOString() ?? null,
        latestDeployment: summary.latestDeployment?.toISOString() ?? null,
        averageRisk,
        tokens: tokens.map((t) => {
          const analysis = analysisMap.get(t.id);
          return {
            contractAddress: t.contractAddress,
            chain: t.chain,
            tokenName: t.name,
            tokenSymbol: t.symbol,
            blockNumber: t.blockNumber.toString(),
            blockTimestamp: t.blockTimestamp.toISOString(),
            riskScore: analysis?.riskScore ?? null,
            riskLevel: analysis?.riskLevel ?? null,
          };
        }),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as deployersRouter };
