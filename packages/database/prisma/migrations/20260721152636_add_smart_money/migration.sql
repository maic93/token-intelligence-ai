-- AlterTable
ALTER TABLE "analytics_snapshots" ADD COLUMN     "averageSmartMoneyScore" DOUBLE PRECISION,
ADD COLUMN     "dangerousWallets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "eliteWallets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "professionalWallets" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "smart_money_profiles" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT 'Dangerous',
    "firstSeen" TIMESTAMP(3),
    "lastSeen" TIMESTAMP(3),
    "tokensCreated" INTEGER NOT NULL DEFAULT 0,
    "averageRisk" DOUBLE PRECISION,
    "averageMetadataConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageAIConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "successfulTokens" INTEGER NOT NULL DEFAULT 0,
    "failedTokens" INTEGER NOT NULL DEFAULT 0,
    "averageHoldTimeDays" DOUBLE PRECISION,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labels" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "signals" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "smart_money_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "smart_money_profiles_wallet_key" ON "smart_money_profiles"("wallet");

-- CreateIndex
CREATE INDEX "smart_money_profiles_score_idx" ON "smart_money_profiles"("score");

-- CreateIndex
CREATE INDEX "smart_money_profiles_grade_idx" ON "smart_money_profiles"("grade");

-- CreateIndex
CREATE INDEX "smart_money_profiles_winRate_idx" ON "smart_money_profiles"("winRate");

-- CreateIndex
CREATE INDEX "smart_money_profiles_tokensCreated_idx" ON "smart_money_profiles"("tokensCreated");

-- CreateIndex
CREATE INDEX "smart_money_profiles_lastSeen_idx" ON "smart_money_profiles"("lastSeen");
