import * as wasm from "./ergo-lib-browser.asm.js";
import * as ergolibbrowser from "./ergo-lib-asm-bg.js";

// Placing this on the window allows the webpacks externals to map imports to it as a global
window.ergolibbrowser = ergolibbrowser;
window.wasm = wasm;

export {
  ergolibbrowser,
  wasm
};

export default ergolibbrowser;
