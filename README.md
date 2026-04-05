# SlopDimmer

A Chrome extension that visually dims low-information filler text so you can focus on the sentences that actually say something. Runs entirely on your machine.

## What it does

SlopDimmer analyzes text on any webpage, scores each paragraph for information density, and adjusts its visual opacity. High-signal content (concrete findings, action items, specific data, direct questions) stays at full brightness. Low-signal filler (preamble, hedging, stakes inflation, vacuous conclusions) gets dimmed.

You still see the full original text. Nothing is deleted, rewritten, or summarized. The typography just makes the signal obvious.

## How to install

1. Download or clone this repo
2. Run `npm install && npm run build`
3. Open Chrome and go to `chrome://extensions/`
4. Turn on **Developer mode** (top right)
5. Click **Load unpacked** and select the `dist/` folder

Click the SlopDimmer icon on any page and hit **Dim the slop**.

## How it works

Each paragraph is scored using a combination of:

- **Pattern matching** against ~60 known filler patterns (preamble phrases, empty hedging, stakes inflation, vacuous conclusions, performative flattery, etc.)
- **Semantic similarity** to a bank of filler phrase embeddings, computed using a sentence-transformer model (all-MiniLM-L6-v2)
- **Specificity detection** for concrete signals: file paths, URLs, code references, error codes, API endpoints, command-line syntax
- **Structural analysis**: direct questions and numbered list items get a signal boost; long sentences with no concrete markers get penalized

The sentence-transformer model (~22MB, quantized ONNX) is bundled inside the extension. Inference runs via ONNX Runtime compiled to WebAssembly. Everything executes in an offscreen document so the page UI never freezes.

## Limitations

This is an experiment, not a polished product. Specific things to know:

- **The scoring is heuristic, not magic.** The filler pattern matching works well for common AI-generated slop patterns. It will miss filler that doesn't match known patterns. It will occasionally dim something that matters or leave something bright that doesn't.
- **It's tuned for English.** The filler patterns and the embedding model are English-only.
- **It's tuned for AI slop specifically.** The filler pattern bank targets the kind of padding that LLMs produce — "it's worth noting," "the implications are profound," "going forward." It's less effective on human-written filler, which tends to be more varied and contextual.
- **First activation is slow.** The ONNX model takes a few seconds to initialize on first use. After that, scoring is fast.
- **The model is small.** all-MiniLM-L6-v2 is a 22M-parameter sentence transformer. Its embeddings are useful for redundancy and similarity detection but not strong enough for nuanced "does this sentence add information?" judgments. The pattern matching does most of the heavy lifting.
- **Page compatibility varies.** The extension extracts text from common page structures (GitHub issues, blog posts, articles). Unusual DOM structures may not get analyzed.
- **"Signal-only" mode is aggressive.** It hides everything below the brightness threshold, which means you might miss context.

## Notes

The extension makes no network requests after installation. The ML model weights are bundled in the extension package. Text analysis happens locally.

## Technical details

- Chrome Manifest V3
- Sentence embeddings: Xenova/all-MiniLM-L6-v2 (Apache 2.0), quantized to int8 ONNX
- Inference: ONNX Runtime Web (WASM backend) via @huggingface/transformers
- Scoring: hybrid pattern-matching + embedding similarity + specificity heuristics
- Architecture: background service worker (message router) + offscreen document (ML inference) + content script (DOM manipulation)

## License

MIT
