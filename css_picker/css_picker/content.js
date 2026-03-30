// ===== Content Script Entry Point (ES6 Module) =====
// This wraps the modular content script for Chrome Manifest V3
// Imports from: content/content.js

import { ElementHighlighter } from './content/element-highlighter.js';
import { AssetCollector } from './content/asset-collector.js';

console.log('📌 Content script starting execution...');

// Instantiate classes
const elementHighlighter = new ElementHighlighter();
const assetCollector = new AssetCollector();

// Make instances globally available for debugging and cross-module access
window.elementHighlighter = elementHighlighter;
window.assetCollector = assetCollector;

// CRITICAL: Make assetCollector globally available for ElementHighlighter to access
// ElementHighlighter references assetCollector in its handleMessage method
globalThis.assetCollector = assetCollector;

// Message listener - handles all communication from background/sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  elementHighlighter.handleMessage(message, sender, sendResponse);
});

// Periodic console capture monitoring (if enabled)
setInterval(() => {
  if (elementHighlighter.isConsoleCapturing) {
    // Monitoring logic here
  }
}, 100);

export { elementHighlighter, assetCollector };
