-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "deployer" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "totalSupply" TEXT NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockNumber" BIGINT NOT NULL,
    "blockTimestamp" TIMESTAMP(3) NOT NULL,
    "transactionHash" TEXT NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_cursors" (
    "id" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tokens_chain_idx" ON "tokens"("chain");

-- CreateIndex
CREATE INDEX "tokens_discoveredAt_idx" ON "tokens"("discoveredAt");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_chain_contractAddress_key" ON "tokens"("chain", "contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "sync_cursors_id_chain_key" ON "sync_cursors"("id", "chain");
