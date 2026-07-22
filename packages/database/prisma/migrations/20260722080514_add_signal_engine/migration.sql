-- CreateTable
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "weaknesses" JSONB NOT NULL DEFAULT '[]',
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "recommendation" TEXT NOT NULL,
    "opportunityScore" INTEGER NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signals_tokenId_key" ON "signals"("tokenId");

-- CreateIndex
CREATE INDEX "signals_signal_idx" ON "signals"("signal");

-- CreateIndex
CREATE INDEX "signals_rating_idx" ON "signals"("rating");

-- CreateIndex
CREATE INDEX "signals_confidence_idx" ON "signals"("confidence");

-- CreateIndex
CREATE INDEX "signals_opportunityScore_idx" ON "signals"("opportunityScore");

-- CreateIndex
CREATE INDEX "signals_riskScore_idx" ON "signals"("riskScore");

-- CreateIndex
CREATE INDEX "signals_createdAt_idx" ON "signals"("createdAt");

-- AddForeignKey
ALTER TABLE "signals" ADD CONSTRAINT "signals_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
