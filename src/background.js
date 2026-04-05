// Background service worker: lightweight message router.
// Delegates ML inference to an offscreen document (which can run WASM properly).
// Handles scoring locally (pure math, no WASM needed).

import { FILLER_PHRASES } from "./filler.js";
import { scoreSentences } from "./scorer.js";

let offscreenReady = false;
let fillerEmbeddingsCache = null;

async function ensureOffscreen() {
  if (offscreenReady) return;
  try {
    // Check if already exists
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
    });
    if (contexts.length > 0) {
      offscreenReady = true;
      return;
    }
  } catch (e) {
    // getContexts may not be available in older Chrome — just try creating
  }

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["WORKERS"],
    justification: "Run ML model inference for text analysis",
  });
  offscreenReady = true;
}

async function embedViaOffscreen(texts) {
  await ensureOffscreen();
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { target: "offscreen", type: "embed", texts },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response.embeddings);
      }
    );
  });
}

async function getFillerEmbeddings() {
  if (fillerEmbeddingsCache) return fillerEmbeddingsCache;
  fillerEmbeddingsCache = await embedViaOffscreen(FILLER_PHRASES);
  return fillerEmbeddingsCache;
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Don't handle messages meant for the offscreen document
  if (msg.target === "offscreen") return;

  if (msg.type === "embed") {
    embedViaOffscreen(msg.texts)
      .then((embeddings) => sendResponse({ embeddings }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === "get_filler_embeddings") {
    getFillerEmbeddings()
      .then((embeddings) => sendResponse({ embeddings }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === "score") {
    const { sentences, sentenceEmbeddings, fillerEmbeddings, titleEmbedding } = msg;
    try {
      const scores = scoreSentences(
        sentences,
        sentenceEmbeddings,
        fillerEmbeddings,
        titleEmbedding
      );
      sendResponse({ scores });
    } catch (err) {
      sendResponse({ error: err.message });
    }
    return true;
  }
});
