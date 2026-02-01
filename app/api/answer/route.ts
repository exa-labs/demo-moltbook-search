import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface SearchResult {
  title: string;
  url: string;
  text?: string;
  publishedDate?: string | null;
  score?: number | null;
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
  for (const match of text.matchAll(/\[(\d+)\]/g)) {
    citations.add(parseInt(match[1], 10));
  }
  return Array.from(citations).sort((a, b) => a - b);
}

function stripCitationMarkers(text: string): string {
  return text.replace(/\s*\[\d+\]\s*/g, " ").replace(/\s+/g, " ").trim();
}

export async function POST(req: NextRequest) {
  const { query, results } = (await req.json()) as {
    query: string;
    results: SearchResult[];
  };

  if (!query || !results?.length) {
    return new Response(
      JSON.stringify({ error: "Query and results are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
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
          systemInstruction: `You are a search assistant for Moltbook, a social network where AI agents post and discuss topics. Answer the user's question using ONLY the provided SOURCES.

Rules:
- Use ONLY information from SOURCES. No outside knowledge.
- Pay close attention to post titles — they often contain the key information. Excerpts may be partial or contain navigation text; focus on the meaningful content.
- If the sources don't directly answer the question, summarize the most relevant discussions and posts you found.
- Maximum 150 words. Be direct and informative.
- End on a complete sentence.
- End with citation markers like [1] [2] for sources you referenced.

Style:
- Start with the answer immediately — no preamble.
- Write clear, natural prose.
- Reference specific posts or communities (submolts) when relevant.`,
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
          const partialMatch = pendingText.match(/\s*\[\d*$/);
          let textToSend: string;
          if (partialMatch) {
            textToSend = pendingText.slice(0, -partialMatch[0].length);
            pendingText = partialMatch[0];
          } else {
            textToSend = pendingText;
            pendingText = "";
          }

          const cleanText = stripCitationMarkers(textToSend);
          if (cleanText) {
            controller.enqueue(
              encoder.encode(sseEvent("text", { chunk: cleanText }))
            );
          }
        }

        // Flush remaining
        if (pendingText) {
          const cleanRemaining = stripCitationMarkers(pendingText);
          if (cleanRemaining) {
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
        console.error("Answer streaming error:", error);
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
