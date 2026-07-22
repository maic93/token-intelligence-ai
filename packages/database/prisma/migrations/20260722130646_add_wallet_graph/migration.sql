-- CreateTable
CREATE TABLE "wallet_edges" (
    "id" TEXT NOT NULL,
    "fromWallet" TEXT NOT NULL,
    "toWallet" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "tokenAddress" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'ETH',
    "amount" TEXT NOT NULL,
    "amountUsd" DOUBLE PRECISION,
    "blockNumber" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "edgeType" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_clusters" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "score" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_clusters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_edges_fromWallet_idx" ON "wallet_edges"("fromWallet");

-- CreateIndex
CREATE INDEX "wallet_edges_toWallet_idx" ON "wallet_edges"("toWallet");

-- CreateIndex
CREATE INDEX "wallet_edges_chain_idx" ON "wallet_edges"("chain");

-- CreateIndex
CREATE INDEX "wallet_edges_timestamp_idx" ON "wallet_edges"("timestamp");

-- CreateIndex
CREATE INDEX "wallet_edges_edgeType_idx" ON "wallet_edges"("edgeType");

-- CreateIndex
CREATE INDEX "wallet_edges_fromWallet_toWallet_idx" ON "wallet_edges"("fromWallet", "toWallet");

-- CreateIndex
CREATE INDEX "wallet_edges_fromWallet_chain_idx" ON "wallet_edges"("fromWallet", "chain");

-- CreateIndex
CREATE INDEX "wallet_edges_toWallet_chain_idx" ON "wallet_edges"("toWallet", "chain");

-- CreateIndex
CREATE INDEX "wallet_clusters_clusterId_idx" ON "wallet_clusters"("clusterId");

-- CreateIndex
CREATE INDEX "wallet_clusters_wallet_idx" ON "wallet_clusters"("wallet");

-- CreateIndex
CREATE INDEX "wallet_clusters_clusterId_wallet_idx" ON "wallet_clusters"("clusterId", "wallet");
