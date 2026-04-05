// Set WASM base path before the module loads — prevents CDN fetches
self.__slopdimmer_wasm_base = location.href.replace(/\/[^/]*$/, '/');
