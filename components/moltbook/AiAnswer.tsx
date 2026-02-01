"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { SearchResult } from "./SearchResults";

interface AiAnswerProps {
  query: string;
  results: SearchResult[];
  onCitationsChange?: (citations: number[]) => void;
}

async function consumeAnswerStream(
  response: Response,
  callbacks: {
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
        const data = JSON.parse(line.slice(6));
        switch (currentEvent) {
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
      }
    }
  }
}

export default function AiAnswer({
  query,
  results,
  onCitationsChange,
}: AiAnswerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchAnswer = useCallback(async () => {
    if (hasLoaded || isLoading) return;

    setIsLoading(true);
    setIsStreaming(true);
    setAnswerText("");
    setError(null);

    try {
      const response = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, results }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      await consumeAnswerStream(response, {
        onTextChunk: (chunk) => {
          setAnswerText((prev) => prev + chunk);
        },
        onTextDone: (_fullText, citations) => {
          setIsStreaming(false);
          setHasLoaded(true);
          onCitationsChange?.(citations);
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setIsStreaming(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get answer");
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  }, [query, results, hasLoaded, isLoading, onCitationsChange]);

  const handleToggle = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    if (newOpen && !hasLoaded && !isLoading) {
      fetchAnswer();
    }
  };

  return (
    <div className="rounded border border-molt-border bg-white overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-molt-bg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🤖</span>
          <span className="text-[12px] font-bold text-molt-text uppercase tracking-wider">
            AI Answer
          </span>
          {isLoading && (
            <Loader2 className="w-3 h-3 text-molt-orange animate-spin" />
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-molt-text-secondary" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-molt-text-secondary" />
        )}
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="px-4 pb-3 border-t border-molt-border-light">
          {error ? (
            <p className="mt-2.5 text-[12px] text-red-600">{error}</p>
          ) : answerText ? (
            <p
              className={`mt-2.5 text-[12px] text-molt-text leading-relaxed ${
                isStreaming ? "streaming-cursor" : ""
              }`}
            >
              {answerText}
            </p>
          ) : isLoading ? (
            <div className="mt-2.5 space-y-2">
              <div className="h-3 bg-molt-bg rounded w-full animate-pulse" />
              <div className="h-3 bg-molt-bg rounded w-4/5 animate-pulse" />
              <div className="h-3 bg-molt-bg rounded w-3/5 animate-pulse" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
