-- Add composite indexes for common filter combinations
-- (chain, discoveredAt): chain-specific token listing sorted by discovery time
-- (riskLevel, riskScore): combined risk filtering/sorting

CREATE INDEX IF NOT EXISTS tokens_chain_discovered_at_idx ON "tokens"("chain", "discoveredAt");
CREATE INDEX IF NOT EXISTS token_analyses_risk_level_risk_score_idx ON "token_analyses"("riskLevel", "riskScore");
