-- AlterTable
ALTER TABLE "analytics_snapshots" ADD COLUMN     "averageFundingAmount" DOUBLE PRECISION,
ADD COLUMN     "bridgeFundedDeployers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cexFundedDeployers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "largestCluster" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "largestFunding" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "fundedBy" TEXT,
ADD COLUMN     "fundingAmount" TEXT,
ADD COLUMN     "fundingSourceType" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "fundingTimestamp" TIMESTAMP(3),
ADD COLUMN     "timeToDeploymentMinutes" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "funding_profiles" (
    "wallet" TEXT NOT NULL,
    "fundedBy" TEXT,
    "fundingTxHash" TEXT,
    "fundingBlock" BIGINT,
    "fundingTimestamp" TIMESTAMP(3),
    "fundingAmount" TEXT,
    "fundingCurrency" TEXT NOT NULL DEFAULT 'ETH',
    "timeToDeploymentMinutes" DOUBLE PRECISION,
    "fundingSourceType" TEXT NOT NULL DEFAULT 'Unknown',
    "clusterId" TEXT,
    "firstSeen" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_profiles_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "funding_clusters" (
    "id" TEXT NOT NULL,
    "funderWallet" TEXT NOT NULL,
    "walletCount" INTEGER NOT NULL DEFAULT 0,
    "deployments" INTEGER NOT NULL DEFAULT 0,
    "successfulTokens" INTEGER NOT NULL DEFAULT 0,
    "highRiskTokens" INTEGER NOT NULL DEFAULT 0,
    "chains" JSONB NOT NULL DEFAULT '[]',
    "totalFunding" TEXT NOT NULL DEFAULT '0',
    "firstSeen" TIMESTAMP(3),
    "lastSeen" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funding_profiles_fundedBy_idx" ON "funding_profiles"("fundedBy");

-- CreateIndex
CREATE INDEX "funding_profiles_fundingSourceType_idx" ON "funding_profiles"("fundingSourceType");

-- CreateIndex
CREATE INDEX "funding_profiles_clusterId_idx" ON "funding_profiles"("clusterId");

-- CreateIndex
CREATE INDEX "funding_profiles_fundingTimestamp_idx" ON "funding_profiles"("fundingTimestamp");

-- CreateIndex
CREATE INDEX "funding_clusters_funderWallet_idx" ON "funding_clusters"("funderWallet");

-- CreateIndex
CREATE INDEX "funding_clusters_walletCount_idx" ON "funding_clusters"("walletCount");

-- CreateIndex
CREATE INDEX "funding_clusters_deployments_idx" ON "funding_clusters"("deployments");
