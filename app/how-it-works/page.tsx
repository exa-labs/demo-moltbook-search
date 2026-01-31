import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Zap, Search, Clock, Layers, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works | Search at Tip of the Tongue",
  description:
    "See how Exa's neural search delivers results in milliseconds, powering a real-time voice search experience.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white font-diatype text-exa-black">
      {/* Header */}
      <header className="bg-white pt-8 pb-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Image
                src="/exa_logo.png"
                alt="Exa"
                width={60}
                height={20}
                className="h-5 w-auto"
              />
            </Link>

            <Link href="/">
              <button className="flex cursor-pointer items-center gap-1 rounded-lg border border-exa-gray-400 bg-white px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-[#f9f7f7] hover:border-exa-blue-border active:bg-[#f9f7f7] active:border-exa-gray-300 w-[140px] justify-between">
                <ArrowLeft size={16} className="text-black" />
                <span>Back to Demo</span>
              </button>
            </Link>
          </div>

          <h1 className="font-arizona text-4xl tracking-tight text-black sm:text-5xl">
            How This Demo Works
          </h1>
          <p className="mt-3 text-lg text-black/60 max-w-2xl">
            This demo showcases the speed of{" "}
            <strong className="text-black">Exa search</strong> &mdash; fast
            enough to return results while you&apos;re still talking.
          </p>
        </div>
      </header>

      {/* Hero Speed Callout */}
      <div className="pb-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-xl border border-exa-blue/20 bg-gradient-to-br from-exa-blue/[0.04] to-exa-blue/[0.08] p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-exa-blue/10">
                <Zap size={24} className="text-exa-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-black">
                  Search results before you finish speaking
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-black/60 max-w-2xl">
                  Exa&apos;s neural search API is fast enough to query
                  speculatively &mdash; every 200ms as you speak, the app sends
                  your partial transcript to Exa. By the time you stop talking,
                  results are already on screen. No loading spinners. No waiting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How Speed Is Achieved */}
      <div className="pb-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-black mb-6">
            What makes this possible
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SpeedCard
              icon={Clock}
              title="Speculative Search"
              description="While you're still speaking, Exa searches with your partial transcript. Results stream in live, updating as your query evolves."
              stat="~200ms"
              statLabel="between queries"
            />
            <SpeedCard
              icon={Search}
              title="Two-Pass Search"
              description="Fast pass returns titles instantly for display. Content pass fetches full page text for the LLM — both powered by Exa."
              stat="2 modes"
              statLabel="fast & content"
            />
            <SpeedCard
              icon={Layers}
              title="Single Streaming Request"
              description="Content search, LLM summary, and text-to-speech all run in one server-sent event stream — zero extra round trips."
              stat="1 request"
              statLabel="search → voice"
            />
          </div>
        </div>
      </div>

      {/* Pipeline Breakdown */}
      <div className="pb-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-black mb-6">
            The pipeline
          </h2>

          <div className="rounded-lg border border-black/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-exa-gray-100 border-b border-exa-gray-300">
                  <th className="px-5 py-3 text-left text-xs font-medium text-exa-gray-600 uppercase tracking-wide">Stage</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-exa-gray-600 uppercase tracking-wide">What happens</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-exa-gray-600 uppercase tracking-wide hidden sm:table-cell">Powered by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-exa-gray-200">
                <PipelineRow
                  stage="Speech-to-Text"
                  description="Voice transcribed in real-time; partial transcript sent to search every 200ms"
                  poweredBy="ElevenLabs Scribe"
                  color="bg-blue-500"
                />
                <PipelineRow
                  stage="Fast Search"
                  description="Titles and URLs returned instantly while user is still speaking"
                  poweredBy="Exa /search (fast)"
                  color="bg-cyan-500"
                  highlight
                />
                <PipelineRow
                  stage="Content Search"
                  description="Full page text retrieved for LLM context after recording stops"
                  poweredBy="Exa /search + contents"
                  color="bg-indigo-500"
                  highlight
                />
                <PipelineRow
                  stage="LLM Summary"
                  description="Generates a concise answer with citations from the search results"
                  poweredBy="Gemini"
                  color="bg-amber-500"
                />
                <PipelineRow
                  stage="Text-to-Speech"
                  description="Answer streamed as audio, played back immediately"
                  poweredBy="ElevenLabs"
                  color="bg-emerald-500"
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Example API Requests */}
      <div className="pb-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-black mb-6">
            Example API requests
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Fast Search Example */}
            <div className="rounded-lg border border-black/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-exa-gray-100 border-b border-exa-gray-300">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                <span className="text-xs font-medium text-black">Fast Search</span>
                <span className="ml-auto text-[10px] text-black/40 font-mono">POST /search</span>
              </div>
              <pre className="p-4 text-[13px] leading-relaxed font-mono text-black/70 bg-white overflow-x-auto">
{`{
  "query": "best noise cancelling headphones",
  "type": "fast",
  "numResults": 10
}`}
              </pre>
            </div>

            {/* Content Search Example */}
            <div className="rounded-lg border border-black/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-exa-gray-100 border-b border-exa-gray-300">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-xs font-medium text-black">Content Search</span>
                <span className="ml-auto text-[10px] text-black/40 font-mono">POST /search</span>
              </div>
              <pre className="p-4 text-[13px] leading-relaxed font-mono text-black/70 bg-white overflow-x-auto">
{`{
  "query": "best noise cancelling headphones",
  "type": "fast",
  "numResults": 10,
  "contents": {
    "text": {
      "maxCharacters": 1000
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function SpeedCard({
  icon: Icon,
  title,
  description,
  stat,
  statLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 p-6 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-exa-gray-100">
          <Icon size={16} className="text-exa-gray-700" />
        </div>
        <div className="text-right">
          <span className="block text-lg font-semibold font-mono text-exa-blue leading-none">
            {stat}
          </span>
          <span className="text-[10px] text-black/40 uppercase tracking-wide">
            {statLabel}
          </span>
        </div>
      </div>
      <h4 className="text-base font-medium tracking-tight text-black">
        {title}
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-black/50 flex-1">
        {description}
      </p>
    </div>
  );
}

function PipelineRow({
  stage,
  description,
  poweredBy,
  color,
  highlight = false,
}: {
  stage: string;
  description: string;
  poweredBy: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? "bg-exa-blue/[0.02]" : ""}>
      <td className="px-5 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${color}`} />
          <span className={`text-sm font-medium ${highlight ? "text-exa-blue" : "text-black"}`}>
            {stage}
          </span>
        </div>
      </td>
      <td className="px-5 py-3 text-sm text-black/60">
        {description}
      </td>
      <td className="px-5 py-3 hidden sm:table-cell">
        <span className="text-xs font-mono text-black/40">{poweredBy}</span>
      </td>
    </tr>
  );
}
