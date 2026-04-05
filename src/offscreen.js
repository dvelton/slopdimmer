// Offscreen document: runs the ML model in a real DOM context.
// MV3 service workers can't run WASM properly, but offscreen documents can.

import { pipeline, env } from "@huggingface/transformers";

// Load model from bundled files inside the extension, not from Hugging Face.
env.allowLocalModels = true;
env.useBrowserCache = false;
env.remoteHost = chrome.runtime.getURL("/models/");
env.remotePathTemplate = "{model}/";
env.localModelPath = chrome.runtime.getURL("/models/");

let extractor = null;
let loadPromise = null;

async function loadModel() {
  if (extractor) return extractor;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
        dtype: "q8",
        device: "wasm",
        session_options: {
          wasmPaths: chrome.runtime.getURL("/"),
        },
      });
      return extractor;
    } catch (err) {
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

async function embed(texts) {
  const model = await loadModel();
  const batchSize = 32;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const output = await model(batch, { pooling: "mean", normalize: true });
    const dim = 384;
    for (let j = 0; j < batch.length; j++) {
      const start = j * dim;
      const vec = [];
      for (let k = 0; k < dim; k++) {
        vec.push(output.data[start + k]);
      }
      allEmbeddings.push(vec);
    }
  }

  return allEmbeddings;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.target !== "offscreen") return false;

  if (msg.type === "embed") {
    embed(msg.texts)
      .then((embeddings) => sendResponse({ embeddings }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});
