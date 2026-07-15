-- AlterTable: add chainId to tokens
ALTER TABLE "tokens" ADD COLUMN "chainId" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex for chainId
CREATE INDEX "tokens_chainId_idx" ON "tokens"("chainId");
