-- CreateTable
CREATE TABLE "token_analyses" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "factors" JSONB NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "token_analyses_tokenId_key" ON "token_analyses"("tokenId");

-- CreateIndex
CREATE INDEX "token_analyses_riskScore_idx" ON "token_analyses"("riskScore");

-- CreateIndex
CREATE INDEX "token_analyses_riskLevel_idx" ON "token_analyses"("riskLevel");

-- AddForeignKey
ALTER TABLE "token_analyses" ADD CONSTRAINT "token_analyses_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
