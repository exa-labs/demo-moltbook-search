import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";
import { analyzeAndOptimizeQuery } from "@/lib/query-optimizer";

export const maxDuration = 60;

let _exa: Exa | null = null;
function getExa() {
  if (!_exa) _exa = new Exa(process.env.EXA_API_KEY as string);
  return _exa;
}

export async function POST(req: NextRequest) {
  try {
    const { query, mode = "fast", numResults = 10, withContents = false } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Analyze and optimize the query
    const queryConfig = analyzeAndOptimizeQuery(query);

    // Use "fast" for instant results (lowest latency), "auto" for best quality
    // Use "auto" if autoprompt is recommended for this query type
    const searchType = mode === "auto" || queryConfig.useAutoprompt ? "auto" : "fast";

    // Build search options based on query analysis
    const baseOptions: Record<string, unknown> = {
      type: searchType,
      numResults: Math.min(numResults, 10),
    };

    // Add date filters for news/recent queries
    if (queryConfig.startPublishedDate) {
      baseOptions.startPublishedDate = queryConfig.startPublishedDate;
    }
    if (queryConfig.endPublishedDate) {
      baseOptions.endPublishedDate = queryConfig.endPublishedDate;
    }

    // Add category filter if detected
    if (queryConfig.category === "news") {
      baseOptions.category = "news";
    } else if (queryConfig.category === "company") {
      baseOptions.category = "company";
    } else if (queryConfig.category === "research") {
      baseOptions.category = "research paper";
    } else if (queryConfig.category === "github") {
      baseOptions.category = "github";
    } else if (queryConfig.category === "tweet") {
      baseOptions.category = "tweet";
    }

    if (withContents) {
      // Stage 2: Full search with text snippets (for final results + TTS)
      const textOptions: { maxCharacters: number; maxAgeHours?: number } = {
        maxCharacters: 1000
      };

      // Use live crawl for time-sensitive queries (weather, stocks, sports, etc.)
      if (queryConfig.needsLiveCrawl) {
        textOptions.maxAgeHours = 0;
      }

      const result = await getExa().searchAndContents(queryConfig.query, {
        ...baseOptions,
        text: textOptions,
        ...(queryConfig.needsLiveCrawl ? { livecrawl: "always" as const } : {}),
      });

      const results = result.results.map((r) => ({
        title: r.title || "Untitled",
        url: r.url,
        text: r.text || "",
        image: r.image || null,
        publishedDate: r.publishedDate || null,
        score: r.score || null,
      }));

      return NextResponse.json({
        results,
        mode: searchType,
        hasContents: true,
        category: queryConfig.category,
        optimizedQuery: queryConfig.query,
        liveCrawl: queryConfig.needsLiveCrawl || false,
      });
    } else {
      // Stage 1: Fast search - just titles and URLs (no contents)
      // This is much faster for instant display
      // Note: For live crawl queries, we still do fast search here since contents come in stage 2
      const result = await getExa().search(queryConfig.query, baseOptions);

      const results = result.results.map((r) => ({
        title: r.title || "Untitled",
        url: r.url,
        text: "", // No text in stage 1
        image: null,
        publishedDate: r.publishedDate || null,
        score: r.score || null,
      }));

      return NextResponse.json({
        results,
        mode: searchType,
        hasContents: false,
        category: queryConfig.category,
        optimizedQuery: queryConfig.query,
        liveCrawl: queryConfig.needsLiveCrawl || false,
      });
    }
  } catch (error) {
    console.error("Voice search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
