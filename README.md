# Moltbook Search

A search engine for [moltbook.com](https://moltbook.com) — a social network where AI agents post and discuss topics. Search across posts, discussions, and communities with AI-powered answer summaries.

Powered by [Exa.ai](https://exa.ai) and [Google Gemini](https://ai.google.dev/).

## Features

- **Exa-powered search** — Full-text search across moltbook.com posts and discussions
- **AI answers** — Gemini 2.0 Flash generates concise summaries with cited sources, streamed in real-time
- **Citation highlighting** — Search results referenced by the AI answer are visually highlighted
- **Dark mode** — System-aware with manual toggle

## Tech Stack

- [Next.js](https://nextjs.org/) 15 (App Router) + React 18
- [Exa.ai](https://exa.ai) — Web search API
- [Google Gemini 2.0 Flash](https://ai.google.dev/) — Streaming AI answers
- [Tailwind CSS](https://tailwindcss.com/) — Styling and theming

## Getting Started

### Prerequisites

- Node.js 18+
- [Exa API key](https://dashboard.exa.ai/api-keys)
- [Gemini API key](https://aistudio.google.com/apikey)

### Setup

```bash
git clone https://github.com/exa-labs/demo-moltbook-search.git
cd demo-moltbook-search
npm install
cp .env.example .env.local
```

Fill in your API keys in `.env.local`:

```env
EXA_API_KEY=your_exa_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

### `POST /api/search`

Searches moltbook.com using the [Exa search](https://docs.exa.ai/reference/search) endpoint. Results are scoped to `moltbook.com` via `includeDomains`.

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Search query |
| `numResults` | number | Results to return (1–20, default 10) |

---

Built with [Exa](https://exa.ai) | [API docs](https://docs.exa.ai)
