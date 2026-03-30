// 웹페이지의 HTML 요소들에 마우스를 올렸을 때 테두리를 그어주는 content script
// 이 스크립트는 모든 웹페이지에 삽입되어 실행됩니다 (content script)
import { ElementHighlighter } from './element-highlighter.js';
import { AssetCollector } from './asset-collector.js';

console.log('📌 Content script starting execution...');

// Instantiate classes
const elementHighlighter = new ElementHighlighter();
const assetCollector = new AssetCollector();

// Make instances globally available for debugging
window.elementHighlighter = elementHighlighter;
window.assetCollector = assetCollector;

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
