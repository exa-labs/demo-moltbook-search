export interface QueryConfig {
  query: string;
  category?: "company" | "news" | "research" | "tweet" | "github" | "general";
  useAutoprompt?: boolean;
  startPublishedDate?: string;
  endPublishedDate?: string;
  needsLiveCrawl?: boolean;
}

export function analyzeAndOptimizeQuery(rawQuery: string): QueryConfig {
  const q = rawQuery.toLowerCase().trim();
  const config: QueryConfig = { query: rawQuery };

  // NEWS / RECENT: Queries about current events, latest, recent
  const newsPatterns = [
    /\b(latest|recent|news|today|this week|yesterday|breaking|update|announcement)\b/,
    /\bwhat('s| is) (happening|new|going on)\b/,
    /\b(2024|2025|2026)\b/,
  ];
  if (newsPatterns.some(p => p.test(q))) {
    config.category = "news";
    if (/\b(latest|today|this week|breaking)\b/.test(q)) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      config.startPublishedDate = weekAgo.toISOString().split("T")[0];
    } else if (/\b(recent|news)\b/.test(q)) {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      config.startPublishedDate = monthAgo.toISOString().split("T")[0];
    }
  }

  // COMPANY
  const companyPatterns = [
    /\b(company|companies|startup|startups|business|businesses|firm|firms)\b/,
    /\b(founded|funding|raised|valuation|ipo|acquisition)\b/,
    /\bwho (is|are) (building|making|creating|working on)\b/,
  ];
  if (companyPatterns.some(p => p.test(q))) {
    config.category = "company";
    config.useAutoprompt = true;
  }

  // RESEARCH / ACADEMIC
  const researchPatterns = [
    /\b(research|paper|study|academic|scientific|journal|arxiv)\b/,
    /\b(how does|how do|explain|what is the)\b.*\b(work|algorithm|method|technique)\b/,
  ];
  if (researchPatterns.some(p => p.test(q))) {
    config.category = "research";
    config.useAutoprompt = true;
  }

  // GITHUB
  const githubPatterns = [
    /\b(github|repo|repository|open source|code|library|framework|package)\b/,
    /\b(implementation|example|tutorial|sample)\b/,
  ];
  if (githubPatterns.some(p => p.test(q))) {
    config.category = "github";
  }

  // TWITTER/X
  const tweetPatterns = [
    /\b(twitter|tweet|x\.com|people (saying|think|talking))\b/,
    /\bwhat (do|are) people\b/,
  ];
  if (tweetPatterns.some(p => p.test(q))) {
    config.category = "tweet";
  }

  // CONCEPTUAL / DEFINITION queries
  const conceptualPatterns = [
    /\bwhat('s| is) (the |that |a )?(term|word|name|phrase|concept|effect|fallacy|bias|principle|law)\b/i,
    /\bwhat('s| is) it called\b/i,
    /\bthere's a (quote|saying|term|word|concept|principle)\b/i,
    /\b(can't|cannot) remember (the |that )?(name|word|term|phrase)\b/i,
    /\b(difference between|compare|explain|how does|why does)\b/i,
    /\bfind (a |an )?(good |best )?(explanation|source|definition)\b/i,
    /\b(alternatives to|similar to|like .+ but)\b/i,
  ];
  if (conceptualPatterns.some(p => p.test(q))) {
    config.useAutoprompt = true;
  }

  // TIME-SENSITIVE / LIVE DATA
  const liveCrawlPatterns = [
    /\b(weather|temperature|forecast|rain|sunny|cloudy|humidity|wind)\b/,
    /\b(stock|stocks|price|prices|market|nasdaq|dow|s&p|crypto|bitcoin|btc|eth|trading)\b/,
    /\b(score|scores|game|match|playing|live|vs|versus)\b.*\b(today|tonight|now|current)\b/,
    /\b(nba|nfl|mlb|nhl|fifa|premier league|world cup)\b.*\b(score|game|today)\b/,
    /\b(traffic|commute|transit|delay|delays|road conditions)\b/,
    /\b(flight|flights)\b.*\b(status|delayed|on time|arriving|departing)\b/,
    /\b(right now|currently|at the moment|as of now|live)\b/,
    /\b(election|vote|votes|voting|results|polls)\b.*\b(today|live|current|count)\b/,
  ];
  if (liveCrawlPatterns.some(p => p.test(q))) {
    config.needsLiveCrawl = true;
  }

  // Clean up filler words and speech disfluencies
  let cleanedQuery = rawQuery
    .replace(/^(hey|hi|hello|ok|okay|um|uh|so|well|please|can you|could you|I want to|I'd like to|help me|find me|show me|tell me about|what about|how about)\s*/gi, "")
    .replace(/\s*(please|thanks|thank you)\.?$/gi, "")
    .replace(/\b(um|uh|er|ah|like|you know|I mean|sort of|kind of)\b/gi, "")
    .replace(/—(wait|actually|sorry|no|never mind)—?/gi, " ")
    .replace(/\b(wait|actually|sorry|never mind),?\s*/gi, " ")
    .replace(/\.\.\./g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Handle negation patterns
  const negationPatterns = [
    /not (?:the |a )?['"]?[\w\s]+['"]?[—\-,]\s*(the one (?:where|that|when).+)/i,
    /not (?:the |a )?['"]?[\w\s]+['"]?[—\-,]\s*((?:where|when|that) .+)/i,
  ];
  for (const pattern of negationPatterns) {
    const match = cleanedQuery.match(pattern);
    if (match) {
      cleanedQuery = match[1];
      break;
    }
  }

  config.query = cleanedQuery;

  if (config.query.length < 3) {
    config.query = rawQuery.trim();
  }

  return config;
}
