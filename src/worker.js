// Web Worker: loads the sentence-transformer model and handles embedding requests.
// Runs in a separate thread so the UI never freezes.

import { pipeline } from "@huggingface/transformers";

let extractor = null;
let loading = false;
let loadPromise = null;

async function loadModel() {
  if (extractor) return extractor;
  if (loadPromise) return loadPromise;

  loading = true;
  loadPromise = (async () => {
    try {
      extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        {
          dtype: "q8",       // 8-bit quantized — smaller, faster
          device: "wasm",    // Runs everywhere, no WebGPU required
        }
      );
      loading = false;
      return extractor;
    } catch (err) {
      loading = false;
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

// Embed an array of strings, returns array of Float32Array embeddings
async function embed(texts) {
  const model = await loadModel();
  const output = await model(texts, { pooling: "mean", normalize: true });
  const dim = 384;
  const embeddings = [];
  for (let i = 0; i < texts.length; i++) {
    const start = i * dim;
    const vec = new Float32Array(dim);
    for (let j = 0; j < dim; j++) {
      vec[j] = output.data[start + j];
    }
    embeddings.push(vec);
  }
  return embeddings;
}

self.onmessage = async (e) => {
  const { type, id, payload } = e.data;

  if (type === "embed") {
    try {
      const embeddings = await embed(payload.texts);
      // Transfer as regular arrays (structured clone can't handle Float32Array in some contexts)
      self.postMessage({
        type: "embed_result",
        id,
        embeddings: embeddings.map((e) => Array.from(e)),
      });
    } catch (err) {
      self.postMessage({
        type: "error",
        id,
        error: err.message,
      });
    }
  }

  if (type === "status") {
    self.postMessage({
      type: "status_result",
      id,
      status: extractor ? "ready" : loading ? "loading" : "idle",
    });
  }
};
