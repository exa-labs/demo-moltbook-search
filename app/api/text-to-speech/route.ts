import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface SearchResult {
  title: string;
  url: string;
  text?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { query, results } = await req.json() as {
      query: string;
      results: SearchResult[]
    };

    if (!query || !results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: "Query and results are required" },
        { status: 400 }
      );
    }

    // Generate a spoken summary using Gemini Flash (top 3 results)
    const topResults = results.slice(0, 3);
    let spokenSummary: string;

    try {
      const summaryPrompt = topResults
        .map((r, i) => `${i + 1}. "${r.title}"\n   ${r.text?.slice(0, 200) || "No description"}`)
        .join("\n\n");

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

      const result = await model.generateContent({
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

      spokenSummary = result.response.text()?.trim() ||
        `Looks like there's some interesting stuff on "${query}". Check out the results below.`;
    } catch (geminiError) {
      // Fallback: generate a simple but natural summary
      console.warn("Gemini summarization failed, using simple summary:", geminiError);
      const topTitle = topResults[0]?.title || query;
      spokenSummary = `Here's what came up for that. ${topTitle} looks relevant—check it out below.`;
    }

    // Generate speech using ElevenLabs
    const elevenLabsResponse = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", // Rachel voice
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
        },
        body: JSON.stringify({
          text: spokenSummary,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error("ElevenLabs TTS error:", errorText);
      return NextResponse.json(
        { error: "Text-to-speech failed" },
        { status: elevenLabsResponse.status }
      );
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      audio: base64Audio,
      text: spokenSummary,
      contentType: "audio/mpeg",
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Text-to-speech failed" },
      { status: 500 }
    );
  }
}
