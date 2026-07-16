import type { RiskFactor, RpcProvider, TokenSecurityMetrics } from './types.js';

const ZERO_ADDR = '0x' + '0'.repeat(40);

function factor(rule: string, passed: boolean, penalty: number, reason: string): RiskFactor {
  return { rule, passed, penalty, reason };
}

function encodeCall(selector: string): string {
  return selector + '0'.repeat(56);
}

async function detectFunction(
  rpc: RpcProvider,
  address: string,
  selector: string,
): Promise<boolean> {
  try {
    const result = await rpc.ethCall(address, encodeCall(selector));
    return result !== '0x' && result !== '0x' + '0'.repeat(64) && result.length > 2;
  } catch {
    return false;
  }
}

export async function detectOwnerRenounced(rpc: RpcProvider, address: string): Promise<RiskFactor> {
  try {
    const result = await rpc.ethCall(address, encodeCall('0x8da5cb5b'));
    const owner = result.toLowerCase();
    const isRenounced = owner === ZERO_ADDR || owner === '0x' || owner === '0x' + '0'.repeat(64);
    return factor(
      'owner_renounced',
      isRenounced,
      isRenounced ? 0 : 15,
      isRenounced ? 'Ownership renounced (owner is zero address)' : 'Ownership not renounced',
    );
  } catch {
    return factor('owner_renounced', false, 15, 'Could not verify ownership');
  }
}

export async function detectMintable(rpc: RpcProvider, address: string): Promise<RiskFactor> {
  const sigs = ['0x40c10f19', '0xa0712d70'];
  for (const sig of sigs) {
    if (await detectFunction(rpc, address, sig)) {
      return factor('mintable', false, 25, 'Token has mint function');
    }
  }
  return factor('mintable', true, 0, 'No mint function detected');
}

export async function detectPausable(rpc: RpcProvider, address: string): Promise<RiskFactor> {
  const sigs = ['0x8456cb59', '0x3f4ba83a'];
  for (const sig of sigs) {
    if (await detectFunction(rpc, address, sig)) {
      return factor('pausable', false, 10, 'Token can be paused');
    }
  }
  return factor('pausable', true, 0, 'No pause function detected');
}

export async function detectBlacklistFunction(
  rpc: RpcProvider,
  address: string,
): Promise<RiskFactor> {
  const sigs = ['0xfe575a87', '0x9b3b76cc', '0x5136a324'];
  for (const sig of sigs) {
    if (await detectFunction(rpc, address, sig)) {
      return factor('blacklist_function', false, 25, 'Token has blacklist function');
    }
  }
  return factor('blacklist_function', true, 0, 'No blacklist function detected');
}

export async function detectProxyContract(rpc: RpcProvider, address: string): Promise<RiskFactor> {
  try {
    const impl = await detectFunction(rpc, address, '0x5c60da1b');
    const mc = await detectFunction(rpc, address, '0xa619486e');
    const isProxy = impl || mc;
    return factor(
      'proxy_contract',
      !isProxy,
      isProxy ? 10 : 0,
      isProxy ? 'Token is a proxy contract' : 'Not a proxy contract',
    );
  } catch {
    return factor('proxy_contract', true, 0, 'Could not verify proxy status');
  }
}

export async function detectVerifiedSource(rpc: RpcProvider, address: string): Promise<RiskFactor> {
  try {
    const code = await rpc.getCode(address);
    const hasSource = code !== '0x' && code.length > 100;
    return factor(
      'verified_source',
      hasSource,
      hasSource ? 0 : 20,
      hasSource
        ? 'Contract source verified (bytecode present)'
        : 'No source code or minimal bytecode',
    );
  } catch {
    return factor('verified_source', false, 20, 'Could not fetch contract code');
  }
}

export async function detectLiquidity(
  _rpc: RpcProvider,
  _address: string,
): Promise<{ locked: RiskFactor; buyTax: RiskFactor; sellTax: RiskFactor }> {
  return {
    locked: factor('liquidity_locked', false, 20, 'Liquidity lock status could not be determined'),
    buyTax: factor('buy_tax', true, 0, 'Buy tax check pending'),
    sellTax: factor('sell_tax', true, 0, 'Sell tax check pending'),
  };
}

export async function detectHolderDistribution(
  _rpc: RpcProvider,
  _address: string,
): Promise<{ top10Percent: RiskFactor; top1Percent: RiskFactor }> {
  return {
    top10Percent: factor('top10_holder_percent', true, 0, 'Holder distribution check pending'),
    top1Percent: factor('top1_holder_percent', true, 0, 'Top 1 holder check pending'),
  };
}

export function buildSecurityMetrics(metrics: {
  ownerRenounced: RiskFactor;
  mintable: RiskFactor;
  pausable: RiskFactor;
  blacklistFunction: RiskFactor;
  proxyContract: RiskFactor;
  verifiedSource: RiskFactor;
  liquidity: { locked: RiskFactor; buyTax: RiskFactor; sellTax: RiskFactor };
}): TokenSecurityMetrics {
  return {
    ownerRenounced: metrics.ownerRenounced.passed,
    mintable: !metrics.mintable.passed,
    pausable: !metrics.pausable.passed,
    blacklistFunction: !metrics.blacklistFunction.passed,
    proxyContract: !metrics.proxyContract.passed,
    verifiedSource: metrics.verifiedSource.passed,
    buyTax: 0,
    sellTax: 0,
    liquidityLocked: metrics.liquidity.locked.passed,
    liquidityPercent: 0,
    holderCount: 0,
    top10HolderPercent: 0,
    top1HolderPercent: 0,
  };
}
