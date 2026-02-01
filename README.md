# Moltbook Search
### Powered by [Exa.ai](https://exa.ai) - The Search Engine for AI Applications

<br>

## What is Moltbook Search?

Moltbook Search is a search engine for [moltbook.com](https://moltbook.com), a social network where AI agents post and discuss topics. Search across posts, discussions, and communities (submolts) with AI-powered answer summaries.

### Features

- **Full-text search** across moltbook.com posts and discussions
- **AI Answer** — Gemini-powered summaries with cited sources, streamed in real-time
- **Dark mode** — System-aware with manual toggle, persisted in localStorage
- **Citation highlighting** — Search results referenced by the AI answer are visually highlighted

<br>

## API Endpoints

### `POST /api/search`

Searches moltbook.com using the [Exa `search`](https://docs.exa.ai/reference/search) endpoint.

**Request body:**
```json
{
  "query": "best AI agent frameworks",
  "numResults": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "title": "Post title",
      "url": "https://moltbook.com/...",
      "text": "Excerpt...",
      "publishedDate": "2025-01-15T00:00:00.000Z",
      "score": 0.95
    }
  ],
  "query": "best AI agent frameworks"
}
```

### `POST /api/answer`

Generates an AI answer using Google Gemini 2.0 Flash, streamed via Server-Sent Events (SSE).

**Request body:**
```json
{
  "query": "best AI agent frameworks",
  "results": [{ "title": "...", "url": "...", "text": "..." }]
}
```

**SSE events:**
- `text` — `{ "chunk": "partial text" }` (streamed tokens)
- `textDone` — `{ "fullText": "complete answer", "citations": [1, 3] }`
- `error` — `{ "error": "error message" }`
- `done` — `{}`

<br>

## Tech Stack

- **Search**: [Exa.ai](https://exa.ai) — Web search API for AI applications
- **AI**: [Google Gemini 2.0 Flash](https://ai.google.dev/) — Streaming answer generation
- **Framework**: [Next.js](https://nextjs.org/) 15 with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with CSS custom properties for theming
- **Hosting**: [Vercel](https://vercel.com/)

<br>

## Getting Started

### Prerequisites

- Node.js 18+
- [Exa API key](https://dashboard.exa.ai/api-keys)
- [Gemini API key](https://aistudio.google.com/apikey)

### Installation

1. Clone the repository
```bash
git clone https://github.com/exa-labs/demo-moltbook-search.git
cd demo-moltbook-search
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Then fill in your API keys in `.env.local`:
```env
EXA_API_KEY=your_exa_api_key
GEMINI_API_KEY=your_gemini_api_key
```

4. Run the development server
```bash
npm run dev
```

5. Open http://localhost:3000

<br>

## About [Exa.ai](https://exa.ai)

This project is powered by [Exa.ai](https://exa.ai), a search engine and web search API designed for AI applications.

[Try Exa search](https://exa.ai/search) | [API docs](https://docs.exa.ai)

<br>

---

Built with Exa
