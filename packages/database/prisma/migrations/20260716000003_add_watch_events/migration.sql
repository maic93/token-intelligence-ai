-- Create watch_events table for tracking token-related events
-- Used by the Watchlist and Alert system

CREATE TABLE IF NOT EXISTS "watch_events" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "watch_events_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "watch_events_created_at_idx" ON "watch_events"("createdAt");
CREATE INDEX IF NOT EXISTS "watch_events_token_id_idx" ON "watch_events"("tokenId");
CREATE INDEX IF NOT EXISTS "watch_events_event_type_idx" ON "watch_events"("eventType");
