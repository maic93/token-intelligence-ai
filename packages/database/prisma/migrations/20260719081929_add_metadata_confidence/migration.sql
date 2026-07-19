-- DropForeignKey
ALTER TABLE "watch_events" DROP CONSTRAINT "watch_events_tokenId_fkey";

-- AlterTable
ALTER TABLE "token_analyses" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "metadataConfidence" INTEGER NOT NULL DEFAULT 100,
ALTER COLUMN "chainId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "watch_events" ADD CONSTRAINT "watch_events_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "token_analyses_risk_level_risk_score_idx" RENAME TO "token_analyses_riskLevel_riskScore_idx";

-- RenameIndex
ALTER INDEX "tokens_block_number_idx" RENAME TO "tokens_blockNumber_idx";

-- RenameIndex
ALTER INDEX "tokens_chain_discovered_at_idx" RENAME TO "tokens_chain_discoveredAt_idx";

-- RenameIndex
ALTER INDEX "watch_events_created_at_idx" RENAME TO "watch_events_createdAt_idx";

-- RenameIndex
ALTER INDEX "watch_events_event_type_idx" RENAME TO "watch_events_eventType_idx";

-- RenameIndex
ALTER INDEX "watch_events_token_id_idx" RENAME TO "watch_events_tokenId_idx";
