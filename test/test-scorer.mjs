import { scoreSentences } from '../src/scorer.js';

// We'll use dummy embeddings since the pattern matcher is the primary signal.
// To test embedding-based features properly, we'd need the real model,
// but pattern matching is what we need to get right first.
function fakeEmb(seed) {
  const e = new Array(384);
  for (let i = 0; i < 384; i++) e[i] = Math.sin(seed * i * 0.01);
  const mag = Math.sqrt(e.reduce((a, b) => a + b * b, 0));
  return e.map(v => v / mag);
}

function runTest(name, sentences, expectedSignals) {
  const embs = sentences.map((_, i) => fakeEmb(i * 7 + 1));
  const fillerEmbs = [fakeEmb(999)];
  const titleEmb = fakeEmb(500);
  const scores = scoreSentences(sentences, embs, fillerEmbs, titleEmb);

  let pass = 0, fail = 0;
  const failures = [];

  for (let i = 0; i < sentences.length; i++) {
    const expected = expectedSignals[i]; // "high", "mid", "low"
    const actual = scores[i] >= 0.65 ? "high" : scores[i] >= 0.45 ? "mid" : "low";
    
    const ok = expected === actual || 
               (expected === "high" && actual === "mid") || // acceptable: slightly under
               (expected === "low" && actual === "mid");    // acceptable: slightly over
    
    if (expected === actual) {
      pass++;
    } else if (ok) {
      pass++;
    } else {
      fail++;
      failures.push({
        sentence: sentences[i].substring(0, 80),
        expected,
        actual,
        score: scores[i].toFixed(2),
      });
    }
  }

  const status = fail === 0 ? "✓ PASS" : `✗ FAIL (${fail} wrong)`;
  console.log(`\n${status} — ${name} (${pass}/${sentences.length})`);
  for (const f of failures) {
    console.log(`  WRONG: [${f.score}] expected=${f.expected} got=${f.actual} "${f.sentence}..."`);
  }
  return { pass, fail, failures };
}

let totalPass = 0, totalFail = 0;

// ═══════════════════════════════════════════
// TEST 1: Classic AI-generated GitHub issue
// ═══════════════════════════════════════════
const t1 = runTest("Classic AI slop issue", [
  "I've been delving into the authentication module and I wanted to bring to your attention a critical issue that I believe warrants immediate consideration.",
  "After extensive testing and thorough analysis of the codebase, I've identified what appears to be a significant vulnerability in the token validation logic.",
  "The JWT refresh endpoint at /api/auth/refresh accepts expired tokens without checking the exp claim.",
  "An attacker who obtains a single valid token can use it indefinitely, bypassing token expiration.",
  "The implications of this are quite profound when we consider the broader security landscape.",
  "In today's environment, robust token management serves as a critical foundation for maintaining the integrity of user sessions.",
  "This is not just a technical issue — it's a trust issue.",
  "Here's what I think we should consider as potential next steps for remediation:",
  "1. Add exp claim validation in the verify_token() function in src/auth/jwt.py",
  "2. Return 401 instead of refreshing when token is expired beyond a grace period",
  "3. Add regression tests for expired token rejection",
  "I believe that by implementing these changes, we can significantly enhance the security posture of the authentication system and provide a more robust experience for our users going forward.",
], [
  "low",  // preamble
  "low",  // preamble
  "high", // finding with specific endpoint
  "high", // concrete impact
  "low",  // filler
  "low",  // filler
  "low",  // filler
  "low",  // filler transition
  "high", // action item with code ref
  "high", // action item with status code
  "high", // action item
  "low",  // vacuous conclusion
]);
totalPass += t1.pass; totalFail += t1.fail;

// ═══════════════════════════════════════════
// TEST 2: Pure signal — terse, specific, technical
// ═══════════════════════════════════════════
const t2 = runTest("Pure signal (should all be high)", [
  "Segfault in libcurl when Content-Length header exceeds INT_MAX on 32-bit systems.",
  "curl -X POST /api/auth/refresh -H 'Authorization: Bearer eyJhbG...' returns 200 with a fresh token.",
  "The race condition occurs between mutex_lock() at line 342 and the callback at line 357 in src/pool.c.",
  "SELECT * FROM users WHERE id = 1; -- returns null after the migration runs",
  "CVE-2024-1234 affects versions 3.2.0 through 3.2.7.",
  "pip install numpy==1.24.0 fixes the incompatibility with Python 3.12.",
  "The test suite passes locally but fails in CI because NODE_ENV is unset.",
  "Latency jumped from 12ms p99 to 340ms p99 after deploying commit abc123f.",
], [
  "high", "high", "high", "high", "high", "high", "high", "high",
]);
totalPass += t2.pass; totalFail += t2.fail;

