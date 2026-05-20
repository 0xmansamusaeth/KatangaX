"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapSearchProfile } from "@/lib/supabase/mappers";

/**
 * Debounced username search for member invites.
 * @param {string} query
 * @param {number} [debounceMs=500]
 */
export function useSearch(query, debounceMs = 500) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = (query ?? "").trim().toLowerCase();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: rpcErr } = await supabase.rpc(
        "search_profiles_by_username",
        { query: q },
      );

      if (rpcErr) {
        setError(rpcErr.message);
        setResults([]);
      } else {
        const rows = Array.isArray(data) ? data : [];
        setResults(rows.map(mapSearchProfile));
      }
      setLoading(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { results, loading, error };
}
