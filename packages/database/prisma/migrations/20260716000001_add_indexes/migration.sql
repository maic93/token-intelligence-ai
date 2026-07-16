-- Add indexes for commonly queried fields on the tokens table
-- name: text search and sorting
-- symbol: text search and filtering
-- deployer: deployer lookups
-- blockNumber: sorting and filtering

CREATE INDEX IF NOT EXISTS tokens_name_idx ON "tokens"("name");
CREATE INDEX IF NOT EXISTS tokens_symbol_idx ON "tokens"("symbol");
CREATE INDEX IF NOT EXISTS tokens_deployer_idx ON "tokens"("deployer");
CREATE INDEX IF NOT EXISTS tokens_block_number_idx ON "tokens"("blockNumber");
