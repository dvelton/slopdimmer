import { scoreSentences } from '../src/scorer.js';

function fakeEmb(seed) {
  const e = new Array(384);
  for (let i = 0; i < 384; i++) e[i] = Math.sin(seed * i * 0.01);
  const mag = Math.sqrt(e.reduce((a, b) => a + b * b, 0));
  return e.map(v => v / mag);
}

function classify(score) {
  return score >= 0.65 ? 'high' : score >= 0.45 ? 'mid' : 'low';
}

function scoreGroup(name, sentences) {
  const embs = sentences.map((_, i) => fakeEmb(i * 7 + 1));
  const scores = scoreSentences(sentences, embs, [fakeEmb(999)], fakeEmb(500));

  console.log(`\n## ${name}`);
  sentences.forEach((sentence, i) => {
    console.log(`${scores[i].toFixed(3)} ${classify(scores[i]).padEnd(4)} | ${sentence}`);
  });
}

const scenarios = {
  'False negatives to catch': [
    "I want to make sure we're all on the same page here",
    "Just to circle back on this",
    "Per our earlier conversation",
    "Thanks for flagging this",
    "Wanted to loop you in on this",
    "Hope this helps!",
    "Happy to discuss further",
    "Please don't hesitate to reach out",
    "Great catch!",
    "LGTM, just a few minor suggestions",
    "Really appreciate the thorough review",
    "I completely agree with your assessment here",
    "As an AI language model, I can help explain this",
    "I've taken the liberty of reviewing the attached proposal",
    "Acknowledged, thanks for bringing this up",
  ],
  'False positives to avoid': [
    "Should update the timeout to 30s because the downstream call takes 24s.",
    "Consider retrying only on 502 and 503, not on 400.",
    "Meeting moved to 3:30pm PT with Sarah and Miguel.",
    "Fixed: remove deprecated auth middleware.",
    "TypeError: Cannot read properties of undefined (reading 'id')",
    "Note: refresh tokens issued before March 1 remain valid until rotation completes.",
    "Important: delete customer backups within 30 days under the DPA.",
    "Can you repro this on Firefox?",
  ],
  'Calibration probes': [
    "It's worth noting that the p99 latency spiked to 2.3s after commit abc123f.",
    "Importantly, the CVE-2024-5678 patch must ship before the March 15 deadline.",
    "Notably, the EU AI Act Article 52 requires disclosure of AI-generated content.",
    "As you may know, Python 3.12 removed the deprecated distutils module entirely.",
    "Overall quality score dropped from 4.8 to 3.2 after the v5 release.",
    "Run the pre-flight script to ensure a seamless cutover at 2am PST on Saturday.",
  ],
};

for (const [name, sentences] of Object.entries(scenarios)) {
  scoreGroup(name, sentences);
}
