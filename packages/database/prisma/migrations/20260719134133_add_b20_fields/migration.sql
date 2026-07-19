-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "b20Confidence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isB20" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "tokens_isB20_b20Confidence_idx" ON "tokens"("isB20", "b20Confidence");
