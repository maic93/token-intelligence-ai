import { useState, useEffect, useCallback, useRef } from 'react';
import type { TokenData, ChainName } from '../types';
import { fetchTokens } from '../api';

interface UseTokensResult {
  tokens: TokenData[];
  loading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  chain: string | undefined;
  setChain: (chain: string | undefined) => void;
  search: string;
  setSearch: (search: string) => void;
  filteredTokens: TokenData[];
  hasMore: boolean;
}

const PAGE_SIZE = 20;

export function useTokens(): UseTokensResult {
  const [allTokens, setAllTokens] = useState<TokenData[]>([]);
  const [page, setPage] = useState(1);
  const [chain, setChain] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    setAllTokens([]);
    setPage(1);
    hasMoreRef.current = true;
  }, [chain]);

  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError(null);

    fetchTokens({ page, limit: PAGE_SIZE, chain: chain as ChainName | undefined }, abort.signal)
      .then((res) => {
        setAllTokens((prev) => {
          if (page === 1) return res.data;
          const existing = new Set(prev.map((t) => `${t.chain}:${t.contractAddress}`));
          const unique = res.data.filter((t) => !existing.has(`${t.chain}:${t.contractAddress}`));
          return [...prev, ...unique];
        });
        hasMoreRef.current = res.data.length >= PAGE_SIZE;
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => abort.abort();
  }, [page, chain]);

  const query = search.toLowerCase();
  const filteredTokens = allTokens.filter(
    (t) =>
      t.tokenName.toLowerCase().includes(query) ||
      t.tokenSymbol.toLowerCase().includes(query) ||
      t.contractAddress.toLowerCase().includes(query),
  );

  return {
    tokens: allTokens,
    loading,
    error,
    page,
    setPage: useCallback((p: number) => setPage(p), []),
    chain,
    setChain: useCallback((c: string | undefined) => setChain(c), []),
    search,
    setSearch: useCallback((s: string) => setSearch(s), []),
    filteredTokens,
    hasMore: hasMoreRef.current,
  };
}
