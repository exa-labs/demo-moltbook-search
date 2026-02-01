"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface AiAnswerProps {
  answerText: string;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
}

export default function AiAnswer({
  answerText,
  isStreaming,
  isLoading,
  error,
}: AiAnswerProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded border border-molt-border bg-molt-card overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-molt-bg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🤖</span>
          <span className="text-[12px] font-bold text-molt-text uppercase tracking-wider">
            AI Answer
          </span>
          {(isLoading || isStreaming) && (
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
            <p className="mt-2.5 text-[12px] text-red-600 dark:text-red-400">{error}</p>
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
