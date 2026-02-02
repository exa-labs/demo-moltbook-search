import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

let _exa: Exa | null = null;
function getExa() {
  if (!_exa) _exa = new Exa(process.env.EXA_API_KEY as string);
  return _exa;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface SearchResult {
  title: string;
  url: string;
  text: string;
  publishedDate: string | null;
  score: number | null;
}

const GENERIC_TITLES = [
  "the front page of the agent internet - moltbook",
  "moltbook - the front page of the agent internet",
  "a social network for ai agents",
];

function cleanTitle(title: string, url: string): string {
  const lower = title.toLowerCase().trim();
  const isGeneric = !title || GENERIC_TITLES.some((g) => lower.includes(g));
  if (!isGeneric) return title;

  // Extract a meaningful title from the URL
  try {
    const path = new URL(url).pathname;
    const parts = path.split("/").filter(Boolean);
    if (parts[0] === "m" && parts[1]) return `m/${parts[1]}`;
    if (parts[0] === "s" && parts[1]) return `m/${parts[1]}`;
    if (parts[0] === "u" && parts[1]) return `u/${parts[1]}`;
    if (parts[0] === "post" && parts[1]) return `Post · ${parts[1].slice(0, 8)}`;
  } catch {
    // ignore
  }
  return title || "Untitled";
}

function cleanSnippet(text: string): string {
  if (!text) return "";
  // Strip common SPA boilerplate
  const stripped = text
    .replace(/moltbook - the front page of the agent internet/gi, "")
    .replace(/\[!\[Moltbook mascot\][\s\S]*?moltbookbeta\s*\]/gi, "")
    .replace(/Loading\.\.\./g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function sseEvent(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function extractCitations(text: string): number[] {
  const citations = new Set<number>();
  // Match [1], [2], and also [1, 4] or [1,2,3] style
  for (const match of text.matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)) {
    for (const num of match[1].split(",")) {
      const n = parseInt(num.trim(), 10);
      if (!isNaN(n)) citations.add(n);
    }
  }
  return Array.from(citations).sort((a, b) => a - b);
}

function stripCitationMarkers(text: string): string {
  // Replace citation markers with a space, then also handle comma-separated
  // citations like [1, 4] or [1,2,3]
  return text
    .replace(/\s*\[\d+(?:\s*,\s*\d+)*\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  const { query, numResults = 10 } = await req.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { error: "Query is required" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Phase 1: Exa search
        const exaResult = await getExa().searchAndContents(query, {
          type: "auto",
          numResults: Math.min(numResults, 20),
          text: { maxCharacters: 500 },
          highlights: { numSentences: 5, highlightsPerUrl: 5 },
          includeDomains: ["moltbook.com"],
          livecrawl: "fallback" as const,
          livecrawlTimeout: 5000,
          max_age_hours: 12,
        });

        const results: SearchResult[] = exaResult.results
          .map((r) => {
            const highlights = (r.highlights || []).join(" ");
            const text = r.text || "";
            // Use highlights if text is just a loading shell
            const content = text.includes("Loading...") && highlights
              ? highlights
              : text;
            return {
              title: cleanTitle(r.title || "", r.url),
              url: r.url,
              text: cleanSnippet(content),
              publishedDate: r.publishedDate || null,
              score: r.score || null,
            };
          })
          .filter((r) => {
            // Remove results with no meaningful content
            const hasRealTitle = !/^Post · [a-f0-9]{8}$/.test(r.title);
            const hasContent = r.text.length > 20;
            return hasRealTitle || hasContent;
          });

        controller.enqueue(
          encoder.encode(sseEvent("search_results", { results, query }))
        );

        if (results.length === 0) {
          controller.enqueue(encoder.encode(sseEvent("done", {})));
          controller.close();
          return;
        }

        // Phase 2: Gemini streaming answer
        const topResults = results.slice(0, 5);

        const sources = topResults
          .map((r, i) => {
            const domain = getDomain(r.url || "");
            return `[${i + 1}] title: ${r.title || "Untitled"}
    domain: ${domain}
    url: ${r.url || ""}
    date: ${r.publishedDate || "unknown"}
    excerpt: ${(r.text || "No excerpt available").slice(0, 500)}`;
          })
          .join("\n\n");

        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          systemInstruction: `You are a search assistant for Moltbook, a social network where AI agents post and discuss topics.

Your job: Give a helpful, direct answer to the user's question based on the SOURCES provided. Actually answer the question — don't just list what you found.

Rules:
- Use information from SOURCES. Synthesize it into a real answer.
- If asked for recommendations, give specific ones. If asked "what's funny", describe the funny things.
- Quote or paraphrase interesting content from the sources — titles, comments, usernames, communities.
- Maximum 150 words. Be direct, specific, and engaging.
- End on a complete sentence.
- Put citation numbers at the very end of your response on their own, like: [1] [2] [3]
- NEVER put citation numbers inline within sentences. Only at the end.

Style:
- Start with the answer immediately — no preamble, no apologies, no disclaimers.
- Write like you're telling a friend about what you found.
- Be specific: name the posts, agents, and communities.`,
        });

        const userPrompt = `Question: "${query}"

SOURCES (use ONLY these):
${sources}

Respond in plain text. End with citation markers like [1] [2].`;

        let fullText = "";
        let pendingText = "";

        const result = await model.generateContentStream({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          },
        });

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (!text) continue;

          fullText += text;
          pendingText += text;

          // Hold back partial citation markers at the end
          // Matches: [, [1, [1,, [1, 2, etc.
          const partialMatch = pendingText.match(/\s*\[\d*(?:\s*,\s*\d*)*$/);
          let textToSend: string;
          if (partialMatch) {
            textToSend = pendingText.slice(0, -partialMatch[0].length);
            pendingText = partialMatch[0];
          } else {
            textToSend = pendingText;
            pendingText = "";
          }

          // Don't trim during streaming — preserves leading spaces so words
          // don't merge when a citation sat between them across chunks.
          const cleanText = textToSend
            .replace(/\s*\[\d+(?:\s*,\s*\d+)*\]\s*/g, " ")
            .replace(/\s+/g, " ");
          if (cleanText) {
            controller.enqueue(
              encoder.encode(sseEvent("text", { chunk: cleanText }))
            );
          }
        }

        // Flush remaining (no trim — same reason as above)
        if (pendingText) {
          const cleanRemaining = pendingText
            .replace(/\s*\[\d+(?:\s*,\s*\d+)*\]\s*/g, " ")
            .replace(/\s+/g, " ");
          if (cleanRemaining.trim()) {
            controller.enqueue(
              encoder.encode(sseEvent("text", { chunk: cleanRemaining }))
            );
          }
        }

        const citations = extractCitations(fullText);
        controller.enqueue(
          encoder.encode(
            sseEvent("textDone", {
              fullText: stripCitationMarkers(fullText),
              citations,
            })
          )
        );

        controller.enqueue(encoder.encode(sseEvent("done", {})));
        controller.close();
      } catch (error) {
        console.error("Search/answer error:", error);
        controller.enqueue(
          encoder.encode(
            sseEvent("error", {
              error:
                error instanceof Error ? error.message : "Unknown error",
            })
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
