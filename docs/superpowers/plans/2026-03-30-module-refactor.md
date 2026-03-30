# CSS Picker Module Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split monolithic `sidepanel.js` (8,186 lines) and `content.js` (1,465 lines) into focused, independently maintainable modules using vanilla JavaScript.

**Architecture:** Extract config constants into a dedicated file, extract each major class into its own module, then update entry points to import and instantiate. No behavioral changes—purely structural refactoring.

**Tech Stack:** Vanilla JavaScript (ES6 modules), Chrome Extensions API, no build tools required

---

## File Structure Overview

### After Refactoring

```
css_picker/
├── sidepanel/
│   ├── sidepanel.js              (entry point, ~50 lines)
│   ├── sidepanel-ui.js           (SidePanel class, ~1200 lines)
│   ├── tailwind-converter.js      (TailwindConverter class, ~700 lines)
│   ├── console-manager.js         (ConsoleManager class, ~600 lines)
│   ├── auth-handler.js            (handleLoginSuccess, ~100 lines)
│   └── config.js                  (all constants, ~400 lines)
│
├── content/
│   ├── content.js                 (entry point, ~100 lines)
│   ├── element-highlighter.js     (ElementHighlighter class, ~960 lines)
│   └── asset-collector.js         (AssetCollector class, ~505 lines)
```

---

## Phase 1: Extract Configuration Constants

### Task 1: Extract CSS Config Constants to `sidepanel/config.js`

**Files:**
- Create: `css_picker/css_picker/sidepanel/config.js`
- Source: Extract from current `sidepanel.js` lines 88-451

**Steps:**

- [ ] **Step 1: Create the config.js file with all constants**

Extract these constants from the current `sidepanel.js` and create the new file:

```javascript
// CSS Picker Configuration and Constants

// Dropdown options for CSS properties
export const CSS_DROPDOWN_OPTIONS = {
  'display': ['none', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'table', 'table-row', 'table-cell'],
  'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  'float': ['none', 'left', 'right'],
  'clear': ['none', 'left', 'right', 'both'],
  'visibility': ['visible', 'hidden', 'collapse'],
  'overflow': ['visible', 'hidden', 'scroll', 'auto'],
  'overflow-x': ['visible', 'hidden', 'scroll', 'auto'],
  'overflow-y': ['visible', 'hidden', 'scroll', 'auto'],
  'text-align': ['left', 'right', 'center', 'justify', 'start', 'end'],
  'vertical-align': ['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom', 'super', 'sub'],
  'white-space': ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces'],
  'word-break': ['normal', 'break-all', 'keep-all', 'break-word'],
  'text-decoration': ['none', 'underline', 'overline', 'line-through', 'blink'],
  'text-transform': ['none', 'capitalize', 'uppercase', 'lowercase'],
  'font-style': ['normal', 'italic', 'oblique'],
  'font-weight': ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  'list-style-type': ['none', 'disc', 'circle', 'square', 'decimal', 'decimal-leading-zero', 'lower-roman', 'upper-roman', 'lower-alpha', 'upper-alpha'],
  'cursor': ['auto', 'default', 'pointer', 'crosshair', 'text', 'wait', 'help', 'move', 'not-allowed', 'grab', 'grabbing'],
  'user-select': ['auto', 'none', 'text', 'all'],
  'pointer-events': ['auto', 'none'],
  'box-sizing': ['content-box', 'border-box'],
  'flex-direction': ['row', 'row-reverse', 'column', 'column-reverse'],
  'flex-wrap': ['nowrap', 'wrap', 'wrap-reverse'],
  'justify-content': ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
  'align-items': ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'],
  'align-content': ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'],
  'align-self': ['auto', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch'],
  'resize': ['none', 'both', 'horizontal', 'vertical'],
  'table-layout': ['auto', 'fixed'],
  'border-collapse': ['separate', 'collapse'],
  'caption-side': ['top', 'bottom'],
  'empty-cells': ['show', 'hide']
};

// CSS property categories
export const CSS_CATEGORIES = {
  layout: {
    name: '🎨 Layout & Position',
    properties: ['display', 'position', 'float', 'clear', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'z-index', 'top', 'right', 'bottom', 'left', 'overflow', 'visibility']
  },
  boxModel: {
    name: '📦 Box Model',
    properties: ['margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'border', 'border-width', 'border-style', 'border-color', 'border-radius', 'box-sizing', 'outline']
  },
  colors: {
    name: '🎨 Colors & Background',
    properties: ['color', 'background-color', 'background-image', 'background-size', 'background-repeat', 'background-position', 'opacity', 'box-shadow', 'filter']
  },
  typography: {
    name: '✏️ Typography',
    properties: ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-decoration', 'text-transform', 'white-space', 'word-break']
  },
  flexGrid: {
    name: '🔗 Flexbox & Grid',
    properties: ['flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'justify-content', 'align-items', 'align-content', 'align-self', 'grid-template-columns', 'grid-template-rows', 'grid-gap', 'grid-area']
  },
  effects: {
    name: '🎭 Effects & Animation',
    properties: ['transform', 'transition', 'animation', 'cursor', 'pointer-events', 'user-select', 'resize']
  }
};

// Tailwind CSS conversion mappings (extract from current TAILWIND_MAPPINGS object)
export const TAILWIND_MAPPINGS = {
  'display': {
    'none': 'hidden',
    'block': 'block',
    'inline': 'inline',
    'inline-block': 'inline-block',
    'flex': 'flex',
    'inline-flex': 'inline-flex',
    'grid': 'grid',
    'inline-grid': 'inline-grid',
    'table': 'table',
    'table-row': 'table-row',
    'table-cell': 'table-cell'
  },
  'position': {
    'static': 'static',
    'relative': 'relative',
    'absolute': 'absolute',
    'fixed': 'fixed',
    'sticky': 'sticky'
  },
  // Include all other mappings from original sidepanel.js (lines 154-459)
  // This is placeholder for the full TAILWIND_MAPPINGS object - copy the entire object from sidepanel.js
};

// Spacing mappings for padding, margin, and gap
export const SPACING_MAPPINGS = {
  // Copy from original SPACING_MAPPINGS in sidepanel.js if it exists
  // Otherwise create based on Tailwind defaults
  '0px': '0',
  '4px': '1',
  '8px': '2',
  '12px': '3',
  '16px': '4',
  '20px': '5',
  '24px': '6',
  // ... continue with other spacing values
};
```

