import type { RiskFactor } from './types.js';

const QUADRILLION = 1000000000000000n;

export function evaluateMissingSymbol(symbol: string): RiskFactor {
  const passed = symbol.length > 0;
  return {
    rule: 'missing_symbol',
    passed,
    penalty: passed ? 0 : 20,
    reason: passed ? 'Token has an ERC20 symbol' : 'Token has no ERC20 symbol',
  };
}

export function evaluateMissingName(name: string): RiskFactor {
  const passed = name.length > 0;
  return {
    rule: 'missing_name',
    passed,
    penalty: passed ? 0 : 15,
    reason: passed ? 'Token has a name' : 'Token has no name',
  };
}

export function evaluateDecimalsRange(decimals: number): RiskFactor {
  const passed = decimals >= 0 && decimals <= 18;
  return {
    rule: 'decimals_range',
    passed,
    penalty: passed ? 0 : 20,
    reason: passed
      ? `Decimals (${decimals}) is within valid range 0-18`
      : `Decimals (${decimals}) is outside valid range 0-18`,
  };
}

export function evaluateSupplyMissing(totalSupply: string): RiskFactor {
  const passed = totalSupply.length > 0 && totalSupply !== '0';
  return {
    rule: 'supply_missing',
    passed,
    penalty: passed ? 0 : 10,
    reason: passed ? 'Total supply is available' : 'Total supply is missing or zero',
  };
}

export function evaluateSupplyExceeds(totalSupply: string): RiskFactor {
  let passed = true;
  try {
    const supply = BigInt(totalSupply);
    if (supply > QUADRILLION) {
      passed = false;
    }
  } catch {
    passed = false;
  }
  return {
    rule: 'supply_exceeds',
    passed,
    penalty: passed ? 0 : 15,
    reason: passed
      ? 'Total supply is within reasonable bounds'
      : 'Total supply exceeds 1 quadrillion',
  };
}

export function evaluateNewDeployment(blockNumber: bigint, currentBlockNumber: bigint): RiskFactor {
  const blockAge = currentBlockNumber - blockNumber;
  const passed = blockAge >= 100n;
  return {
    rule: 'new_deployment',
    passed,
    penalty: passed ? 0 : 15,
    reason: passed
      ? `Deployment is mature (${blockAge.toString()} blocks old)`
      : `Deployment is very new (${blockAge.toString()} blocks old, minimum 100)`,
  };
}

export async function evaluateUnknownDeployer(
  deployer: string,
  chain: string,
  getDeployerCount: (deployer: string, chain: string) => Promise<number>,
): Promise<RiskFactor> {
  const count = await getDeployerCount(deployer, chain);
  const passed = count > 0;
  return {
    rule: 'unknown_deployer',
    passed,
    penalty: passed ? 0 : 10,
    reason: passed
      ? `Deployer has deployed ${count} other token(s)`
      : 'First contract from this deployer',
  };
}

export function evaluateFuturePlaceholder(): RiskFactor {
  return {
    rule: 'future_placeholder',
    passed: true,
    penalty: 0,
    reason: 'Placeholder rule for future extensions',
  };
}
