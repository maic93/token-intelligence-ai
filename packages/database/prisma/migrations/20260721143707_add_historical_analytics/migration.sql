-- CreateTable
CREATE TABLE "wallet_profiles" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "walletAgeDays" INTEGER,
    "firstSeen" TIMESTAMP(3),
    "lastSeen" TIMESTAMP(3),
    "totalDeployments" INTEGER NOT NULL DEFAULT 0,
    "successfulTokens" INTEGER NOT NULL DEFAULT 0,
    "highRiskTokens" INTEGER NOT NULL DEFAULT 0,
    "b20Tokens" INTEGER NOT NULL DEFAULT 0,
    "averageRisk" DOUBLE PRECISION,
    "averageMetadataConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageAiConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputation" INTEGER NOT NULL DEFAULT 50,
    "grade" TEXT NOT NULL DEFAULT 'Average',
    "labels" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tokensIndexed" INTEGER NOT NULL DEFAULT 0,
    "highRiskTokens" INTEGER NOT NULL DEFAULT 0,
    "averageRisk" DOUBLE PRECISION,
    "averageMetadataConfidence" DOUBLE PRECISION,
    "averageAIConfidence" DOUBLE PRECISION,
    "uniqueDeployers" INTEGER NOT NULL DEFAULT 0,
    "totalDeployments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_trends" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tokensIndexed" INTEGER NOT NULL DEFAULT 0,
    "averageRisk" DOUBLE PRECISION,
    "averageConfidence" DOUBLE PRECISION,
    "uniqueDeployers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chain_trends" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tokensIndexed" INTEGER NOT NULL DEFAULT 0,
    "averageRisk" DOUBLE PRECISION,
    "averageMetadataConfidence" DOUBLE PRECISION,
    "averageAIConfidence" DOUBLE PRECISION,
    "averageDeployerReputation" DOUBLE PRECISION,
    "uniqueDeployers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chain_trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployer_trends" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "tokensIndexed" INTEGER NOT NULL DEFAULT 0,
    "averageRisk" DOUBLE PRECISION,
    "averageMetadataConfidence" DOUBLE PRECISION,
    "averageAIConfidence" DOUBLE PRECISION,
    "reputation" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployer_trends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_profiles_wallet_key" ON "wallet_profiles"("wallet");

-- CreateIndex
CREATE INDEX "wallet_profiles_reputation_idx" ON "wallet_profiles"("reputation");

-- CreateIndex
CREATE INDEX "wallet_profiles_grade_idx" ON "wallet_profiles"("grade");

-- CreateIndex
CREATE INDEX "wallet_profiles_totalDeployments_idx" ON "wallet_profiles"("totalDeployments");

-- CreateIndex
CREATE INDEX "wallet_profiles_lastSeen_idx" ON "wallet_profiles"("lastSeen");

-- CreateIndex
CREATE INDEX "analytics_snapshots_period_idx" ON "analytics_snapshots"("period");

-- CreateIndex
CREATE INDEX "analytics_snapshots_timestamp_idx" ON "analytics_snapshots"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_period_timestamp_key" ON "analytics_snapshots"("period", "timestamp");

-- CreateIndex
CREATE INDEX "category_trends_category_idx" ON "category_trends"("category");

-- CreateIndex
CREATE INDEX "category_trends_period_idx" ON "category_trends"("period");

-- CreateIndex
CREATE INDEX "category_trends_timestamp_idx" ON "category_trends"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "category_trends_category_period_timestamp_key" ON "category_trends"("category", "period", "timestamp");

-- CreateIndex
CREATE INDEX "chain_trends_chain_idx" ON "chain_trends"("chain");

-- CreateIndex
CREATE INDEX "chain_trends_period_idx" ON "chain_trends"("period");

-- CreateIndex
CREATE INDEX "chain_trends_timestamp_idx" ON "chain_trends"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "chain_trends_chain_period_timestamp_key" ON "chain_trends"("chain", "period", "timestamp");

-- CreateIndex
CREATE INDEX "deployer_trends_wallet_idx" ON "deployer_trends"("wallet");

-- CreateIndex
CREATE INDEX "deployer_trends_period_idx" ON "deployer_trends"("period");

-- CreateIndex
CREATE INDEX "deployer_trends_timestamp_idx" ON "deployer_trends"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "deployer_trends_wallet_period_timestamp_key" ON "deployer_trends"("wallet", "period", "timestamp");