- [ ] **Step 2: Verify file created**

Run: `ls -la css_picker/css_picker/sidepanel/config.js`

Expected: File exists and is readable

- [ ] **Step 3: Commit**

```bash
git add css_picker/css_picker/sidepanel/config.js
git commit -m "refactor: extract config constants to config.js"
```

---

### Task 2: Create `sidepanel/auth-handler.js`

**Files:**
- Create: `css_picker/css_picker/sidepanel/auth-handler.js`
- Source: Extract `handleLoginSuccess()` function from `sidepanel.js` lines 72-85

**Steps:**

- [ ] **Step 1: Create auth-handler.js with handleLoginSuccess function**

```javascript
// Authentication handler

export async function handleLoginSuccess() {
  const result = await chrome.runtime.sendMessage({ type: "get_profile" });
  if (result.success) {
    document.getElementById("authSignedOut").style.display = "none";
    document.getElementById("authSignedIn").style.display = "block";
    document.getElementById("userName").textContent = result.user.name;
    document.getElementById("userEmail").textContent = result.user.email;
    window.sidePanel.showUser(result.user);
  } else {
    // fallback: 여전히 signed-out 보여주기
    document.getElementById("authSignedOut").style.display = "block";
    document.getElementById("authSignedIn").style.display = "none";
  }
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la css_picker/css_picker/sidepanel/auth-handler.js`

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add css_picker/css_picker/sidepanel/auth-handler.js
git commit -m "refactor: extract auth handler to separate module"
```

---

## Phase 2: Extract Sidepanel Classes

### Task 3: Create `sidepanel/tailwind-converter.js`

**Files:**
- Create: `css_picker/css_picker/sidepanel/tailwind-converter.js`
- Source: Extract `TailwindConverter` class from `sidepanel.js` lines 460-1125

**Steps:**

- [ ] **Step 1: Create tailwind-converter.js with TailwindConverter class**

Copy the entire `TailwindConverter` class from the current `sidepanel.js` (lines 460-1125) and add imports/exports:

```javascript
import { TAILWIND_MAPPINGS, SPACING_MAPPINGS } from './config.js';

