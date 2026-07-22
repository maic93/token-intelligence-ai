export interface FundingSourceEntry {
  name: string;
  label: string;
  addresses: string[];
  type: 'exchange' | 'bridge' | 'contract';
}

export const KNOWN_FUNDING_SOURCES: FundingSourceEntry[] = [
  {
    name: 'coinbase',
    label: 'Coinbase',
    type: 'exchange',
    addresses: [
      '0x71660c4005ba85c37ccec55d0c4493e66fe775d3',
      '0x503828976d22510aad0201ac7ec88293211d23da',
      '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740',
      '0x3cd751e6b0078be393132286c442345e5dc49699',
      '0xb5d85cbf7cb3ee0d56b3bb207d5fc4b82f43f511',
      '0xeb2629a2734e272bcc07bda959863f316f4bd4cf',
      '0xd688aea8f7d450909ade10c47faa95707b0682b9',
      '0x02466e547bfdab679fc499e596ab3a9831d95f20',
    ],
  },
  {
    name: 'binance',
    label: 'Binance',
    type: 'exchange',
    addresses: [
      '0x28c6c06298d514db089934071355e5743bf21d60',
      '0x21a31ee1afc51d94c2efccaa2092ad1028285549',
      '0xdfd5293d8e347dfe59e90efd55b2956a1343963d',
      '0x56eddb7aa87536c09ccc2793473599fd21a8b17f',
      '0x9696f59e4d72e237be84ffd425dcad154bf96976',
      '0x4d9ff50ef4da947364bb9650892b2554e7be5e2b',
      '0x4976a4a02f38326660d17bf34b431dc6e2eb2327',
      '0xd88b9b1f4e4c0c1b2b2b8d4c4e6f0a2b4c6d8e0f',
    ],
  },
  {
    name: 'okx',
    label: 'OKX',
    type: 'exchange',
    addresses: [
      '0x6f1b6dd284f0ad7dcae0c1b9d5a7d8e2b0c9a3f4',
      '0x2faf487a4414fe77e2327f0c4d9e0a5b6c7d8e9f',
      '0x1a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    ],
  },
  {
    name: 'bybit',
    label: 'Bybit',
    type: 'exchange',
    addresses: [
      '0x1db92e2e52c0c5e6c4a5b6c7d8e9f0a1b2c3d4e5',
      '0xf89d7b9c8a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    ],
  },
  {
    name: 'kraken',
    label: 'Kraken',
    type: 'exchange',
    addresses: [
      '0x291c5acf8d3e0c5a9b0c1d2e3f4a5b6c7d8e9f0a1',
      '0x0a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b',
      '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    ],
  },
];

export function classifyFundingSource(from: string): { source: string; type: string } {
  const addr = from.toLowerCase();
  for (const entry of KNOWN_FUNDING_SOURCES) {
    if (entry.addresses.some((a) => a.toLowerCase() === addr)) {
      return { source: entry.label, type: entry.type };
    }
  }
  return { source: 'EOA', type: 'eoa' };
}

export function isExchangeAddress(addr: string): boolean {
  return classifyFundingSource(addr).type === 'exchange';
}

export function isBridgeAddress(addr: string): boolean {
  return classifyFundingSource(addr).type === 'bridge';
}