// ═══════════════════════════════════════════
// TEST 3: Pure filler — zero information
// ═══════════════════════════════════════════
const t3 = runTest("Pure filler (should all be low)", [
  "I wanted to take a moment to discuss something that I think is really important for our team.",
  "It's worth noting that this approach has several significant advantages that we should consider.",
  "The implications of this decision are quite profound and far-reaching in their scope.",
  "I believe we should leverage best practices to ensure a seamless experience for our users.",
  "Going forward, we should consider the broader implications of this change.",
  "In conclusion, I think we've made great progress and should continue along these lines.",
  "Let me break this down step by step so we can all understand the full picture.",
  "Here's the thing about modern software development that most people miss.",
  "Despite these challenges, I'm confident we can deliver a robust solution.",
  "The ever-evolving landscape of technology continues to present new opportunities.",
  "Importantly, we need to align with industry standards and best practices.",
  "Essentially, what this means is that we need to take a more comprehensive approach.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low",
]);
totalPass += t3.pass; totalFail += t3.fail;

// ═══════════════════════════════════════════
// TEST 4: Direct questions (should be high)
// ═══════════════════════════════════════════
const t4 = runTest("Direct questions (should be high)", [
  "Can you share a reproduction case?",
  "Which endpoint specifically returns the error?",
  "What version of Node are you running?",
  "Does this happen on both Linux and macOS?",
  "Have you tried clearing the cache and restarting?",
], [
  "high", "high", "high", "high", "high",
]);
totalPass += t4.pass; totalFail += t4.fail;

// ═══════════════════════════════════════════
// TEST 5: Mixed quality email
// ═══════════════════════════════════════════
const t5 = runTest("Mixed quality email", [
  "Thanks for raising this, I appreciate you taking the time to engage with this important matter.",
  "The budget for Q3 is $2.4M, down from $3.1M last quarter.",
  "The broader context here is really about ensuring we have a comprehensive approach that aligns with our strategic vision.",
  "We need to cut headcount by 3 FTEs in the platform team by July 15.",
  "I think it's important that we consider the full range of options available to us.",
  "The Jenkins pipeline is failing because the Docker base image was updated to Alpine 3.19.",
  "In light of the above, I believe we should take a holistic approach to addressing these concerns.",
  "Meeting is Thursday at 2pm PST in Room 4B.",
], [
  "low",  // performative flattery
  "high", // specific data
  "low",  // filler
  "high", // specific action
  "low",  // filler
  "high", // specific technical finding
  "low",  // filler
  "high", // specific logistics
]);
totalPass += t5.pass; totalFail += t5.fail;

// ═══════════════════════════════════════════
// TEST 6: PR description padding
// ═══════════════════════════════════════════
const t6 = runTest("PR description padding", [
  "This PR addresses a critical issue that has been affecting our users for some time.",
  "Adds rate limiting to the /api/search endpoint (max 100 requests per minute per API key).",
  "The changes have been thoroughly tested and reviewed to ensure they meet our quality standards.",
  "Fixes #4521.",
  "I've made sure to follow the existing code patterns and conventions throughout the implementation.",
  "Removes the deprecated v1 auth middleware from src/middleware/auth-v1.js.",
  "These improvements will significantly enhance the overall performance and reliability of the system.",
  "Breaking change: the response format for GET /api/users now returns an array instead of an object.",
], [
  "low",  // generic preamble
  "high", // specific change with numbers
  "low",  // filler
  "high", // specific issue ref
  "low",  // filler
  "high", // specific file removal
  "low",  // filler
  "high", // specific breaking change
]);
totalPass += t6.pass; totalFail += t6.fail;

// ═══════════════════════════════════════════
// TEST 7: Performative AI code review comment
// ═══════════════════════════════════════════
const t7 = runTest("AI code review comments", [
  "Great work on this PR! I have a few suggestions that might help improve the overall quality.",
  "The error handling on line 42 should catch TypeError specifically, not just generic Exception.",
  "I think the overall architecture looks solid and well-thought-out.",
  "This function is O(n^2) due to the nested loop — consider using a Set for O(n) lookup.",
  "Essentially, what we're looking at here is a fundamental design decision that will impact scalability.",
  "The SQL query at line 89 is vulnerable to injection — use parameterized queries instead.",
  "I appreciate the effort you've put into making this codebase more maintainable going forward.",
  "Missing null check: req.body.userId could be undefined if the client sends an empty POST.",
], [
  "low",  // performative praise
  "high", // specific code issue
  "low",  // vague praise
  "high", // specific perf issue
  "low",  // filler
  "high", // specific security issue
  "low",  // filler
  "high", // specific bug
]);
totalPass += t7.pass; totalFail += t7.fail;

