// Scoring pipeline: combines pattern-based filler detection with embedding analysis.

import { FILLER_PHRASES } from "./filler.js";

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
}

// Direct pattern matching against known filler phrases.
// This is the primary scoring signal — more reliable than embeddings for this task.
const FILLER_PATTERNS = [
  // Preamble / throat-clearing
  /^i('ve| have) been (delving|looking|thinking|diving|exploring)/i,
  /wanted to bring to your attention/i,
  /warrants? (immediate |your )?consideration/i,
  /after (extensive|thorough|careful|deep) (testing|analysis|review|investigation)/i,
  /i('ve| have) identified what appears/i,
  /i wanted to take a moment/i,
  /i think it's important that we/i,

  // Empty hedging
  /^it('s| is) worth noting/i,
  /^it bears mentioning/i,
  /^importantly,/i,
  /^interestingly,/i,
  /^notably,/i,
  /^as you (may |might )?know/i,

  // Stakes inflation
  /implications.*(quite |very )?profound/i,
  /fundamentally reshape/i,
  /paradigm shift/i,
  /cannot be overstated/i,
  /critical (foundation|issue|importance)/i,

  // Vacuous conclusions
  /i believe (that )?by implementing these/i,
  /significantly enhance/i,
  /provide a more robust experience/i,
  /for our users going forward/i,
  /^in conclusion/i,
  /^to sum up/i,
  /^in summary/i,
  /^moving forward/i,
  /going forward\.?\s*$/i,
  /robust.*experience/i,
  /more robust developer/i,

  // Filler transitions
  /^with that being said/i,
  /^that said,/i,
  /^having said that/i,
  /^in light of the above/i,
  /^given the above/i,

  // Performative flattery / engagement
  /that's a great (question|point|observation)/i,
  /i appreciate you taking the time/i,
  /thank you for (raising|bringing|highlighting)/i,

  // Generic scope inflation
  /the broader (context|implications|picture|landscape)/i,
  /aligns? with (industry )?(best practices|standards)/i,
  /comprehensive approach/i,
  /robust token management/i,
  /maintaining the integrity of/i,
  /not just a technical issue/i,
  /speaks to a (deeper|larger|broader)/i,
  /with the utmost urgency/i,

  // "Let me explain" patterns
  /^let('s| us) (break this|unpack|dive|explore)/i,
  /^here's (the thing|what|where|the kicker)/i,

  // Rhetorical questions answered immediately
  /^the (real )?question is/i,
  /^so what does this mean/i,
  /^why does this matter/i,

  // "Here's what I think we should consider"
  /here's what i think we should/i,
  /potential next steps for/i,
  /what i('d| would) (like to |want to )?(suggest|recommend|propose)/i,

  // Despite challenges
  /despite these (challenges|concerns|limitations)/i,
  /notwithstanding these/i,

  // Vague attribution
  /^(experts|research|studies) (agree|show|suggest|indicate)/i,
  /industry (best practices|reports|analysts)/i,

  // Empty restatement
  /^in other words/i,
  /^put simply/i,
  /^simply put/i,
  /^essentially,/i,
  /^what this means is/i,

  // Ever-evolving landscape
  /ever-evolving (landscape|world|environment)/i,
  /in today's (rapidly changing |modern )?(environment|world|landscape)/i,

  // Leverage / ensure / seamless family
  /leverage (best practices|our|the)/i,
  /ensure a seamless/i,
  /seamless experience/i,
  /more maintainable going forward/i,
  /overall (quality|performance|reliability)/i,

  // "Let me" pedagogical patterns
  /let me break this down/i,
  /so we can all understand/i,
  /the full picture/i,

  // Generic project filler
  /great (progress|work|job|effort)/i,
  /continue along these lines/i,
  /put into making/i,
  /effort you've put/i,
  /well-thought-out/i,
  /looks solid/i,

  // "This is important" without saying why
  /^this is (really )?(important|critical|crucial)\.?$/i,
];

// Count how many filler patterns match in a sentence
function fillerPatternScore(sentence) {
  let matches = 0;
  for (const pattern of FILLER_PATTERNS) {
    if (pattern.test(sentence)) matches++;
  }
  return matches;
}

// Specificity heuristic: concrete details = higher score
function specificityScore(sentence) {
  let score = 0;
  const s = sentence.trim();

  // Contains numbers (dates, counts, measurements, error codes, metrics)
  if (/\d{2,}/.test(s)) score += 0.2;

  // Contains measurements with units (12ms, 340ms, 50K, 3.2GB, etc.)
  if (/\d+\s*(ms|s|MB|GB|KB|TB|req|rps|qps|fps|px|%)\b/i.test(s)) score += 0.15;

  // Contains file paths or code references
  if (/[\/\\][\w.-]+\.\w+/.test(s) || /`[^`]+`/.test(s)) score += 0.3;

  // Contains URLs or API endpoints
  if (/https?:\/\/\S+/.test(s) || /\/(api|auth|v\d|src|lib|bin)\//i.test(s)) score += 0.3;

  // Contains code-like tokens (function calls, variables with underscores/camelCase)
  if (/\w+\([\w,\s]*\)/.test(s) || /\w+_\w+/.test(s)) score += 0.25;

  // Contains ALL_CAPS identifiers (env vars, constants)
  if (/\b[A-Z][A-Z_]{2,}\b/.test(s)) score += 0.2;

  // Contains specific technical terms
  if (/\b(null|undefined|NaN|segfault|mutex|race condition|deadlock|memory leak|stack overflow)\b/i.test(s)) score += 0.2;
  if (/\b(404|500|401|403|200|301|302|TypeError|Error|Exception|bug|crash|CVE|RFC)\b/i.test(s)) score += 0.2;
  if (/\b(JWT|OAuth|SSL|TLS|DNS|HTTP|HTTPS|API|REST|GraphQL|SQL|NoSQL)\b/.test(s)) score += 0.15;
  if (/\b(curl|git|npm|pip|docker|kubectl|terraform|ansible)\b/i.test(s)) score += 0.2;
  if (/\b(token|endpoint|middleware|pipeline|migration|deploy|commit|merge|rebase)\b/i.test(s)) score += 0.1;

  // Contains version numbers (v3.2.0, Python 3.12, etc.)
  if (/v?\d+\.\d+(\.\d+)?/.test(s)) score += 0.15;

  // Contains quoted strings or command-line syntax
  if (/"[^"]{3,}"/.test(s) || /'[^']{3,}'/.test(s)) score += 0.2;
  if (/\$\{/.test(s) || /^(curl|git|npm|pip|docker)\s/i.test(s)) score += 0.3;

  // Contains specific identifiers (camelCase, snake_case, kebab-case)
  if (/[a-z][A-Z]/.test(s) && /[a-z]{2,}[A-Z]/.test(s)) score += 0.15;

  // Contains issue/PR references (#1234)
  if (/#\d{2,}/.test(s)) score += 0.2;

  // Contains commit hashes
  if (/\b[a-f0-9]{7,40}\b/.test(s)) score += 0.2;

  // Contains p50/p95/p99 latency references
  if (/p\d{2}\b/i.test(s)) score += 0.15;

  // Contains date/time references
  if (/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d/i.test(s)) score += 0.1;
  if (/\d{1,2}(am|pm)\s*(PST|EST|UTC|PT|ET|CT)/i.test(s)) score += 0.15;

  // Contains specific room/location references
  if (/\b(Room|Building|Floor)\s+\w/i.test(s)) score += 0.1;

  // Short and punchy with content = very likely signal
  const words = s.split(/\s+/).length;
  if (words < 12 && score > 0) score += 0.15;

  // Very long sentences with no concrete markers = likely filler
  if (words > 25 && score === 0) score -= 0.15;

  return Math.max(0, Math.min(1, score));
}

// Check if sentence is a direct question (usually signal)
function isDirectQuestion(sentence) {
  return /\?\s*$/.test(sentence.trim()) && sentence.trim().split(/\s+/).length < 25;
}

// Check if sentence starts a numbered/bulleted list item (usually signal)
function isListItem(sentence) {
  return /^\d+[\.\)]\s/.test(sentence.trim()) || /^[-*]\s/.test(sentence.trim());
}

export function scoreSentences(sentences, sentenceEmbeddings, fillerEmbeddings, titleEmbedding) {
  const scores = [];
  const n = sentences.length;

  for (let i = 0; i < n; i++) {
    const emb = sentenceEmbeddings[i];
    const sentence = sentences[i];

    // 1. Pattern-based filler detection (primary signal, very reliable)
    const patternMatches = fillerPatternScore(sentence);
    const patternPenalty = Math.min(1, patternMatches * 0.4);

    // 2. Embedding-based filler similarity (secondary signal)
    let maxFillerSim = 0;
    if (fillerEmbeddings.length > 0) {
      for (const fillerEmb of fillerEmbeddings) {
        const sim = cosineSimilarity(emb, fillerEmb);
        if (sim > maxFillerSim) maxFillerSim = sim;
      }
    }
    // Only penalize at high similarity thresholds
    const embeddingPenalty = Math.max(0, (maxFillerSim - 0.55) / 0.4) * 0.3;

    // 3. Redundancy: similarity to neighboring sentences
    let redundancy = 0;
    let neighborCount = 0;
    for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) {
      if (j === i) continue;
      redundancy += cosineSimilarity(emb, sentenceEmbeddings[j]);
      neighborCount++;
    }
    redundancy = neighborCount > 0 ? redundancy / neighborCount : 0;
    const redundancyPenalty = Math.max(0, (redundancy - 0.65) / 0.35) * 0.3;

    // 4. Specificity boost from concrete details
    const specificity = specificityScore(sentence);

    // 5. Structural bonuses
    let structuralBonus = 0;
    if (isDirectQuestion(sentence)) structuralBonus += 0.5;
    if (isListItem(sentence)) structuralBonus += 0.3;

    // Combine: start at 0.5 (neutral), add/subtract.
    // When filler patterns are detected, reduce the specificity boost — 
    // a sentence like "I believe the API architecture should be enhanced" 
    // has technical words but is still filler.
    const dampedSpecificity = patternMatches > 0 
      ? specificity * 0.3  // filler structure dampens technical word bonus
      : specificity;

    let score = 0.5
      - patternPenalty        // filler patterns: strong penalty
      - embeddingPenalty      // embedding similarity: mild penalty
      - redundancyPenalty     // redundancy: mild penalty
      + dampedSpecificity     // concrete details: boosted, but dampened if filler
      + structuralBonus;      // questions, list items: boost

    score = Math.max(0, Math.min(1, score));
    scores.push(score);
  }

  // Map raw scores to opacity values.
  // Use absolute thresholds, NOT relative normalization.
  // This prevents all-filler pages from having some filler appear bright.
  //
  // Raw score mapping:
  //   0.0 - 0.2  → 0.25 opacity (very dim)
  //   0.2 - 0.4  → 0.25-0.45 (dim)
  //   0.4 - 0.6  → 0.45-0.70 (mid)
  //   0.6 - 0.8  → 0.70-0.90 (bright)
  //   0.8 - 1.0  → 0.90-1.00 (full brightness)
  //
  // Then apply mild contrast stretching within the actual range to improve 
  // visual differentiation, but cap it so filler never looks bright.

  return scores.map(rawScore => {
    // Base opacity from absolute score
    let opacity;
    if (rawScore <= 0.2) {
      opacity = 0.25;
    } else if (rawScore <= 0.4) {
      opacity = 0.25 + (rawScore - 0.2) / 0.2 * 0.20;  // 0.25-0.45
    } else if (rawScore <= 0.6) {
      opacity = 0.45 + (rawScore - 0.4) / 0.2 * 0.25;  // 0.45-0.70
    } else if (rawScore <= 0.8) {
      opacity = 0.70 + (rawScore - 0.6) / 0.2 * 0.20;  // 0.70-0.90
    } else {
      opacity = 0.90 + (rawScore - 0.8) / 0.2 * 0.10;  // 0.90-1.00
    }
    return opacity;
  });
}
