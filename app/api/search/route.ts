import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";

export const maxDuration = 60;

let _exa: Exa | null = null;
function getExa() {
  if (!_exa) _exa = new Exa(process.env.EXA_API_KEY as string);
  return _exa;
}

export async function POST(req: NextRequest) {
  try {
    const { query, numResults = 10 } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const result = await getExa().searchAndContents(query, {
      type: "auto",
      numResults: Math.min(numResults, 20),
      text: { maxCharacters: 500 },
      includeDomains: ["moltbook.com"],
    });

    const results = result.results.map((r) => ({
      title: r.title || "Untitled",
      url: r.url,
      text: r.text || "",
      publishedDate: r.publishedDate || null,
      score: r.score || null,
    }));

    return NextResponse.json({ results, query });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