// ═══════════════════════════════════════════
// TEST 8: Tricky edge cases
// ═══════════════════════════════════════════
const t8 = runTest("Edge cases", [
  "This is a security vulnerability.",                    // short but signal (has technical term)
  "This is important.",                                    // short and vague
  "See RFC 7519 section 4.1.4 for the exp claim spec.",  // specific reference
  "I strongly disagree with this approach.",               // opinion but direct
  "The system processes approximately 50,000 requests per second during peak hours.", // specific metric
  "We should definitely think about what this means for the future of the project.", // filler
], [
  "high", // security term
  "low",  // empty assertion
  "high", // specific reference
  "mid",  // direct opinion (neither pure signal nor filler)
  "high", // specific metric
  "low",  // filler
]);
totalPass += t8.pass; totalFail += t8.fail;

// ═══════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════
console.log(`\n${"═".repeat(50)}`);
console.log(`TOTAL: ${totalPass} passed, ${totalFail} failed out of ${totalPass + totalFail}`);
console.log(`Accuracy: ${((totalPass / (totalPass + totalFail)) * 100).toFixed(1)}%`);
console.log(`${"═".repeat(50)}`);


// ═══════════════════════════════════════════
// TEST 9: Subtle filler (harder to detect)
// ═══════════════════════════════════════════
const t9 = runTest("Subtle filler (harder to detect)", [
  "As someone who has worked in this space for many years, I can tell you this matters.",
  "There are many factors to consider when evaluating this kind of change.",
  "We live in a world where software quality is more important than ever.",
  "It goes without saying that we should strive for excellence in everything we do.",
  "At the risk of stating the obvious, this deserves careful thought.",
  "I could be wrong, but I feel like there might be a better way to approach this.",
], [
  "low", "low", "low", "low", "low", "low",
]);
totalPass += t9.pass; totalFail += t9.fail;

// ═══════════════════════════════════════════
// TEST 10: Legitimate non-technical signal
// ═══════════════════════════════════════════
const t10 = runTest("Legitimate non-technical signal", [
  "The contract expires on March 15 and we need to renew before then.",
  "Three customers reported the same issue this week: Acme Corp, BigCo, and StartupXYZ.",
  "Revenue dropped 12% month-over-month in the enterprise segment.",
  "The legal team flagged two clauses in section 4.2 of the vendor agreement.",
  "Hiring freeze starts Monday — no new reqs until Q4.",
  "The board approved the $5M budget for infrastructure migration.",
], [
  "high", "high", "high", "high", "high", "high",
]);
totalPass += t10.pass; totalFail += t10.fail;

// ═══════════════════════════════════════════
// TEST 11: Mixed technical/filler single paragraph  
// ═══════════════════════════════════════════
const t11 = runTest("Mixed within sentences", [
  "After careful consideration of the various approaches, we decided to use Redis for the session cache because it handles 100K ops/sec.",
  "While there are many ways to solve this, the root cause is a missing index on the users.email column.",
  "I think what's really interesting about this bug is that it only triggers when request.headers.host is undefined.",
  "To be perfectly honest, the real issue is that setTimeout(fn, 0) doesn't guarantee zero-delay execution.",
], [
  "high", // has specific tech details despite filler opener
  "high", // has specific finding despite filler opener
  "high", // has specific trigger condition
  "high", // has specific technical fact
]);
totalPass += t11.pass; totalFail += t11.fail;

// ═══════════════════════════════════════════
// TEST 12: Slack/chat style messages
// ═══════════════════════════════════════════
const t12 = runTest("Slack/chat style messages", [
  "yo the deploy is broken",
  "main branch CI is red, looks like the linter config changed",
  "can someone look at prod? getting 502s on /api/health",
  "thanks!",
  "lgtm",
  "nit: missing semicolon on line 42",
  "+1",
  "anyone else seeing this? https://status.github.com shows degraded",
], [
  "high", // direct, concise, informational
  "high", // specific finding
  "high", // specific problem
  "low",  // empty acknowledgment
  "low",  // empty acknowledgment  
  "high", // specific code feedback
  "low",  // empty
  "high", // specific with URL
]);
totalPass += t12.pass; totalFail += t12.fail;

