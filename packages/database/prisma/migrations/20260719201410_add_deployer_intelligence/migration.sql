-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "deployerGrade" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "deployerReputation" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "deployer_analytics" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "tokensCreated" INTEGER NOT NULL DEFAULT 0,
    "highRiskTokens" INTEGER NOT NULL DEFAULT 0,
    "mediumRiskTokens" INTEGER NOT NULL DEFAULT 0,
    "lowRiskTokens" INTEGER NOT NULL DEFAULT 0,
    "avgRiskScore" DOUBLE PRECISION,
    "avgMetadataConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgB20Confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstSeen" TIMESTAMP(3),
    "lastSeen" TIMESTAMP(3),
    "uniqueSymbols" INTEGER NOT NULL DEFAULT 0,
    "reputationScore" INTEGER NOT NULL DEFAULT 50,
    "reputationGrade" TEXT NOT NULL DEFAULT 'Average',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployer_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deployer_analytics_wallet_key" ON "deployer_analytics"("wallet");

-- CreateIndex
CREATE INDEX "deployer_analytics_reputationScore_idx" ON "deployer_analytics"("reputationScore");

-- CreateIndex
CREATE INDEX "deployer_analytics_tokensCreated_idx" ON "deployer_analytics"("tokensCreated");