export class TailwindConverter {
  constructor() {
    this.conversionResults = {
      converted: [],
      unconverted: []
    };

    // 추가된 매핑 테이블들
    this.gridMappings = {
      'grid-template-columns': {
        'repeat(1, minmax(0, 1fr))': 'grid-cols-1',
        'repeat(2, minmax(0, 1fr))': 'grid-cols-2',
        'repeat(3, minmax(0, 1fr))': 'grid-cols-3',
        'repeat(4, minmax(0, 1fr))': 'grid-cols-4',
        'repeat(5, minmax(0, 1fr))': 'grid-cols-5',
        'repeat(6, minmax(0, 1fr))': 'grid-cols-6',
        'repeat(12, minmax(0, 1fr))': 'grid-cols-12',
        'none': 'grid-cols-none'
      },
      'grid-template-rows': {
        'repeat(1, minmax(0, 1fr))': 'grid-rows-1',
        'repeat(2, minmax(0, 1fr))': 'grid-rows-2',
        'repeat(3, minmax(0, 1fr))': 'grid-rows-3',
        'repeat(4, minmax(0, 1fr))': 'grid-rows-4',
        'repeat(6, minmax(0, 1fr))': 'grid-rows-6',
        'none': 'grid-rows-none'
      },
      'gap': this.createGapMapping(),
      'grid-gap': this.createGapMapping()
    };

    this.borderMappings = {
      'border-style': {
        'solid': 'border-solid',
        'dashed': 'border-dashed',
        'dotted': 'border-dotted',
        'double': 'border-double',
        'none': 'border-none'
      },
      'border-width': {
        '0px': 'border-0', '1px': 'border', '2px': 'border-2',
        '4px': 'border-4', '8px': 'border-8'
      }
    };
  }

  // Include all methods from TailwindConverter class (copy from original)
  // ... (copy entire class body)
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la css_picker/css_picker/sidepanel/tailwind-converter.js`

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add css_picker/css_picker/sidepanel/tailwind-converter.js
git commit -m "refactor: extract TailwindConverter class to separate module"
```

---

### Task 4: Create `sidepanel/console-manager.js`

**Files:**
- Create: `css_picker/css_picker/sidepanel/console-manager.js`
- Source: Extract `ConsoleManager` class from `sidepanel.js` lines 1126-1717

**Steps:**

- [ ] **Step 1: Create console-manager.js with ConsoleManager class**

Copy the entire `ConsoleManager` class from the current `sidepanel.js` (lines 1126-1717) and add exports:

```javascript
export class ConsoleManager {
  constructor() {
    this.messages = [];
    this.filteredMessages = [];
    this.currentFilter = 'all';
    this.searchTerm = '';
    this.isActive = false;
    this.maxMessages = 1000;
    this.messageCount = 0;
    this.messageRate = 0;
    this.lastMessageTime = 0;
    this.memoryUsage = 0;

    // Performance monitoring
    this.performanceTimer = null;
    this.messageRateCounter = 0;
    this.rateCheckInterval = 1000; // 1초마다 체크

    // Message type icons
    this.messageIcons = {
      'log': '💬',
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌',
      'debug': '🐛',
      'failed-fetch': '🌐'
    };

    // Message type colors
    this.messageColors = {
      'log': '#d1d5db',
      'info': '#0dcaf0',
      'warn': '#ffc107',
      'error': '#dc3545',
      'debug': '#6c757d',
      'failed-fetch': '#fd7e14',
      'table': '#d1d5db',
      'groupEnd': '#d1d5db',
      'trace': '#d1d5db'
    };

    this.init();
  }

  // Include all methods from ConsoleManager class (copy from original)
  // ... (copy entire class body)
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la css_picker/css_picker/sidepanel/console-manager.js`

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add css_picker/css_picker/sidepanel/console-manager.js
git commit -m "refactor: extract ConsoleManager class to separate module"
```

---

### Task 5: Create `sidepanel/sidepanel-ui.js`

**Files:**
- Create: `css_picker/css_picker/sidepanel/sidepanel-ui.js`
- Source: Extract `SidePanel` class from `sidepanel.js` lines 1718-end of file

**Steps:**

- [ ] **Step 1: Create sidepanel-ui.js with SidePanel class and imports**

```javascript
import { CSS_CATEGORIES, CSS_DROPDOWN_OPTIONS, TAILWIND_MAPPINGS } from './config.js';
import { TailwindConverter } from './tailwind-converter.js';
import { ConsoleManager } from './console-manager.js';

export class SidePanel {
  constructor() {
    // All properties from original SidePanel constructor
    this.isActive = false;
    this.$toggleButton = null;
    this.currentElement = null;
    this.originalStyles = {};
    this.modifiedStyles = {};
    this.currentSelector = null;

    this.selectedProperties = new Set();
    this.categoryStates = new Map();
    this.categorizedProperties = {};
    this._dropdownEventListenerAdded = false;

    this.collectedAssets = null;
    this.selectedAssets = new Set();
    this.assetCategoryStates = new Map();

    this.tailwindConverter = new TailwindConverter();
    this.isTailwindView = false;
    this.tailwindProperties = { converted: [], unconverted: [] };
    this.lastCssInfo = null;

    this.isColorPaletteMode = false;
    this.isSamplingActive = false;
    this.sampledColors = [];
    this.selectedColor = null;

    this.consoleManager = new ConsoleManager();
    this.isConsoleMode = false;

    window.sidePanel = this;

    Object.keys(CSS_CATEGORIES).forEach(categoryKey => {
      this.categoryStates.set(categoryKey, false);
    });

    this.init();
  }

