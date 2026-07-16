import { useState, useEffect, useCallback, useRef } from 'react';
import type { TokenData, TokenSearchResponse } from '../types';
import { fetchTokens } from '../api';

export interface TokenFilters {
  q: string;
  chain: string;
  risk: string;
  sort: string;
  deployer: string;
  minScore: string;
  maxScore: string;
  from: string;
  to: string;
}

const DEBOUNCE_MS = 300;

export function useTokens() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<TokenFilters>({
    q: '',
    chain: '',
    risk: '',
    sort: '',
    deployer: '',
    minScore: '',
    maxScore: '',
    from: '',
    to: '',
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadingRef = useRef(false);

  const loadTokens = useCallback(
    async (f: TokenFilters, cursorVal?: string | null, append = false) => {
      if (abortRef.current) abortRef.current.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      loadingRef.current = true;
      if (!append) setLoading(true);
      setError(null);

      try {
        const params: Record<string, string | number | undefined> = { limit: 20 };
        if (f.q) params.q = f.q;
        if (f.chain) params.chain = f.chain;
        if (f.risk) params.risk = f.risk;
        if (f.sort) params.sort = f.sort;
        if (f.deployer) params.deployer = f.deployer;
        if (f.minScore) params.minScore = Number(f.minScore);
        if (f.maxScore) params.maxScore = Number(f.maxScore);
        if (f.from) params.from = f.from;
        if (f.to) params.to = f.to;
        if (cursorVal) params.cursor = cursorVal;

        const res = (await fetchTokens(params, abort.signal)) as TokenSearchResponse;

        if (!abort.signal.aborted) {
          const newTokens = res.data;
          setTokens((prev) => (append ? [...prev, ...newTokens] : newTokens));
          setTotal(res.total);
          setCursor(res.nextCursor);
          setHasMore(res.nextCursor !== null);
          setLoading(false);
          loadingRef.current = false;
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Failed to load tokens');
          setLoading(false);
          loadingRef.current = false;
        }
      }
    },
    [],
  );

  const updateFilter = useCallback(
    (key: keyof TokenFilters, value: string) => {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          loadTokens(next, null, false);
        }, DEBOUNCE_MS);
        return next;
      });
    },
    [loadTokens],
  );

  const loadMore = useCallback(() => {
    if (!loadingRef.current && cursor && hasMore) {
      loadTokens(filters, cursor, true);
    }
  }, [cursor, hasMore, filters, loadTokens]);

  const clearFilters = useCallback(() => {
    const empty: TokenFilters = {
      q: '',
      chain: '',
      risk: '',
      sort: '',
      deployer: '',
      minScore: '',
      maxScore: '',
      from: '',
      to: '',
    };
    setFilters(empty);
    loadTokens(empty, null, false);
  }, [loadTokens]);

  useEffect(() => {
    loadTokens(filters, null, false);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return {
    tokens,
    loading,
    error,
    total,
    hasMore,
    filters,
    updateFilter,
    loadMore,
    clearFilters,
  };
}
