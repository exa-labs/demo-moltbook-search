"use client";

import { useState, useCallback, useRef, FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import SearchResults, { type SearchResult } from "./SearchResults";
import AiAnswer from "./AiAnswer";

const EXAMPLE_QUERIES = [
  "best AI agent frameworks",
  "MCP tools and servers",
  "agents discussing consciousness",
  "most upvoted posts this week",
  "AI agents building startups",
];

type SearchState = "idle" | "searching" | "done";

export default function MoltbookSearch() {
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [citations, setCitations] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      setSearchState("searching");
      setResults([]);
      setCitations([]);
      setError(null);
      setLastQuery(trimmed);

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        setResults(data.results || []);
        setSearchState("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setSearchState("done");
      }
    },
    []
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    handleSearch(example);
  };

  const isSearching = searchState === "searching";

  return (
    <div className="min-h-screen bg-molt-bg font-mono">
      {/* Header - dark bar like moltbook */}
      <header className="bg-molt-header">
        <div className="mx-auto max-w-4xl px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🦞</span>
            <span className="text-sm font-bold text-white tracking-tight">
              moltbook<span className="text-molt-cyan">search</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-molt-orange bg-molt-orange/15 px-1.5 py-0.5 rounded">
              beta
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">
            powered by{" "}
            <a
              href="https://exa.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-molt-cyan hover:underline"
            >
              exa.ai
            </a>
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-4">
        {/* Search section */}
        <div
          className={`transition-all duration-500 ${
            searchState === "idle" ? "pt-[18vh]" : "pt-5"
          }`}
        >
          {/* Hero text - only show in idle */}
          {searchState === "idle" && (
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-molt-text mb-1">
                Search the agent internet
              </h2>
              <p className="text-xs text-molt-text-secondary">
                Find posts, discussions, and insights from moltbook.com
              </p>
            </div>
          )}

          {/* Search bar */}
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-molt-text-muted pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search moltbook..."
                  disabled={isSearching}
                  className="w-full rounded border border-molt-border bg-white pl-9 pr-3 py-2 text-[13px] text-molt-text placeholder:text-molt-text-muted focus:outline-none focus:border-molt-cyan focus:shadow-[0_0_0_2px_rgba(0,212,170,0.2)] transition-all disabled:opacity-60"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="rounded bg-molt-red px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:brightness-110 transition-all disabled:opacity-40"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </form>

          {/* Example queries - only in idle */}
          {searchState === "idle" && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              {EXAMPLE_QUERIES.map((example) => (
                <button
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  className="rounded-full border border-molt-border bg-white px-3 py-1 text-[11px] text-molt-text-secondary hover:text-molt-blue hover:border-molt-blue transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results section */}
        {searchState !== "idle" && (
          <div className="mt-4 pb-16">
            {/* Loading state */}
            {isSearching && (
              <div className="rounded border border-molt-border bg-white">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 border-b border-molt-border-light last:border-b-0 animate-pulse"
                  >
                    <div className="h-3.5 bg-molt-bg rounded w-3/4 mb-2" />
                    <div className="h-2.5 bg-molt-bg rounded w-2/5 mb-2" />
                    <div className="h-2.5 bg-molt-bg rounded w-full" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Results */}
            {!isSearching && results.length > 0 && (
              <div className="space-y-3">
                {/* AI Answer */}
                <AiAnswer
                  query={lastQuery}
                  results={results}
                  onCitationsChange={setCitations}
                />

                {/* Result count */}
                <div className="text-[11px] text-molt-text-secondary">
                  {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
                  <span className="font-semibold text-molt-text">
                    &ldquo;{lastQuery}&rdquo;
                  </span>
                </div>

                {/* Results list */}
                <SearchResults results={results} citations={citations} />
              </div>
            )}

            {/* No results */}
            {!isSearching &&
              !error &&
              results.length === 0 &&
              searchState === "done" && (
                <div className="text-center py-12 rounded border border-molt-border bg-white">
                  <p className="text-xs text-molt-text-secondary">
                    No results found for &ldquo;{lastQuery}&rdquo;
                  </p>
                  <p className="text-[11px] text-molt-text-muted mt-1">
                    Try a different search query
                  </p>
                </div>
              )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-molt-bg border-t border-molt-border-light">
        <div className="mx-auto max-w-2xl px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] text-molt-text-muted">
            &copy; 2026 moltbook search
          </span>
          <span className="text-[10px] text-molt-text-muted">
            Built for agents, by agents
          </span>
        </div>
      </footer>
    </div>
  );
}
