"use client";

import { useState, useCallback, useRef, useEffect, FormEvent } from "react";
import { Search, Loader2, Sun, Moon } from "lucide-react";
import SearchResults, { type SearchResult } from "./SearchResults";
import AiAnswer from "./AiAnswer";

const EXAMPLE_QUERIES = [
  "best AI agent frameworks",
  "funniest agent posts",
  "agents discussing consciousness",
  "most upvoted posts this week",
  "AI agents building startups",
];

type SearchState = "idle" | "searching" | "done";

async function consumeSearchStream(
  response: Response,
  callbacks: {
    onSearchResults: (results: SearchResult[], query: string) => void;
    onTextChunk: (chunk: string) => void;
    onTextDone: (fullText: string, citations: number[]) => void;
    onError: (error: string) => void;
  }
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          switch (currentEvent) {
            case "search_results":
              callbacks.onSearchResults(data.results, data.query);
              break;
            case "text":
              callbacks.onTextChunk(data.chunk);
              break;
            case "textDone":
              callbacks.onTextDone(data.fullText, data.citations || []);
              break;
            case "error":
              callbacks.onError(data.error);
              break;
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}

export default function MoltbookSearch() {
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [citations, setCitations] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [isAnswerStreaming, setIsAnswerStreaming] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      // Abort any in-flight stream
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setSearchState("searching");
      setResults([]);
      setCitations([]);
      setError(null);
      setAnswerText("");
      setAnswerError(null);
      setIsAnswerStreaming(false);
      setLastQuery(trimmed);

      try {
        const response = await fetch("/moltbook/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        await consumeSearchStream(response, {
          onSearchResults: (searchResults) => {
            setResults(searchResults);
            setSearchState("done");
            setIsAnswerStreaming(true);
          },
          onTextChunk: (chunk) => {
            setAnswerText((prev) => prev + chunk);
          },
          onTextDone: (fullText, citationsList) => {
            setAnswerText(fullText);
            setIsAnswerStreaming(false);
            setCitations(citationsList);
          },
          onError: (errorMsg) => {
            setAnswerError(errorMsg);
            setIsAnswerStreaming(false);
          },
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
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
      {/* Header - tall dark bar like moltbook.com */}
      <header className="bg-molt-header border-b-[3px] border-molt-red">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              setSearchState("idle");
              setResults([]);
              setCitations([]);
              setError(null);
              setAnswerText("");
              setAnswerError(null);
              setIsAnswerStreaming(false);
              setQuery("");
              abortRef.current?.abort();
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src="/moltbook/mascot.png" alt="Moltbook" className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight leading-none">
              <span className="text-molt-red">moltbook</span>
              <span className="text-white ml-1.5">search</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
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
            <button
              onClick={toggleTheme}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
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
                  className="w-full rounded border border-molt-border bg-molt-card pl-9 pr-3 py-2 text-[13px] text-molt-text placeholder:text-molt-text-muted focus:outline-none focus:border-molt-cyan focus:shadow-[0_0_0_2px_rgba(0,212,170,0.2)] transition-all disabled:opacity-60"
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
                  className="rounded-full border border-molt-border bg-molt-card px-3 py-1 text-[11px] text-molt-text-secondary hover:text-molt-blue hover:border-molt-blue transition-colors"
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
              <div className="rounded border border-molt-border bg-molt-card">
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
              <div className="rounded border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Results */}
            {!isSearching && results.length > 0 && (
              <div className="space-y-3">
                {/* AI Answer */}
                <AiAnswer
                  answerText={answerText}
                  isStreaming={isAnswerStreaming}
                  isLoading={isAnswerStreaming && !answerText}
                  error={answerError}
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
                <div className="text-center py-12 rounded border border-molt-border bg-molt-card">
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
            &copy; 2026 Exa Labs
          </span>
          <a
            href="https://exa.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-molt-text-muted hover:text-molt-cyan transition-colors"
          >
            Powering agents with the best web data
          </a>
        </div>
      </footer>
    </div>
  );
}
