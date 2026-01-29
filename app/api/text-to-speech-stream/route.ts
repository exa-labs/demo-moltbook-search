import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface SearchResult {
  title: string;
  url: string;
  text?: string;
}

function sseEvent(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const { query, results } = (await req.json()) as {
    query: string;
    results: SearchResult[];
  };

  if (!query || !results || !Array.isArray(results)) {
    return new Response(
      JSON.stringify({ error: "Query and results are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // --- Stage 1: Stream Gemini text generation ---
        const topResults = results.slice(0, 3);
        const summaryPrompt = topResults
          .map(
            (r, i) =>
              `${i + 1}. "${r.title}"\n   ${r.text?.slice(0, 200) || "No description"}`
          )
          .join("\n\n");

        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
        });

        const systemPrompt = `You are a knowledgeable friend summarizing search results. Speak naturally like you're having a conversation.

CRITICAL RULES:
- ONLY use facts, names, and claims that appear in the search results below. Do NOT add information from your own knowledge.
- If the search results don't contain enough information to answer, say so honestly.
- Cite specifics from the results: mention article titles, sources, or quoted facts.

Style guidelines:
- Start with the answer or insight, not "I found..." or "Based on my search..."
- Talk like a real person - use "So," "Actually," "Looks like," "Interesting—"
- Share 2-3 key findings directly from the results
- Keep it under 60 words (about 12 seconds of speech)
- Sound curious and helpful, not robotic

Bad: "I found 3 results about AI startups. The top results include Anthropic and Mistral."
Good: "So according to TechCrunch, Anthropic just raised another round—they're doubling down on AI safety. And Mistral's going open-source, per The Verge. Pretty competitive space right now."`;

        const userPrompt = `Someone asked: "${query}"

Here are the search results from Exa (use ONLY these as your source of truth):
${summaryPrompt}

Respond naturally in under 60 words, grounding every claim in the results above:`;

        let fullText = "";

        try {
          const result = await model.generateContentStream({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 150,
            },
          });

          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullText += text;
              controller.enqueue(
                encoder.encode(sseEvent("text", { chunk: text }))
              );
            }
          }
        } catch (geminiError) {
          console.warn("Gemini streaming failed, using fallback:", geminiError);
          const topTitle = topResults[0]?.title || query;
          fullText = `Here's what came up for that. ${topTitle} looks relevant—check it out below.`;
          controller.enqueue(
            encoder.encode(sseEvent("text", { chunk: fullText }))
          );
        }

        fullText = fullText.trim();
        if (!fullText) {
          fullText = `Looks like there's some interesting stuff on "${query}". Check out the results below.`;
        }

        controller.enqueue(
          encoder.encode(sseEvent("textDone", { fullText }))
        );

        // --- Stage 2: Stream ElevenLabs TTS audio ---
        const ttsResponse = await fetch(
          "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
            },
            body: JSON.stringify({
              text: fullText,
              model_id: "eleven_turbo_v2_5",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
              output_format: "mp3_22050_32",
            }),
          }
        );

        if (!ttsResponse.ok || !ttsResponse.body) {
          const errorText = await ttsResponse.text().catch(() => "Unknown");
          console.error("ElevenLabs streaming TTS error:", errorText);
          controller.enqueue(
            encoder.encode(
              sseEvent("error", { error: "Text-to-speech failed" })
            )
          );
          controller.close();
          return;
        }

        // Stream audio chunks from ElevenLabs to client
        const reader = ttsResponse.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const base64Chunk = Buffer.from(value).toString("base64");
          controller.enqueue(
            encoder.encode(sseEvent("audio", { chunk: base64Chunk }))
          );
        }

        controller.enqueue(encoder.encode(sseEvent("done", {})));
        controller.close();
      } catch (error) {
        console.error("Streaming TTS error:", error);
        controller.enqueue(
          encoder.encode(
            sseEvent("error", {
              error: error instanceof Error ? error.message : "Unknown error",
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
