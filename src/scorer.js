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
  /significantly enhance the security posture/i,
  /provide a more robust experience/i,
  /for our users going forward/i,
  /^in conclusion/i,
  /^to sum up/i,
  /^in summary/i,
  /^moving forward/i,

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

  // Contains numbers
  if (/\d{2,}/.test(s)) score += 0.2;

  // Contains file paths or code references
  if (/[\/\\][\w.-]+\.\w+/.test(s) || /`[^`]+`/.test(s)) score += 0.3;

  // Contains URLs or API endpoints
  if (/https?:\/\/\S+/.test(s) || /\/(api|auth|v\d)\//i.test(s)) score += 0.3;

  // Contains code-like tokens
  if (/\w+\([\w,\s]*\)/.test(s) || /\w+_\w+/.test(s)) score += 0.25;

  // Contains specific technical terms
  if (/\b(null|undefined|NaN|404|500|401|403|200|TypeError|Error|Exception|bug|crash|CVE|JWT|token|endpoint|curl|POST|GET|PUT|DELETE)\b/i.test(s)) score += 0.2;

  // Contains quoted strings or command-line syntax
  if (/"[^"]{3,}"/.test(s) || /\$\{/.test(s) || /^(curl|git|npm|pip|docker)\s/i.test(s)) score += 0.3;

  // Contains specific identifiers (camelCase, snake_case)
  if (/[a-z][A-Z]/.test(s) && /[a-z]{2,}[A-Z]/.test(s)) score += 0.15;

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
    if (isDirectQuestion(sentence)) structuralBonus += 0.3;
    if (isListItem(sentence)) structuralBonus += 0.2;

    // Combine: start at 0.5 (neutral), add/subtract
    let score = 0.5
      - patternPenalty        // filler patterns: strong penalty
      - embeddingPenalty      // embedding similarity: mild penalty
      - redundancyPenalty     // redundancy: mild penalty
      + specificity           // concrete details: strong boost
      + structuralBonus;      // questions, list items: boost

    score = Math.max(0, Math.min(1, score));
    scores.push(score);
  }

  // Normalize to use full visual range
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;

  if (range < 0.05) {
    return scores.map(() => 1.0);
  }

  return scores.map(s => {
    const normalized = (s - min) / range;
    // Map to 0.25-1.0: dimmed but readable at the bottom, full opacity at top
    return 0.25 + normalized * 0.75;
  });
}