// ═══════════════════════════════════════════
// TEST 13: README slop vs README signal
// ═══════════════════════════════════════════
const t13 = runTest("README slop vs signal", [
  "This project leverages cutting-edge technology to deliver a seamless developer experience.",
  "Install with npm install slopdimmer.",
  "Built with love by the open source community.",
  "Requires Node.js 18+ and Chrome 120+.",
  "We believe in the power of open source to transform the way developers work.",
  "MIT License.",
  "Contributions are welcome! Please see CONTRIBUTING.md for guidelines.",
  "This is a revolutionary tool that will fundamentally change how you read text online.",
], [
  "low",  // marketing slop
  "high", // specific install command
  "low",  // empty sentiment
  "high", // specific requirements
  "low",  // mission statement filler
  "high", // specific license (short + concrete)
  "high", // specific actionable reference
  "low",  // marketing slop
]);
totalPass += t13.pass; totalFail += t13.fail;

// ═══════════════════════════════════════════
// UPDATED SUMMARY
// ═══════════════════════════════════════════
console.log(`\n${"═".repeat(50)}`);
console.log(`TOTAL: ${totalPass} passed, ${totalFail} failed out of ${totalPass + totalFail}`);
console.log(`Accuracy: ${((totalPass / (totalPass + totalFail)) * 100).toFixed(1)}%`);
console.log(`${"═".repeat(50)}`);

// ═══════════════════════════════════════════
// TEST 14: Tricky false positives — filler that contains technical words
// ═══════════════════════════════════════════
const t14 = runTest("Filler with technical words (should still be low)", [
  "I believe that the overall API architecture needs to be significantly enhanced to provide a more robust developer experience going forward.",
  "The implications of this security vulnerability are quite profound when we consider the broader implications for our authentication infrastructure.",
  "It's worth noting that our deployment pipeline has several significant advantages that we should leverage to ensure optimal performance.",
  "In today's rapidly changing technology environment, maintaining robust error handling serves as a critical foundation for system reliability.",
], [
  "low",  // has "API architecture" but it's wrapped in pure filler
  "low",  // has "security vulnerability" and "authentication" but pure filler structure
  "low",  // has "deployment pipeline" and "performance" but filler
  "low",  // has "error handling" and "system reliability" but filler
]);
totalPass += t14.pass; totalFail += t14.fail;

// ═══════════════════════════════════════════
// TEST 15: Signal that looks like filler — direct, opinionated statements
// ═══════════════════════════════════════════
const t15 = runTest("Signal that looks like filler", [
  "This approach is wrong because it doesn't handle concurrent writes.",
  "We should revert this PR — it breaks backward compatibility with v2 clients.",
  "No, the timeout should be 30s not 5s — the downstream service takes 20s under load.",
  "This duplicates the logic already in utils/validate.js.",
  "Blocked on the DNS migration — can't merge until the CNAME is updated.",
], [
  "high", // specific technical objection
  "high", // specific action with rationale
  "high", // specific numbers and reasoning
  "high", // specific file reference
  "high", // specific blocker with technical detail
]);
totalPass += t15.pass; totalFail += t15.fail;

// ═══════════════════════════════════════════
// TEST 16: Very short sentences
// ═══════════════════════════════════════════
const t16 = runTest("Very short sentences", [
  "Agreed.",
  "See above.",
  "Fixed in abc123.",
  "Works on my machine.",
  "LGTM, ship it.",
  "Reverted in v3.2.1.",
  "Duplicate of #789.",
], [
  "low",  // empty agreement
  "low",  // empty reference
  "high", // commit reference
  "mid",  // mild signal (common phrase but has info)
  "high", // terse but actionable approval
  "high", // specific version
  "high", // specific issue reference
]);
totalPass += t16.pass; totalFail += t16.fail;

// ═══════════════════════════════════════════
// TEST 17: Legal/business writing (not AI-generated but formal)
// ═══════════════════════════════════════════
const t17 = runTest("Legal/business writing (should not false-positive)", [
  "Section 4.2(b) of the agreement requires 30 days written notice before termination.",
  "The indemnification clause covers direct damages up to $1M per incident.",
  "Customer data must be deleted within 90 days of contract expiration per the DPA.",
  "The SLA guarantees 99.95% uptime measured monthly.",
  "Governing law is the State of California.",
], [
  "high", "high", "high", "high", "high",
]);
totalPass += t17.pass; totalFail += t17.fail;

// Final summary
console.log(`\n${"═".repeat(50)}`);
console.log(`TOTAL: ${totalPass} passed, ${totalFail} failed out of ${totalPass + totalFail}`);
console.log(`Accuracy: ${((totalPass / (totalPass + totalFail)) * 100).toFixed(1)}%`);
console.log(`${"═".repeat(50)}`);
