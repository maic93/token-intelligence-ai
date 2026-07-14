export interface LiquiditySignal {
  poolAddress?: string;
  lockedValueUsd?: number;
}
export declare function summarizeLiquidity(signal: LiquiditySignal): string;