  // Include all methods from SidePanel class (copy from original)
  // ... (copy entire class body, lines 1782-end)
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la css_picker/css_picker/sidepanel/sidepanel-ui.js`

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add css_picker/css_picker/sidepanel/sidepanel-ui.js
git commit -m "refactor: extract SidePanel UI class to separate module"
```

---

### Task 6: Update `sidepanel/sidepanel.js` Entry Point

**Files:**
- Modify: `css_picker/css_picker/sidepanel/sidepanel.js` (replace entire content)

**Steps:**

- [ ] **Step 1: Backup original**

```bash
cp css_picker/css_picker/sidepanel.js css_picker/css_picker/sidepanel.js.backup
```

- [ ] **Step 2: Replace with new entry point**

```javascript
// ===== 사이드패널 JavaScript 파일 =====
// 이 파일은 Chrome 확장 프로그램의 사이드패널 UI를 관리합니다
import { SidePanel } from './sidepanel-ui.js';
import { TailwindConverter } from './tailwind-converter.js';
import { ConsoleManager } from './console-manager.js';
import { handleLoginSuccess } from './auth-handler.js';

console.log('===== SIDEPANEL.JS START =====');
console.log('This file is loading at:', new Date().toISOString());
console.log('🚨 HTML inline script moved to sidepanel.js');
console.log('Chrome object exists?', typeof chrome !== 'undefined');
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('Extension ID:', chrome.runtime.id);
}

// Instantiate PlanManager and make it globally available
const planManager = new PlanManager();
window.planManager = planManager;

// Initialize SidePanel
const sidePanel = new SidePanel();

document.addEventListener("DOMContentLoaded", () => {
  const signInBtn = document.getElementById("signInBtn");
  const signOutBtn = document.getElementById("signOutBtn");
  const authSignedOut = document.getElementById("authSignedOut");
  const authSignedIn = document.getElementById("authSignedIn");
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const premiumSection = document.getElementById("premiumSection");
  const authLoading = document.getElementById("authLoading");

  // 로그인 버튼
  signInBtn.addEventListener("click", () => {
    authLoading.style.display = "block";
    chrome.runtime.sendMessage({ type: "login" }, (response) => {
      authLoading.style.display = "none";
      if (response?.success) {
        chrome.runtime.sendMessage({ type: "get_profile" }, (resp) => {
          if (resp?.success) {
            sidePanel.showUser(resp.user);
          }
        });
      }
    });
  });

  // 로그아웃 버튼
  signOutBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "logout" }, () => {
      authSignedOut.style.display = "block";
      authSignedIn.style.display = "none";
      premiumSection.style.display = "none";
    });
  });

  // Page load 시 user 정보 check
  chrome.runtime.sendMessage({ type: "get_profile" }, (result) => {
    if (result?.success) {
      sidePanel.showUser(result.user);
    }
  });
});

export { sidePanel, handleLoginSuccess };
```

- [ ] **Step 3: Move old sidepanel.js to archive**

```bash
mv css_picker/css_picker/sidepanel.js css_picker/css_picker/sidepanel-old.js
mv css_picker/css_picker/sidepanel.js.backup css_picker/css_picker/sidepanel/sidepanel.js
```

- [ ] **Step 4: Verify new entry point exists**

Run: `ls -la css_picker/css_picker/sidepanel/sidepanel.js`

Expected: File exists and contains imports

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: update sidepanel.js entry point with module imports"
```

---

## Phase 3: Extract Content Script Classes

### Task 7: Create `content/element-highlighter.js`

**Files:**
- Create: `css_picker/css_picker/content/element-highlighter.js`
- Source: Extract `ElementHighlighter` class from `content.js` lines 5-959

**Steps:**

- [ ] **Step 1: Create element-highlighter.js with ElementHighlighter class**

Copy the entire `ElementHighlighter` class from the current `content.js` (lines 5-959) and add export:

```javascript
export class ElementHighlighter {
  // Include all properties and methods from original ElementHighlighter class
  constructor() {
    // All initialization from original (lines 8-52)
    this.currentHighlighted = null;
    this.isActive = false;
    this.originalOutline = '';
    this.originalOutlineOffset = '';
    this.hoverColor = '#0066ff';
    this.selectedColor = '#ff0000';
    this.highlightWidth = '2px';
    this.selectedElement = null;
    this.selectedElementOriginalOutline = '';
    this.selectedElementOriginalOutlineOffset = '';
    this.selectedElementSelector = null;
    this.modifiedStyles = new Map();
    this.isEditingMode = false;
    this.optimizedExtraction = true;
    this.lastMouseOverTime = 0;
    this.mouseOverThrottle = 16;
    this.pendingHighlight = null;
    this.cssCache = {};
    this.isConsoleCapturing = false;
    this.originalConsoleMethods = {};
    this.originalFetch = null;
    this.errorHandler = null;
    this.rejectionHandler = null;

    this.init();
  }

