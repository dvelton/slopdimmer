// Content script: extracts text, coordinates scoring, applies visual treatment.

(function () {
  if (window.__slopDimmerInjected) return;
  window.__slopDimmerInjected = true;
  window.__slopDimmerActive = false;
  let _processing = false;

  const MIN_SENTENCES = 2;
  const MIN_SENTENCE_LENGTH = 15;

  // Split text into sentences, preserving URLs, version numbers, and file paths.
  function splitSentences(text) {
    // Placeholder tokens for patterns that contain periods but aren't sentence-enders
    const placeholders = [];
    let safe = text;

    // Protect URLs
    safe = safe.replace(/https?:\/\/\S+/g, (m) => { placeholders.push(m); return `__SDSAFE${placeholders.length - 1}__`; });
    // Protect file paths (src/auth.js, /etc/nginx/conf.d/default.conf, etc.)
    safe = safe.replace(/(?:~\/|\.\/|\/)?(?:[\w.-]+\/)+[\w.-]+\.\w+/g, (m) => { placeholders.push(m); return `__SDSAFE${placeholders.length - 1}__`; });
    // Protect version numbers (v3.2.0, Python 3.12.1, etc.)
    safe = safe.replace(/v?\d+\.\d+(?:\.\d+)+/g, (m) => { placeholders.push(m); return `__SDSAFE${placeholders.length - 1}__`; });
    // Protect common abbreviations
    safe = safe.replace(/\b(e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|Sr|Jr|Inc|Ltd|Corp|approx|dept|est|govt|misc|assn|blvd)\./gi, (m) => { placeholders.push(m); return `__SDSAFE${placeholders.length - 1}__`; });
    // Protect decimal numbers (3.14, 0.5, 99.9%)
    safe = safe.replace(/\d+\.\d+/g, (m) => { placeholders.push(m); return `__SDSAFE${placeholders.length - 1}__`; });

    // Split on sentence-ending punctuation followed by whitespace or end of string
    const raw = safe.match(/[^.!?\n]+(?:[.!?]+|$)/g) || [safe];

    // Restore placeholders and filter
    return raw
      .map((s) => {
        let restored = s.trim();
        restored = restored.replace(/__SDSAFE(\d+)__/g, (_, idx) => placeholders[parseInt(idx)]);
        return restored;
      })
      .filter((s) => s.length >= MIN_SENTENCE_LENGTH);
  }

  // Find text containers worth scoring.
  // Strategy: find the highest-level content containers first (comment bodies, articles),
  // then fall back to individual paragraphs only if no containers are found.
  function findTextBlocks() {
    // Tier 1: content containers (GitHub, email, CMS, generic)
    const containerSelectors = [
      ".comment-body",
      ".markdown-body",
      ".js-comment-body",
      ".timeline-comment-body",
      ".review-comment",
      ".email-body",
      ".message-body",
      "article",
      '[role="article"]',
      ".post-content",
      ".entry-content",
      ".post-body",
      "main",
    ];

    let containers = [];
    for (const sel of containerSelectors) {
      containers.push(...document.querySelectorAll(sel));
    }

    // Deduplicate: if a container is inside another container we already have, skip it
    containers = containers.filter((el, i) => {
      for (let j = 0; j < containers.length; j++) {
        if (i !== j && containers[j].contains(el) && containers[j] !== el) {
          return false;
        }
      }
      return true;
    });

    // Filter to containers with enough text
    const blocks = [];
    const seen = new Set();
    for (const el of containers) {
      if (el.closest("[contenteditable]") || el.isContentEditable) continue;
      const text = el.innerText?.trim();
      if (!text || text.length < 80) continue;
      if (seen.has(text)) continue;
      if (el.closest("[data-slopdimmer-processed]")) continue;
      seen.add(text);
      blocks.push(el);
    }

    // Tier 2: if no containers found, fall back to paragraphs
    if (blocks.length === 0) {
      const paragraphs = document.querySelectorAll("p, li, td, blockquote, pre");
      for (const el of paragraphs) {
        if (el.closest("[contenteditable]") || el.isContentEditable) continue;
        const text = el.innerText?.trim();
        if (!text || text.length < 80) continue;
        if (seen.has(text)) continue;
        if (el.closest("[data-slopdimmer-processed]")) continue;
        seen.add(text);
        blocks.push(el);
      }
    }

    return blocks;
  }

  // Apply scores at the paragraph level within a container.
  // For each <p>, <li>, <blockquote> etc. inside the container, compute the
  // average score of its sentences and apply opacity to the whole element.
  function applyBlockScores(element, sentences, scores) {
    element.setAttribute("data-slopdimmer-processed", "true");

    // Get all paragraph-level children
    const children = element.querySelectorAll("p, li, blockquote, h2, h3, h4, h5, h6, tr, pre");
    
    if (children.length === 0) {
      // No sub-elements — apply to the container itself
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      element.style.opacity = avgScore.toFixed(2);
      element.setAttribute("data-slopdimmer-score", avgScore.toFixed(2));
      const signal = avgScore >= 0.65 ? "high" : avgScore >= 0.4 ? "mid" : "low";
      element.setAttribute("data-slopdimmer-signal", signal);
      return;
    }

    // Map each child to its sentences and apply the average score
    for (const child of children) {
      const childText = child.innerText?.trim();
      if (!childText || childText.length < 15) continue;

      // Find which sentences belong to this child
      const childScores = [];
      for (let i = 0; i < sentences.length; i++) {
        if (childText.includes(sentences[i]) || sentences[i].includes(childText.substring(0, 30))) {
          childScores.push(scores[i]);
        }
      }

      if (childScores.length === 0) {
        // Fuzzy match: find best overlapping sentence
        let bestScore = 0.5;
        for (let i = 0; i < sentences.length; i++) {
          const words = sentences[i].split(/\s+/);
          const childWords = childText.split(/\s+/);
          const overlap = words.filter(w => childWords.includes(w)).length;
          if (overlap > words.length * 0.3) {
            childScores.push(scores[i]);
          }
        }
        if (childScores.length === 0) childScores.push(bestScore);
      }

      const avgScore = childScores.reduce((a, b) => a + b, 0) / childScores.length;
      child.style.opacity = avgScore.toFixed(2);
      child.setAttribute("data-slopdimmer-score", avgScore.toFixed(2));
      const signal = avgScore >= 0.65 ? "high" : avgScore >= 0.4 ? "mid" : "low";
      child.setAttribute("data-slopdimmer-signal", signal);
    }
  }

  // Add density badge near the first heading
  function addDensityBadge(scores) {
    const existing = document.querySelector(".slopdimmer-badge");
    if (existing) existing.remove();

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const signalPct = Math.round(
      (scores.filter((s) => s >= 0.7).length / scores.length) * 100
    );

    const heading = document.querySelector(
      "h1, .js-issue-title, .gh-header-title"
    );
    if (!heading) return;

    const badge = document.createElement("span");
    badge.className = "slopdimmer-badge";
    badge.textContent = `${signalPct}% signal`;

    if (signalPct >= 60) {
      badge.classList.add("slopdimmer-badge-high");
    } else if (signalPct >= 35) {
      badge.classList.add("slopdimmer-badge-mid");
    } else {
      badge.classList.add("slopdimmer-badge-low");
    }

    heading.appendChild(badge);
  }

  // Remove all SlopDimmer modifications
  function deactivate() {
    document.querySelectorAll(".slopdimmer-badge").forEach((b) => b.remove());

    // Restore opacity on all scored elements
    document.querySelectorAll("[data-slopdimmer-score]").forEach((el) => {
      el.style.opacity = "";
      el.removeAttribute("data-slopdimmer-score");
      el.removeAttribute("data-slopdimmer-signal");
    });

    document.querySelectorAll("[data-slopdimmer-processed]").forEach((el) => {
      el.removeAttribute("data-slopdimmer-processed");
    });

    document.body.classList.remove("slopdimmer-signal-only");
    window.__slopDimmerActive = false;
  }

  function activate() {
    if (window.__slopDimmerActive) {
      deactivate();
      return;
    }
    analyze();
  }

  // Core analysis pipeline (also used by SPA observer for re-analysis)
  async function analyze() {
    if (_processing) return;
    _processing = true;

    try {

    const blocks = findTextBlocks();
    if (blocks.length === 0) { _processing = false; return; }

    // Collect all sentences across all blocks
    const blockData = [];
    const allSentences = [];

    for (const block of blocks) {
      const text = block.innerText.trim();
      const sentences = splitSentences(text);
      if (sentences.length < MIN_SENTENCES) continue;
      blockData.push({ element: block, sentences, startIdx: allSentences.length });
      allSentences.push(...sentences);
    }

    if (allSentences.length === 0) { _processing = false; return; }

    // Request embeddings from background worker
    const embeddings = await requestEmbeddings(allSentences);
    if (!embeddings) { _processing = false; return; }

    // Request filler embeddings
    const fillerEmbeddings = await requestFillerEmbeddings();

    // Score using imported scorer via background
    const scores = await requestScoring(
      allSentences,
      embeddings,
      fillerEmbeddings
    );

    if (!scores) { _processing = false; return; }

    // Apply visual treatment to each block
    for (const { element, sentences, startIdx } of blockData) {
      const blockScores = scores.slice(startIdx, startIdx + sentences.length);
      applyBlockScores(element, sentences, blockScores);
    }

    addDensityBadge(scores);
    window.__slopDimmerActive = true;

    // Notify popup of completion (ignore errors if popup is closed)
    chrome.runtime.sendMessage({
      type: "analysis_complete",
      stats: {
        totalSentences: allSentences.length,
        highSignal: scores.filter((s) => s >= 0.7).length,
        lowSignal: scores.filter((s) => s < 0.4).length,
        avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      },
    }, () => void chrome.runtime.lastError);
    } catch (err) {
      console.error("SlopDimmer: activation failed", err);
      chrome.runtime.sendMessage({
        type: "analysis_error",
        error: err.message,
      }, () => void chrome.runtime.lastError);
    } finally {
      _processing = false;
    }
  }

  // Communication with background service worker
  function sendMessage(msg) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(msg, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }

  async function requestEmbeddings(texts) {
    try {
      const response = await sendMessage({ type: "embed", texts });
      return response?.embeddings || null;
    } catch (err) {
      console.error("SlopDimmer: embedding failed", err);
      return null;
    }
  }

  async function requestFillerEmbeddings() {
    try {
      const response = await sendMessage({ type: "get_filler_embeddings" });
      return response?.embeddings || [];
    } catch (err) {
      console.error("SlopDimmer: filler embeddings failed", err);
      return [];
    }
  }

  async function requestScoring(sentences, sentenceEmbeddings, fillerEmbeddings) {
    try {
      const response = await sendMessage({
        type: "score",
        sentences,
        sentenceEmbeddings,
        fillerEmbeddings,
      });
      return response?.scores || null;
    } catch (err) {
      console.error("SlopDimmer: scoring failed", err);
      return null;
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "toggle") {
      if (window.__slopDimmerActive) {
        deactivate();
        sendResponse({ active: false });
      } else {
        activate(); // async — completion is signaled via analysis_complete message
        sendResponse({ active: "pending" });
      }
    }
    if (msg.type === "set_mode") {
      if (msg.mode === "signal-only") {
        document.body.classList.add("slopdimmer-signal-only");
      } else {
        document.body.classList.remove("slopdimmer-signal-only");
      }
      sendResponse({ ok: true });
    }
    if (msg.type === "get_status") {
      sendResponse({ active: window.__slopDimmerActive });
    }
    return true;
  });

  // SPA support: watch for significant DOM changes and re-analyze new content.
  let spaTimer = null;
  const observer = new MutationObserver((mutations) => {
    if (!window.__slopDimmerActive) return;

    // Only react to added nodes with enough text to matter
    let significantChange = false;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && node.innerText?.length > 80 && !node.closest("[data-slopdimmer-processed]")) {
          significantChange = true;
          break;
        }
      }
      if (significantChange) break;
    }

    if (significantChange) {
      clearTimeout(spaTimer);
      spaTimer = setTimeout(() => {
        analyze();
      }, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
