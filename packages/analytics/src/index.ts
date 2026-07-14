export interface LiquiditySignal {
  poolAddress?: string;
  lockedValueUsd?: number;
}

export function summarizeLiquidity(signal: LiquiditySignal): string {
  return `Liquidity signal: ${signal.poolAddress ?? 'unknown'} (${signal.lockedValueUsd ?? 0} USD)`;
}