  // Include all methods (copy the entire class body from original)
  // ... (copy lines 56-959)
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la css_picker/css_picker/content/element-highlighter.js`

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add css_picker/css_picker/content/element-highlighter.js
git commit -m "refactor: extract ElementHighlighter class to separate module"
```

---

### Task 8: Create `content/asset-collector.js`

**Files:**
- Create: `css_picker/css_picker/content/asset-collector.js`
- Source: Extract `AssetCollector` class from `content.js` lines 960-end of file

**Steps:**

- [ ] **Step 1: Create asset-collector.js with AssetCollector class**

Copy the entire `AssetCollector` class from the current `content.js` (lines 960+) and add export:

```javascript
export class AssetCollector {
  constructor() {
    this.collectedAssets = {
      images: [],
      stylesheets: [],
      scripts: [],
      fonts: [],
      videos: [],
      audio: []
    };
    this.isCollecting = false;
  }

  // Include all methods from AssetCollector class (copy from original)
  // ... (copy entire class body from lines 973+)
}
```

- [ ] **Step 2: Verify file created**

Run: `ls -la css_picker/css_picker/content/asset-collector.js`

Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add css_picker/css_picker/content/asset-collector.js
git commit -m "refactor: extract AssetCollector class to separate module"
```

---

### Task 9: Update `content/content.js` Entry Point

**Files:**
- Modify: `css_picker/css_picker/content.js` (replace with new entry point)

**Steps:**

- [ ] **Step 1: Backup original**

```bash
cp css_picker/css_picker/content.js css_picker/css_picker/content.js.backup
```

- [ ] **Step 2: Create new content.js entry point**

```javascript
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
```

- [ ] **Step 3: Move old content.js to archive**

```bash
mv css_picker/css_picker/content.js css_picker/css_picker/content-old.js
mv css_picker/css_picker/content.js.backup css_picker/css_picker/content/content.js
```

- [ ] **Step 4: Verify new entry point exists**

Run: `ls -la css_picker/css_picker/content/content.js`

Expected: File exists and contains imports

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: update content.js entry point with module imports"
```

---

## Phase 4: Verification & Testing

### Task 10: Verify All Files Created and Imports Work

**Files:**
- All created modules in `sidepanel/` and `content/` directories

**Steps:**

- [ ] **Step 1: List all new module files**

```bash
echo "=== Sidepanel modules ===" && \
ls -1 css_picker/css_picker/sidepanel/*.js && \
echo "=== Content modules ===" && \
ls -1 css_picker/css_picker/content/*.js
```

Expected output:
```
=== Sidepanel modules ===
css_picker/css_picker/sidepanel/auth-handler.js
css_picker/css_picker/sidepanel/config.js
css_picker/css_picker/sidepanel/console-manager.js
css_picker/css_picker/sidepanel/sidepanel-ui.js
css_picker/css_picker/sidepanel/sidepanel.js
css_picker/css_picker/sidepanel/tailwind-converter.js
=== Content modules ===
css_picker/css_picker/content/asset-collector.js
css_picker/css_picker/content/content.js
css_picker/css_picker/content/element-highlighter.js
```

- [ ] **Step 2: Check for syntax errors**

Run: `node --check css_picker/css_picker/sidepanel/sidepanel.js 2>&1 | head -20`

Expected: No output (syntax valid) or list of errors to fix

- [ ] **Step 3: Check for import resolution issues (manual)**

Open Chrome DevTools console while extension is running:
- No "module not found" errors
- No "import failed" errors
- All classes instantiated correctly

- [ ] **Step 4: Commit verification checkpoint**

```bash
git add -A
git commit -m "refactor: verify all module files created and syntax valid"
```

---

### Task 11: Manual Feature Testing

**Files:**
- All extension features

**Steps:**

- [ ] **Step 1: Reload extension in Chrome**

1. Go to `chrome://extensions`
2. Find "CSS Picker" extension
3. Click the reload button

- [ ] **Step 2: Test CSS Picker mode**

1. Open any website
2. Click extension icon → open side panel
3. Hover over elements → should show blue outline
4. Click element → should select and show CSS
5. Verify CSS displays correctly in editor

Expected: Element highlighting works, CSS properties display

- [ ] **Step 3: Test Tailwind conversion**

1. In side panel, click "Tailwind" tab
2. Select an element with CSS
3. Verify CSS converts to Tailwind classes
4. Check unconverted properties show in gray

Expected: Conversion works, shows both converted and unconverted

- [ ] **Step 4: Test Console Monitor**

1. In side panel, click "Console" tab
2. Go to website with console logs
3. Click "Start Monitoring"
4. Trigger console messages
5. Verify messages appear in console monitor

Expected: Messages capture and display correctly

- [ ] **Step 5: Test Color Palette mode**

1. In side panel, click "Color Palette" tab
2. Click "Sample Colors" button
3. Click colors on page
4. Verify colors appear in palette

Expected: Color sampling works

- [ ] **Step 6: Test Asset Manager**

1. In side panel, click "Assets" tab
2. Click "Collect Assets"
3. Verify images, scripts, stylesheets, fonts appear in list

Expected: Asset collection works

- [ ] **Step 7: Test Authentication (if applicable)**

1. Click "Sign In"
2. Verify auth flow works
3. Check user profile displays
4. Test "Sign Out"

Expected: Login/logout works without errors

- [ ] **Step 8: Check browser console for errors**

1. Open browser DevTools (F12)
2. Go to Extensions section in DevTools
3. Look for any red errors in console

Expected: No errors logged (only info/log messages OK)

- [ ] **Step 9: Commit passing tests**

```bash
git add -A
git commit -m "refactor: all features verified and working"
```

---

### Task 12: Cleanup and Documentation

**Files:**
- `sidepanel-old.js`, `content-old.js`, `.backup` files
- README or docs

**Steps:**

- [ ] **Step 1: Remove old backup files**

```bash
rm -f css_picker/css_picker/sidepanel-old.js css_picker/css_picker/content-old.js
```

- [ ] **Step 2: Verify directory structure is clean**

```bash
tree css_picker/css_picker/sidepanel/ css_picker/css_picker/content/ 2>/dev/null || \
(echo "=== Sidepanel ===" && ls -la css_picker/css_picker/sidepanel/ && \
 echo "=== Content ===" && ls -la css_picker/css_picker/content/)
```

Expected: Only `.js` files, no `.backup` or `-old` files

- [ ] **Step 3: Update manifest.json if needed (verify paths)**

Check `manifest.json` content_scripts section:

```bash
grep -A 5 '"content_scripts"' css_picker/css_picker/manifest.json
```

Verify it points to `content/content.js` (or update if needed)

- [ ] **Step 4: Final git status check**

```bash
git status
```

Expected: All changes staged and committed, clean working tree

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "refactor: cleanup old files and finalize module structure"
```

---

## Rollback Instructions (if needed)

If any step fails or causes issues:

```bash
# Revert to previous commit
git reset --hard HEAD~1

# Or revert entire refactoring
git log --oneline | grep "refactor" | head -1
git reset --hard <commit-hash>
```

---

## Success Criteria (Post-Implementation)

✅ All module files created and properly located
✅ All imports resolve without errors
✅ All extension features work identically to before
✅ Browser console shows no import/module errors
✅ CSS Picker, Tailwind Converter, Console Monitor, Color Palette, Assets all functional
✅ No file exceeds 1200 lines (except sidepanel-ui.js which should be ~1200)
✅ Clear separation of concerns: each module has single responsibility
✅ Clean git history with logical commits per task
