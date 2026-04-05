const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

async function build() {
  // Clean dist
  if (fs.existsSync(path.resolve(__dirname, "dist"))) {
    fs.rmSync(path.resolve(__dirname, "dist"), { recursive: true });
  }
  fs.mkdirSync(path.resolve(__dirname, "dist"), { recursive: true });

  // Bundle the offscreen document script (runs the ML model in a proper DOM context)
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, "src/offscreen.js")],
    bundle: true,
    outfile: path.resolve(__dirname, "dist/offscreen.js"),
    format: "esm",
    target: "esnext",
    platform: "browser",
    minify: false,
    sourcemap: false,
  });

  // Copy WASM files BEFORE patching (the patch reads the .mjs file)
  const onnxDir = path.resolve(__dirname, "node_modules/onnxruntime-web/dist");
  if (fs.existsSync(onnxDir)) {
    const needed = [
      "ort-wasm-simd-threaded.wasm",
      "ort-wasm-simd-threaded.mjs",
      "ort-wasm-simd-threaded.jsep.wasm",
      "ort-wasm-simd-threaded.jsep.mjs",
    ];
    for (const file of needed) {
      const src = path.resolve(onnxDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.resolve(__dirname, "dist", file));
      }
    }
  }

  // Post-process: patch the ONNX runtime to use local extension paths instead of CDN/import.meta.url.
  // Chrome extension CSP blocks external script loads, blob: URLs, and dynamic import().
  let offscreenCode = fs.readFileSync(path.resolve(__dirname, "dist/offscreen.js"), "utf8");

  // 1. Replace the CDN URL fallback
  offscreenCode = offscreenCode.replace(
    /ONNX_ENV\.wasm\.wasmPaths = `https:\/\/cdn\.jsdelivr\.net[^`]*`;/g,
    'ONNX_ENV.wasm.wasmPaths = self.__slopdimmer_wasm_base || "./";\n'
  );

  // 2. Replace ALL import.meta.url with extension base URL
  offscreenCode = offscreenCode.replace(
    /import\.meta\.url/g,
    '(self.__slopdimmer_wasm_base || location.href)'
  );

  // 3. Read the ONNX WASM initializer .mjs file and inline it.
  //    The ONNX runtime tries to dynamically import() this file, which Chrome CSP blocks.
  //    By reading it and embedding it as a function, we skip the dynamic import entirely.
  const wasmMjsPath = path.resolve(__dirname, "dist/ort-wasm-simd-threaded.jsep.mjs");
  let wasmMjsCode = fs.readFileSync(wasmMjsPath, "utf8");
  // The .mjs file also uses import.meta.url — replace with location.href
  wasmMjsCode = wasmMjsCode.replace(/import\.meta\.url/g, 'location.href');
  // Strip Node.js-specific code that uses top-level await and node modules
  wasmMjsCode = wasmMjsCode.replace(/export default\s+/, '');
  wasmMjsCode = wasmMjsCode.replace(/await import\(["']module["']\)/g, '{}');
  wasmMjsCode = wasmMjsCode.replace(/await import\(["']worker_threads["']\)/g, '({workerData: null})');
  wasmMjsCode = wasmMjsCode.replace(/import\.meta/g, '({url: location.href})');
  // Remove Node.js fs/path requires that may appear
  wasmMjsCode = wasmMjsCode.replace(/require\(["']fs["']\)/g, '({})');
  wasmMjsCode = wasmMjsCode.replace(/require\(["']path["']\)/g, '({})');
  // The wrapper must be async since the inlined code uses top-level await
  const inlinedWasmInit = `(async function() {
    ${wasmMjsCode}
    return ortWasmThreaded;
  })()`;

  // 4. Replace the dynamic import function Qp with one that returns the inlined module.
  //    Qp was: async (e) => (await import(e)).default
  //    We replace it to return the pre-inlined WASM initializer, ignoring the URL arg.
  offscreenCode = offscreenCode.replace(
    /Qp = async \(e\) => \(await import\(\s*\/\*webpackIgnore:true\*\/\s*e\s*\)\)\.default/,
    `Qp = async (e) => ${inlinedWasmInit}`
  );

  // If the above pattern didn't match (already patched by previous build), try the fetch version
  offscreenCode = offscreenCode.replace(
    /Qp = async \(e\) => \{\s*try \{\s*const resp[\s\S]*?SlopDimmer: WASM loader[\s\S]*?\}/,
    `Qp = async (e) => ${inlinedWasmInit}`
  );

  // 5. Replace the hardcoded Hugging Face remote host with a local path placeholder.
  //    The actual chrome.runtime.getURL is set at runtime in offscreen.js,
  //    but we need a fetch-intercepting approach since the URL isn't known at build time.
  //    Instead, inject a fetch wrapper at the top of the file that redirects HF URLs to local.
  const fetchInterceptor = `
