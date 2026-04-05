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

function runTest(name, sentences, expectedSignals, options = {}) {
  const { allowNearMisses = true } = options;
  const embs = sentences.map((_, i) => fakeEmb(i * 7 + 1));
  const fillerEmbs = [fakeEmb(999)];
  const titleEmb = fakeEmb(500);
  const scores = scoreSentences(sentences, embs, fillerEmbs, titleEmb);

  let pass = 0, fail = 0;
  const failures = [];

  for (let i = 0; i < sentences.length; i++) {
    const expected = expectedSignals[i]; // "high", "mid", "low"
    const actual = scores[i] >= 0.65 ? "high" : scores[i] >= 0.45 ? "mid" : "low";
    
    const ok = expected === actual || (
      allowNearMisses &&
      (
        (expected === "high" && actual === "mid") || // acceptable: slightly under
        (expected === "low" && actual === "mid")     // acceptable: slightly over
      )
    );
    
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

// ═══════════════════════════════════════════════
// TEST 18: ChatGPT-specific patterns (not covered by Claude patterns)
// ═══════════════════════════════════════════════
const t18 = runTest("ChatGPT-specific slop patterns", [
  "Certainly! I'd be happy to help you with that.",
  "Absolutely! Let me provide some context on this.",
  "Great question! This is an important topic to understand.",
  "Of course! I'll walk you through this step by step.",
  "I hope this helps! Let me know if you have any other questions.",
  "Feel free to reach out if you need further clarification.",
  "Please don't hesitate to ask if anything is unclear.",
  "I'm glad you asked! This is a common area of confusion.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low",
]);
totalPass += t18.pass; totalFail += t18.fail;

// ═══════════════════════════════════════════════
// TEST 19: Gemini/GPT-4 style "helpful assistant" framing
// ═══════════════════════════════════════════════
const t19 = runTest("Helpful assistant framing slop", [
  "I understand your concern and will do my best to assist.",
  "I can see why this would be confusing for many users.",
  "That's a really thoughtful observation you've made.",
  "I want to make sure I fully address your question.",
  "Based on my understanding of the situation, here's what I think.",
  "I'd like to offer some perspective on this matter.",
  "Allow me to elaborate on this point further.",
  "I think you'll find this information helpful.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low",
]);
totalPass += t19.pass; totalFail += t19.fail;

// ═══════════════════════════════════════════════
// TEST 20: Corporate meeting-speak (enterprise slop)
// ═══════════════════════════════════════════════
const t20 = runTest("Corporate meeting-speak", [
  "Let's circle back on this in our next sync.",
  "We need to get all stakeholders aligned before moving forward.",
  "I'll take this offline and loop you in once I have more visibility.",
  "Let's put a pin in this and revisit when we have more bandwidth.",
  "We should socialize this with the broader team before proceeding.",
  "I want to make sure we're all on the same page here.",
  "Let's table this discussion for now and focus on quick wins.",
  "We need to level-set expectations with leadership.",
  "Let's touch base after the all-hands to discuss next steps.",
  "I'll bubble this up to management and get back to you.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low", "low", "low",
]);
totalPass += t20.pass; totalFail += t20.fail;

// ═══════════════════════════════════════════════
// TEST 21: Marketing copy slop
// ═══════════════════════════════════════════════
const t21 = runTest("Marketing copy slop", [
  "Unlock the full potential of your development workflow.",
  "Empower your team with cutting-edge solutions.",
  "Transform the way you build software.",
  "Experience the future of development today.",
  "Take your productivity to the next level.",
  "Designed with developers in mind.",
  "Built for scale, optimized for speed.",
  "Join thousands of developers who trust our platform.",
  "The modern solution for modern teams.",
  "Your journey to better code starts here.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low", "low", "low",
]);
totalPass += t21.pass; totalFail += t21.fail;

// ═══════════════════════════════════════════════
// TEST 22: Dense technical writing that uses common words
// ═══════════════════════════════════════════════
const t22 = runTest("Dense technical prose (should be high)", [
  "The problem is the shared state between goroutines — you need a sync.Mutex or use channels instead.",
  "When the connection pool exhausts, new requests block until a slot opens or the timeout hits.",
  "The issue is your WHERE clause: you're comparing a string to an int, so the index isn't used.",
  "React re-renders because the object reference changes on every render even though the values are the same.",
  "The memory leak comes from the event listener never being removed when the component unmounts.",
  "TCP keepalive is off by default on that kernel version, which is why connections die after the LB timeout.",
], [
  "high", "high", "high", "high", "high", "high",
]);
totalPass += t22.pass; totalFail += t22.fail;

// ═══════════════════════════════════════════════
// TEST 23: Legal text that's actual signal (not filler)
// ═══════════════════════════════════════════════
const t23 = runTest("Legal text signal", [
  "The non-compete expires 18 months after termination.",
  "Arbitration is mandatory per Section 12.4; you can't file in court.",
  "The IP assignment covers work product created during employment, not personal projects on your own time.",
  "Force majeure doesn't cover supply chain issues under this contract — only acts of God and war.",
  "The limitation of liability cap is $500K aggregate, not per claim.",
  "You retain ownership of pre-existing IP listed in Exhibit B.",
], [
  "high", "high", "high", "high", "high", "high",
]);
totalPass += t23.pass; totalFail += t23.fail;

// ═══════════════════════════════════════════════
// TEST 24: Gerund fragment litany (AI structural tic)
// ═══════════════════════════════════════════════
const t24 = runTest("Gerund fragment litany", [
  "Fixing small bugs.",
  "Writing straightforward features.",
  "Implementing well-defined tickets.",
  "Reviewing pull requests.",
  "Debugging edge cases.",
  "Shipping faster.",
  "Moving quicker.",
  "Delivering more.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low",
]);
totalPass += t24.pass; totalFail += t24.fail;

// ═══════════════════════════════════════════════
// TEST 25: False ranges and empty parallelism
// ═══════════════════════════════════════════════
const t25 = runTest("False ranges and parallelism", [
  "From innovation to implementation to cultural transformation.",
  "Products impress people; platforms empower them.",
  "Not a bug, not a feature, but a fundamental design flaw.",
  "They could expose, they could offer, they could provide, they could create.",
  "From problem-solving to scientific discovery to artistic expression.",
  "It's not bold, it's backwards.",
], [
  "low", "low", "low", "low", "low", "low",
]);
totalPass += t25.pass; totalFail += t25.fail;

// ═══════════════════════════════════════════════
// TEST 26: Invented concept labels (AI analytical theater)
// ═══════════════════════════════════════════════
const t26 = runTest("Invented concept labels", [
  "This is what I call the supervision paradox.",
  "We're seeing classic acceleration trap dynamics here.",
  "The team is experiencing workload creep across all initiatives.",
  "This reflects the broader innovation vacuum in the industry.",
  "It's a textbook example of the scalability inversion problem.",
  "We need to address the fundamental trust asymmetry in this relationship.",
], [
  "low", "low", "low", "low", "low", "low",
]);
totalPass += t26.pass; totalFail += t26.fail;

// ═══════════════════════════════════════════════
// TEST 27: Email sign-offs and pleasantries
// ═══════════════════════════════════════════════
const t27 = runTest("Email sign-offs and pleasantries", [
  "Best regards and looking forward to hearing from you soon.",
  "Thanks in advance for your time and consideration.",
  "Please let me know if you have any questions or concerns.",
  "I appreciate your patience while we work through this.",
  "Thank you for your continued partnership.",
  "Warm regards and hope you have a great rest of your day.",
  "Looking forward to our continued collaboration.",
  "Thanks again for your understanding.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low",
]);
totalPass += t27.pass; totalFail += t27.fail;

// ═══════════════════════════════════════════════
// TEST 28: Self-referential AI disclaimers (2024-2025 era)
// ═══════════════════════════════════════════════
const t28 = runTest("AI self-referential disclaimers", [
  "As an AI language model, I don't have personal opinions, but here's what I think.",
  "While I can't browse the internet, based on my training data I would say.",
  "My knowledge cutoff is April 2024, so this information may be outdated.",
  "I should note that I may make mistakes, so please verify this information.",
  "I want to be transparent that I'm an AI assistant.",
], [
  "low", "low", "low", "low", "low",
]);
totalPass += t28.pass; totalFail += t28.fail;

// ═══════════════════════════════════════════════
// TEST 29: The "imagine a world" futurism opener
// ═══════════════════════════════════════════════
const t29 = runTest("Futurism imagine-a-world openers", [
  "Imagine a world where every developer has access to these tools.",
  "Picture this: a future where bugs are caught before they're written.",
  "Think about what it would mean if we could automate this entire workflow.",
  "Consider a scenario where all of our systems communicate seamlessly.",
  "What if I told you there was a better way to approach this problem?",
  "Envision a development environment where friction simply doesn't exist.",
], [
  "low", "low", "low", "low", "low", "low",
]);
totalPass += t29.pass; totalFail += t29.fail;

// ═══════════════════════════════════════════════
// TEST 30: Slack acronyms that ARE signal vs empty
// ═══════════════════════════════════════════════
const t30 = runTest("Slack acronyms signal vs empty", [
  "WFH tomorrow, ping me on Slack if urgent.",
  "OOO until Monday, @sarah is covering.",
  "EOD deadline for the RFC review.",
  "TL;DR: the migration breaks auth for SSO users.",
  "FYI cc @team",
  "ICYMI the deploy window is 2-4pm PT.",
  "IMO this is fine.",
  "AFAIK nobody has looked at this yet.",
], [
  "high", // specific plan with action
  "high", // specific coverage info
  "high", // specific deadline
  "high", // specific summary
  "low",  // empty FYI
  "high", // specific time window
  "low",  // empty opinion marker
  "low",  // empty hedging
]);
totalPass += t30.pass; totalFail += t30.fail;

// ═══════════════════════════════════════════════
// TEST 31: Historical analogy stacking
// ═══════════════════════════════════════════════
const t31 = runTest("Historical analogy stacking", [
  "Apple didn't build Uber, Facebook didn't build Spotify, Stripe didn't build Shopify.",
  "Every major technological shift — the web, mobile, social, cloud — followed the same pattern.",
  "Take Spotify, or consider Uber, Airbnb followed a similar path, even Discord.",
  "Just as the printing press revolutionized communication, AI will transform how we code.",
  "Like the railroads of the 19th century, platforms create network effects.",
], [
  "low", "low", "low", "low", "low",
]);
totalPass += t31.pass; totalFail += t31.fail;

// ═══════════════════════════════════════════════
// TEST 32: The "truth is simple" assertion dodge
// ═══════════════════════════════════════════════
const t32 = runTest("Truth-is-simple assertions", [
  "The reality is simpler and less flattering.",
  "History is unambiguous on this point.",
  "The math here is straightforward.",
  "This much is obvious to anyone who's looked at the data.",
  "The answer is clear when you think about it.",
  "It's really not that complicated when you break it down.",
], [
  "low", "low", "low", "low", "low", "low",
]);
totalPass += t32.pass; totalFail += t32.fail;

// ═══════════════════════════════════════════════
// TEST 33: Code review bot boilerplate
// ═══════════════════════════════════════════════
const t33 = runTest("Code review bot boilerplate", [
  "This PR introduces changes to 5 files with 234 additions and 89 deletions.",
  "Code coverage decreased by 2.3% from 78.4% to 76.1%.",
  "Build passed in 4m 23s.",
  "All checks have passed.",
  "This change has been automatically flagged for security review.",
  "Deploying to staging environment preview-pr-4521.vercel.app.",
], [
  "high", // specific stats
  "high", // specific metrics
  "high", // specific timing
  "mid",  // generic pass status (mild signal)
  "mid",  // generic flag (mild signal)
  "high", // specific URL
]);
totalPass += t33.pass; totalFail += t33.fail;

// ═══════════════════════════════════════════════
// TEST 34: Performance review / feedback slop
// ═══════════════════════════════════════════════
const t34 = runTest("Performance review slop", [
  "You consistently demonstrate strong collaboration skills.",
  "Your attention to detail is evident in your work.",
  "You've shown growth in this area over the review period.",
  "Continue to develop your leadership capabilities.",
  "You bring a positive attitude to team interactions.",
  "Your communication could be more proactive.",
  "Consider seeking out stretch opportunities.",
], [
  "low", "low", "low", "low", "low", "low", "low",
]);
totalPass += t34.pass; totalFail += t34.fail;

// ═══════════════════════════════════════════════
// TEST 35: Exec summary slop vs signal
// ═══════════════════════════════════════════════
const t35 = runTest("Exec summary slop vs signal", [
  "We are well-positioned to capitalize on emerging market opportunities.",
  "Q3 revenue: $47M vs $52M target (-9.6%).",
  "The team has made significant progress on key strategic initiatives.",
  "Churn increased to 4.2% (up from 3.1% in Q2).",
  "We remain committed to delivering value for our stakeholders.",
  "CAC payback improved to 14 months from 18 months.",
  "Cross-functional alignment has been a focus area this quarter.",
  "Enterprise pipeline: $12M qualified, $4.2M committed.",
], [
  "low",  // generic positioning
  "high", // specific numbers
  "low",  // vague progress
  "high", // specific metric
  "low",  // stakeholder speak
  "high", // specific improvement
  "low",  // vague focus
  "high", // specific pipeline
]);
totalPass += t35.pass; totalFail += t35.fail;

// ═══════════════════════════════════════════════
// TEST 36: Unicode edge cases
// ═══════════════════════════════════════════════
const t36 = runTest("Unicode edge cases", [
  "😀😀😀😀😀",
  "服务器在 03:14 UTC 返回 500 错误，影响 12 个请求。",
  "Café login fails on v2.3 when the username contains combining marks.",
  "هل يعيد الخادم 500؟",
], [
  "low",  // emoji-only content
  "high", // concrete CJK incident report
  "high", // combining characters with specific bug details
  "high", // direct RTL question with Arabic punctuation
], { allowNearMisses: false });
totalPass += t36.pass; totalFail += t36.fail;

// ═══════════════════════════════════════════════
// TEST 37: Very long sentences
// ═══════════════════════════════════════════════
const t37 = runTest("Very long sentences", [
  "word ".repeat(220) + ".",
  ("After careful review ".repeat(20)) + "the root cause is a missing index on users.email.",
], [
  "low",  // 200+ words of near-empty repetition
  "high", // very long but contains concrete finding (missing index on users.email)
]);
totalPass += t37.pass; totalFail += t37.fail;

// ═══════════════════════════════════════════════
// TEST 38: Pure code should stay visible
// ═══════════════════════════════════════════════
const t38 = runTest("Pure code inputs", [
  "const x = foo(bar); if (x) { return baz(); }",
  "SELECT * FROM users WHERE id = 1;",
  "function render(){ return <div>{items.map(i => <li key={i.id}>{i.name}</li>)}</div> }",
], [
  "high", // code block should not be dimmed
  "high", // SQL snippet should stay visible
  "high", // JSX snippet should stay visible
], { allowNearMisses: false });
totalPass += t38.pass; totalFail += t38.fail;

// ═══════════════════════════════════════════════
// TEST 39: Empty-ish inputs
// ═══════════════════════════════════════════════
const t39 = runTest("Empty-ish inputs", [
  "",
  "   ",
  "&nbsp;",
  "<div><span></span></div>",
  "---",
], [
  "low", "low", "low", "low", "low",
], { allowNearMisses: false });
totalPass += t39.pass; totalFail += t39.fail;

// ═══════════════════════════════════════════════
// TEST 40: Malformed HTML-ish content
// ═══════════════════════════════════════════════
const t40 = runTest("Malformed HTML content", [
  "<script>alert(1)</script>",
  "<<<<< HEAD",
  "<div class=\"x\">",
  "<p>JWT refresh returns 500 for expired tokens",
], [
  "low",  // markup/script noise
  "low",  // merge marker noise
  "low",  // dangling tag
  "high", // malformed markup wrapper around a concrete finding
], { allowNearMisses: false });
totalPass += t40.pass; totalFail += t40.fail;

// ═══════════════════════════════════════════
// TEST 41: Non-English text with technical content
// Filler patterns are English-only; non-English text should not false-positive.
// ═══════════════════════════════════════════
const t41 = runTest("Non-English technical text", [
  "このバグはv3.2で修正されました。",                                              // Japanese: "This bug was fixed in v3.2"
  "El servidor devuelve error 500 cuando el payload excede 10MB.",              // Spanish: server returns 500
  "Die Latenz stieg nach dem Deployment von 12ms auf 340ms.",                  // German: latency jumped 12ms→340ms
  "Ce bug est reproduit uniquement sur Chrome 120 avec le flag --disable-gpu.",// French: bug repro steps
], [
  "high", "high", "high", "high",
]);
totalPass += t41.pass; totalFail += t41.fail;

// ═══════════════════════════════════════════
// TEST 42: Emoji-decorated messages with real content
// ═══════════════════════════════════════════
const t42 = runTest("Emoji and special characters", [
  "🚀 Deploy succeeded — all 247 tests passing, zero regressions",
  "🔴 Production is down — 503 on all /api/* endpoints since 14:32 UTC",
  "⚠️ Deprecation warning: remove calls to legacy_auth() before v5 ships",
  "✅ LGTM — approved with no changes requested",
], [
  "high", "high", "high", "high",
]);
totalPass += t42.pass; totalFail += t42.fail;

// ═══════════════════════════════════════════
// TEST 43: Code blocks and CLI commands (always high signal)
// ═══════════════════════════════════════════
const t43 = runTest("Code blocks and CLI commands", [
  'const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);',
  'if err != nil { return fmt.Errorf("connection failed: %w", err) }',
  "git rebase -i HEAD~5",
  "docker run -p 8080:80 -e NODE_ENV=production myapp:latest",
  "kubectl get pods -n production | grep CrashLoopBackOff",
  'curl -X POST https://api.example.com/v2/deploy -H "Authorization: Bearer $TOKEN"',
], [
  "high", "high", "high", "high", "high", "high",
]);
totalPass += t43.pass; totalFail += t43.fail;

// ═══════════════════════════════════════════
// TEST 44: Very long sentences (boundary behavior)
// ═══════════════════════════════════════════
const longFiller = "I believe that " +
  "we should consider the broader implications of this change and take a more comprehensive approach to addressing these concerns so that ".repeat(15) +
  "we can move forward effectively.";
const longSignal = "The migration script at db/migrate/20240301_add_index.sql adds a composite " +
  "index on (user_id, created_at) to the orders table, which should reduce the p95 query time from " +
  "340ms to under 20ms based on EXPLAIN ANALYZE results from staging.";
const t44 = runTest("Very long sentences", [
  longFiller,
  longSignal,
], [
  "low",  // massive filler repetition
  "high", // dense with specific technical content
]);
totalPass += t44.pass; totalFail += t44.fail;

// ═══════════════════════════════════════════
// TEST 45: ALL CAPS sentences (usually urgent)
// ═══════════════════════════════════════════
const t45 = runTest("ALL CAPS sentences", [
  "DO NOT MERGE — CI IS RED ON MAIN",
  "BREAKING CHANGE: API v2 endpoints removed",
  "URGENT: DATABASE IS RUNNING OUT OF DISK SPACE",
  "TODO: REFACTOR THIS LATER",
], [
  "high", "high", "high", "high",
]);
totalPass += t45.pass; totalFail += t45.fail;

// ═══════════════════════════════════════════
// TEST 46: Specific content should beat generic filler phrasing
// ═══════════════════════════════════════════
const t46 = runTest("Filler patterns with specific content (known false positives)", [
  "Overall quality score dropped from 4.8 to 3.2 after the v5 release.",
  "Run the pre-flight script to ensure a seamless cutover at 2am PST on Saturday.",
  "Great work — the p99 latency is now under 10ms.",
  "The test coverage looks solid at 94%.",
  "The comprehensive approach described in RFC 9421 supersedes the previous draft.",
  "This is a well-thought-out proposal with clear milestones: Phase 1 by March 15, Phase 2 by April 30.",
], [
  "high", "high", "high", "high", "high", "high",
]);
totalPass += t46.pass; totalFail += t46.fail;

// ═══════════════════════════════════════════
// TEST 47: Filler that escapes pattern detection
// No filler patterns match; lands at neutral base score.
// ═══════════════════════════════════════════
const t47 = runTest("Uncaught filler (scores mid, should be lower)", [
  "Furthermore, additionally, moreover, it should be noted.",
  "That being said, let us consider the following.",
  "This really needs to be thought through more carefully by the team.",
  "There are a lot of things to consider when we think about this problem.",
], [
  // These are filler but currently score "mid" — marked "low" which passes
  // via tolerance (mid actual is accepted for low expected).
  "low", "low", "low", "low",
]);
totalPass += t47.pass; totalFail += t47.fail;

// ═══════════════════════════════════════════
// TEST 48: Ambiguous short directives (no specifics)
// ═══════════════════════════════════════════
const t48 = runTest("Ambiguous short directives", [
  "We should fix this.",
  "This needs attention.",
  "Please review.",
  "Acknowledged.",
  "Will do.",
  "Noted.",
], [
  "mid", "mid", "mid", "low", "mid", "mid",
]);
totalPass += t48.pass; totalFail += t48.fail;

// ═══════════════════════════════════════════
// TEST 49: Repeated sentences (redundancy code path)
// With fake embeddings each gets a unique vector, so this mainly
// validates the code path doesn't crash with duplicate text.
// ═══════════════════════════════════════════
const t49 = runTest("Repeated sentences", [
  "The server returned a 500 error at 14:32 UTC.",
  "The server returned a 500 error at 14:32 UTC.",
  "The server returned a 500 error at 14:32 UTC.",
  "This is a completely different sentence about the deploy pipeline.",
], [
  "high", "high", "high", "high",
]);
totalPass += t49.pass; totalFail += t49.fail;

// ═══════════════════════════════════════════
// TEST 50: Filler openers with hard data payloads
// ═══════════════════════════════════════════
const t50 = runTest("Filler openers with data payloads", [
  "It's worth noting that the p99 latency spiked to 2.3s after commit abc123f.",
  "Importantly, the CVE-2024-5678 patch must ship before the March 15 deadline.",
  "Notably, the EU AI Act Article 52 requires disclosure of AI-generated content.",
  "As you may know, Python 3.12 removed the deprecated distutils module entirely.",
], [
  "high", "high", "high", "high",
]);
totalPass += t50.pass; totalFail += t50.fail;

// ═══════════════════════════════════════════
// TEST 51: Single sentence in isolation (no neighbors)
// ═══════════════════════════════════════════
const t51 = runTest("Empty and minimal inputs", [
  "This is a single test sentence that should just work without neighbors.",
], [
  "mid",
]);
totalPass += t51.pass; totalFail += t51.fail;

// ═══════════════════════════════════════════
// TEST 52: Real-world workplace filler vs signal
// ═══════════════════════════════════════════
const t52 = runTest("Realistic workplace content", [
  "Per our earlier conversation",
  "Thanks for flagging this",
  "Hope this helps!",
  "Happy to discuss further",
  "Really appreciate the thorough review",
  "I completely agree with your assessment here",
  "I've taken the liberty of reviewing the attached proposal",
  "Acknowledged, thanks for bringing this up",
  "Note: refresh tokens issued before March 1 remain valid until rotation completes.",
  "Important: delete customer backups within 30 days under the DPA.",
  "Meeting moved to 3:30pm PT with Sarah and Miguel.",
  "TypeError: Cannot read properties of undefined (reading 'id')",
], [
  "low", "low", "low", "low", "low", "low", "low", "low",
  "high", "high", "high", "high",
]);
totalPass += t52.pass; totalFail += t52.fail;

// ═══════════════════════════════════════════════
// TEST 53: GitHub PR review filler (new patterns)
// ═══════════════════════════════════════════════
const t53 = runTest("GitHub PR review filler patterns", [
  // Filler (should be low)
  "nit:",
  "LGTM",
  "Looks good to me, just a few minor suggestions",
  "Have we considered this approach?",
  "Not blocking, but something to consider",
  "Feel free to ignore this",
  "Food for thought",
  "Approved",
  "Ship it",
  // Signal (should be high) - nits with actual content
  "nit: missing semicolon on line 42, will cause linter failure",
  "LGTM - verified JWT refresh works with expired tokens",
  "Have we considered using Redis for caching? It handles 100K ops/sec.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low", "low",
  "high", "high", "high",
]);
totalPass += t53.pass; totalFail += t53.fail;

// ═══════════════════════════════════════════════
// TEST 54: Slack/Teams chat filler (new patterns)
// ═══════════════════════════════════════════════
const t54 = runTest("Slack/Teams chat filler patterns", [
  // Filler (should be low)
  "Hey! Hope you're having a great day",
  "Sorry to bother you but...",
  "Just wanted to follow up",
  "Bumping this thread",
  "Thanks all!",
  "Thanks team!",
  "+1",
  "Same here",
  "Agreed",
  "Sounds good",
  "Works for me",
  "Following",
  "FWIW",
  // Signal with similar patterns (should be high)
  "Hey, the deploy is failing with exit code 137 (OOM)",
  "Sorry to bother you but the auth service is returning 500s in prod",
  "Following up on the P0 bug from yesterday - fixed in commit abc123",
], [
  "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low",
  "high", "high", "high",
]);
totalPass += t54.pass; totalFail += t54.fail;

// ═══════════════════════════════════════════════
// TEST 55: AI-generated content patterns (2025-2026 era)
// ═══════════════════════════════════════════════
const t55 = runTest("AI-generated content patterns", [
  // Filler (should be low)
  "Great question!",
  "That's a really interesting point",
  "I'd be happy to help with that",
  "Based on the information provided",
  "To provide a comprehensive answer",
  "This is a nuanced topic that requires careful consideration",
  "Let me provide some context",
  "I should note that",
  "Firstly,",
  "Secondly,",
  "Additionally,",
  "Furthermore,",
  "Hope this helps!",
  "Happy to discuss further",
  "Does this answer your question?",
  // Signal with AI-like framing but specific content (should be high)
  "Based on the error logs, the OOM is triggered by the image processing pipeline at line 234.",
  "To provide context: the JWT library we use (v3.2) has a known bug with RSA-256 keys.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low",
  "high", "high",
]);
totalPass += t55.pass; totalFail += t55.fail;

// ═══════════════════════════════════════════════
// TEST 56: Corporate email filler (new patterns)
// ═══════════════════════════════════════════════
const t56 = runTest("Corporate email filler patterns", [
  // Filler (should be low)
  "Per my last email",
  "As discussed in our previous meeting",
  "I trust this email finds you well",
  "Please see attached",
  "Kindly note",
  "For your information",
  "Please be advised",
  "Thank you for your prompt attention",
  "Please do not hesitate to contact me",
  "Best regards",
  "Warm regards",
  "At your earliest convenience",
  "Just circling back",
  "Please keep me posted",
  // Signal with similar patterns but specifics (should be high)
  "Per my last email, the contract expires March 15 and legal needs signatures by EOD Friday.",
  "As discussed in our Q3 review, we're cutting the platform team by 3 FTEs.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low",
  "high", "high",
]);
totalPass += t56.pass; totalFail += t56.fail;

// ═══════════════════════════════════════════════
// TEST 57: Documentation filler (new patterns)
// ═══════════════════════════════════════════════
const t57 = runTest("Documentation filler patterns", [
  // Filler (should be low)
  "This section describes the authentication flow.",
  "In this guide, you will learn how to set up the project.",
  "Before we get started, let's understand the basics.",
  "Now that we've covered the fundamentals, let's move on.",
  "As mentioned earlier in this document.",
  "Let's move on to the next section.",
  "We'll cover this in more detail later.",
  // Signal with doc-like framing but specifics (should be high)
  "This section describes the JWT refresh flow: POST /api/auth/refresh with the refresh_token header.",
  "Before we begin, install Node.js 18+ and run npm install.",
], [
  "low", "low", "low", "low", "low", "low", "low",
  "high", "high",
]);
totalPass += t57.pass; totalFail += t57.fail;

// ═══════════════════════════════════════════════
// TEST 58: False profundity and stakes inflation (new patterns)
// ═══════════════════════════════════════════════
const t58 = runTest("False profundity patterns", [
  // Filler (should be low)
  "This changes everything",
  "A game-changing approach",
  "A watershed moment for the industry",
  "Marks a turning point",
  "Will never be the same",
  "The new normal",
  "On the cutting edge",
  "Pushing the boundaries",
  "Redefining what's possible",
  "The future is here",
  // Signal (specific claims, even if bold) (should be high)
  "This changes how we handle auth: tokens now expire in 15min instead of 24h.",
  "Pushing 10K requests/sec through the new cache layer.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low", "low", "low",
  "high", "high",
]);
totalPass += t58.pass; totalFail += t58.fail;

// ═══════════════════════════════════════════════
// TEST 59: Meeting filler (new patterns)
// ═══════════════════════════════════════════════
const t59 = runTest("Meeting filler patterns", [
  // Filler (should be low)
  "Thanks everyone for joining",
  "Let's get started",
  "Before we begin",
  "Does anyone have any questions?",
  "Any final questions?",
  "I'll let you go",
  "I'll give you your time back",
  "I know everyone is busy",
  "Appreciate everyone's time",
  "Great question!",
  "That's a great point",
  // Signal (meeting content with specifics) (should be high)
  "Thanks for joining - today we're reviewing the Q3 OKRs and the auth migration timeline.",
  "Before we begin: reminder that the staging deploy window is 2-4pm PT today.",
], [
  "low", "low", "low", "low", "low", "low", "low", "low", "low", "low", "low",
  "high", "high",
]);
totalPass += t59.pass; totalFail += t59.fail;

// ═══════════════════════════════════════════════
// TEST 60: Patronizing analogies (new patterns)
// ═══════════════════════════════════════════════
const t60 = runTest("Patronizing analogy patterns", [
  // Filler (should be low)
  "Think of it like a highway for data",
  "You can think of this as a Swiss Army knife",
  "Imagine it as a digital mailbox",
  "It's kind of like when you organize your closet",
  // Signal (analogies with technical grounding) (should be high)
  "Think of it like a circuit breaker: after 5 failures, it opens and skips the call for 30s.",
  "The connection pool is like a taxi stand: 10 connections wait, new requests queue.",
], [
  "low", "low", "low", "low",
  "high", "high",
]);
totalPass += t60.pass; totalFail += t60.fail;

// ═══════════════════════════════════════════════
// TEST 61: Empty acknowledgments vs actionable short messages
// ═══════════════════════════════════════════════
const t61 = runTest("Empty acknowledgments vs actionable", [
  // Empty acknowledgments (should be low)
  "See above",
  "Yep",
  "Sure",
  "Exactly",
  "Thanks!",
  "Thank you!",
  "No problem",
  "No worries",
  "You're welcome",
  "Anytime",
  // Actionable short messages (should be high or mid)
  "Fixed in v3.2.1",
  "Merged to main",
  "Deployed to staging",
  "Duplicate of #789",
], [
  "low", "low", "low", "low", "low", "low", "low", "low", "low", "low",
  "high", "high", "high", "high",
]);
totalPass += t61.pass; totalFail += t61.fail;

// Final summary
console.log(`\n${"═".repeat(50)}`);
console.log(`TOTAL: ${totalPass} passed, ${totalFail} failed out of ${totalPass + totalFail}`);
console.log(`Accuracy: ${((totalPass / (totalPass + totalFail)) * 100).toFixed(1)}%`);
console.log(`${"═".repeat(50)}`);

if (totalFail > 0) {
  process.exitCode = 1;
}
