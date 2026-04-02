---
title: Content Script Module Bundling
date: 2026-04-02
status: approved
---

# Content Script Module Bundling Design

## Problem

Content scripts are failing to load with `SyntaxError: Cannot use import statement outside a module` when trying to use ES6 imports in Chrome MV3. The manifest declares `"type": "module"` but Chrome's content script module resolution is unreliable with relative import paths.

## Solution

Use esbuild to bundle modular content scripts into a single file. This is the standard approach for Chrome extensions using ES modules.

## Architecture

### Input Structure
```
css_picker/css_picker/css_picker/
├── content.js (entry point, imports from ./content/)
├── content/
│   ├── element-highlighter.js (exported class)
│   ├── asset-collector.js (exported class)
│   └── content.js (old duplicate, to be deleted)
```

### Output Structure
```
css_picker/css_picker/css_picker/
├── dist/
│   ├── content.js (bundled output)
│   └── content.js.map (source map for debugging)
├── manifest.json (updated to point to dist/content.js)
└── [original modular files remain unchanged for editing]
```

### Build Process

A single npm script (`npm run build:extension`) will:
1. Read `/content.js` as entry point
2. Resolve and inline all imports from `/content/`
3. Write bundled result to `/dist/content.js`
4. Generate `/dist/content.js.map` for DevTools debugging
5. Keep original files untouched

## Components

### build-extension.js
Simple esbuild wrapper that:
- Bundles `content.js` with all dependencies
- Generates source maps
- Outputs to `dist/` directory
- Can be run via `npm run build:extension`

### Updated manifest.json
Change content script declaration:
```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["dist/content.js"],
    "type": "module"
  }
]
```

## Data Flow

**Before build:**
- Dev edits modular files: `content.js`, `element-highlighter.js`, `asset-collector.js`
- Each file imports/exports cleanly

**During build:**
- esbuild reads imports, traces dependency tree
- Combines all code into single file
- Preserves imports at bundle level (since manifest still declares `"type": "module"`)

**At runtime:**
- Chrome loads single `dist/content.js` as a module
- All classes and functions are bundled inside
- No import errors because everything is in one file

## Source Maps

Source maps are enabled for easier debugging:
- DevTools shows original file names and line numbers (e.g., `asset-collector.js:50`)
- Maps are not loaded into extension (only in DevTools)
- Maps can be excluded from builds in production if needed later

## Testing

After build runs:
1. Open extension in Chrome
2. Visit any webpage
3. Open DevTools Console
4. Verify no `SyntaxError: Cannot use import statement` errors
5. ElementHighlighter and AssetCollector should instantiate without errors

## Files to Change

- **Create:** `build-extension.js` (build script)
- **Create:** `docs/superpowers/specs/` (this spec)
- **Modify:** `package.json` (add build script and esbuild dependency)
- **Modify:** `css_picker/css_picker/css_picker/manifest.json` (point to `dist/content.js`)
- **Delete:** `css_picker/css_picker/css_picker/content/content.js` (duplicate, unused)

## No Breaking Changes

- Modular source files remain unchanged and editable
- Build is optional for development (developers can edit files normally)
- Extension behavior unchanged; only loading mechanism changes