// SlopDimmer: intercept fetch calls to huggingface.co and redirect to local model files
(function() {
  const _origFetch = self.fetch;
  self.fetch = function(url, opts) {
    let urlStr = (typeof url === 'string') ? url : (url?.url || url?.href || String(url));
    if (urlStr.includes('huggingface.co') && urlStr.includes('all-MiniLM-L6-v2')) {
      // Extract the filename from the HF URL
      const parts = urlStr.split('/');
      // Find "resolve/main/" and get everything after
      const resolveIdx = parts.indexOf('resolve');
      if (resolveIdx >= 0 && resolveIdx + 2 < parts.length) {
        const localPath = parts.slice(resolveIdx + 2).join('/');
        const localUrl = (self.__slopdimmer_wasm_base || './') + 'models/Xenova/all-MiniLM-L6-v2/' + localPath;
        return _origFetch.call(self, localUrl, opts);
      }
    }
    return _origFetch.call(self, url, opts);
  };
})();
`;
  offscreenCode = fetchInterceptor + offscreenCode;

  fs.writeFileSync(path.resolve(__dirname, "dist/offscreen.js"), offscreenCode);

  // Bundle the background service worker (lightweight message router)
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, "src/background.js")],
    bundle: true,
    outfile: path.resolve(__dirname, "dist/background.js"),
    format: "esm",
    target: "esnext",
    platform: "browser",
    minify: false,
    sourcemap: false,
    external: ["@huggingface/transformers"],
  });

  // Content script (no npm imports)
  fs.copyFileSync(
    path.resolve(__dirname, "src/content.js"),
    path.resolve(__dirname, "dist/content.js")
  );

  // Copy model files
  function copyDirRecursive(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      const srcPath = path.resolve(src, entry);
      const destPath = path.resolve(dest, entry);
      if (fs.statSync(srcPath).isDirectory()) {
        copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  copyDirRecursive(
    path.resolve(__dirname, "models"),
    path.resolve(__dirname, "dist/models")
  );

  // Copy static files
  for (const file of ["popup.html", "popup.js", "styles.css", "offscreen.html", "offscreen-init.js"]) {
    const src = path.resolve(__dirname, "src", file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.resolve(__dirname, "dist", file));
    }
  }

  // Copy manifest — add model files to web_accessible_resources
  const manifest = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "manifest.json"), "utf8")
  );
  manifest.background.service_worker = "background.js";
  manifest.content_scripts[0].js = ["content.js"];
  manifest.content_scripts[0].css = ["styles.css"];
  manifest.action.default_popup = "popup.html";
  manifest.web_accessible_resources = [{
    resources: ["models/*", "ort-wasm-simd-threaded.*"],
    matches: ["<all_urls>"]
  }];
  fs.writeFileSync(
    path.resolve(__dirname, "dist/manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  // Copy icons
  const iconsDir = path.resolve(__dirname, "icons");
  const distIconsDir = path.resolve(__dirname, "dist/icons");
  if (!fs.existsSync(distIconsDir)) fs.mkdirSync(distIconsDir, { recursive: true });
  for (const file of fs.readdirSync(iconsDir)) {
    fs.copyFileSync(path.resolve(iconsDir, file), path.resolve(distIconsDir, file));
  }

  console.log("Build complete → dist/");
  const files = fs.readdirSync(path.resolve(__dirname, "dist"));
  for (const f of files) {
    const stat = fs.statSync(path.resolve(__dirname, "dist", f));
    const size = stat.isDirectory() ? "dir" : `${(stat.size / 1024).toFixed(0)}KB`;
    console.log(`  ${f} (${size})`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
