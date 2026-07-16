import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';
import { prisma, AnalysisRepository } from '@token-intelligence-ai/database';

const analysisRepo = new AnalysisRepository(prisma);
const router: RouterType = Router();

const chainEnum = z.enum(['base', 'robinhood', 'ethereum', 'polygon']);

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address format');

router.get('/:address', async (req, res, next) => {
  try {
    const chain = chainEnum.parse(req.query.chain);
    const contractAddress = addressSchema.parse(req.params.address);

    const analysis = await analysisRepo.getAnalysisByTokenAddress(
      chain,
      contractAddress.toLowerCase(),
    );

    if (!analysis) {
      res.status(404).json({ error: 'Analysis not found for this token' });
      return;
    }

    res.json({
      data: {
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel,
        explanation: analysis.explanation,
        factors: analysis.factors,
        analyzedAt: analysis.analyzedAt.toISOString(),
        ownerRenounced: analysis.ownerRenounced,
        mintable: analysis.mintable,
        pausable: analysis.pausable,
        blacklistFunction: analysis.blacklistFunction,
        proxyContract: analysis.proxyContract,
        verifiedSource: analysis.verifiedSource,
        buyTax: analysis.buyTax,
        sellTax: analysis.sellTax,
        liquidityLocked: analysis.liquidityLocked,
        liquidityPercent: analysis.liquidityPercent,
        holderCount: analysis.holderCount,
        top10HolderPercent: analysis.top10HolderPercent,
        top1HolderPercent: analysis.top1HolderPercent,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as analysisRouter };
