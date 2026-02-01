"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

export interface SearchResult {
  title: string;
  url: string;
  text?: string;
  publishedDate?: string | null;
  score?: number | null;
}

interface SearchResultsProps {
  results: SearchResult[];
  citations?: number[];
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getSubmolt(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    const match = path.match(/^\/(?:s|m|submolt)\/([^/]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function formatDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return null;
  }
}

export default function SearchResults({
  results,
  citations = [],
}: SearchResultsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedResults = showAll ? results : results.slice(0, 8);

  return (
    <div>
      {/* Reddit-style stacked list */}
      <div className="rounded border border-molt-border bg-white overflow-hidden">
        {displayedResults.map((result, index) => {
          const isCited = citations.includes(index + 1);
          const submolt = getSubmolt(result.url);
          const date = formatDate(result.publishedDate);

          return (
            <div
              key={index}
              className={`border-b border-molt-border-light last:border-b-0 transition-colors hover:bg-molt-bg ${
                isCited ? "bg-orange-50/60" : ""
              }`}
            >
              <div className="flex">
                {/* Index number column */}
                <div className="flex-shrink-0 w-10 flex items-start justify-center pt-3 text-[11px] font-semibold text-molt-text-muted">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 py-3 pr-4">
                  {/* Title row */}
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <h3 className="text-[13px] font-medium text-molt-text group-hover:text-molt-blue leading-snug">
                      {result.title || "Untitled"}
                      <ExternalLink className="inline-block w-3 h-3 ml-1.5 text-molt-text-muted group-hover:text-molt-blue align-baseline" />
                    </h3>
                  </a>

                  {/* Meta line */}
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-molt-text-secondary">
                    <span className="text-molt-text-muted">
                      {getDomain(result.url)}
                    </span>
                    {submolt && (
                      <>
                        <span className="text-molt-text-muted">&middot;</span>
                        <span className="text-molt-orange font-medium">
                          m/{submolt}
                        </span>
                      </>
                    )}
                    {date && (
                      <>
                        <span className="text-molt-text-muted">&middot;</span>
                        <span>{date}</span>
                      </>
                    )}
                    {isCited && (
                      <>
                        <span className="text-molt-text-muted">&middot;</span>
                        <span className="text-molt-orange font-semibold uppercase text-[10px]">
                          cited
                        </span>
                      </>
                    )}
                  </div>

                  {/* Excerpt */}
                  {result.text && (
                    <p className="mt-1.5 text-[12px] text-molt-text-secondary line-clamp-2 leading-relaxed">
                      {result.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {results.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 mx-auto mt-3 text-[12px] text-molt-blue hover:underline font-medium py-1"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Show all {results.length} results
            </>
          )}
        </button>
      )}
    </div>
  );
}
