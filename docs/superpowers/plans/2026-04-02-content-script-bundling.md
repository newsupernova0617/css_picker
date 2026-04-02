# Content Script Module Bundling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the `SyntaxError: Cannot use import statement outside a module` error by bundling modular content scripts with esbuild.

**Architecture:** Add esbuild as a build dependency, create a simple build script that bundles `content.js` and its imports into a single output file, update the manifest to reference the bundled output, and delete the duplicate unused file.

**Tech Stack:** esbuild (bundler), npm (scripts)

---

## Task 1: Add esbuild to dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Read current package.json**

```bash
cat /home/yj437/coding/css_picker/package.json
```

- [ ] **Step 2: Install esbuild**

```bash
cd /home/yj437/coding/css_picker && npm install --save-dev esbuild
```

Expected: esbuild added to `devDependencies` in package.json and `package-lock.json` updated.

- [ ] **Step 3: Verify installation**

```bash
cd /home/yj437/coding/css_picker && npx esbuild --version
```

Expected: Shows esbuild version (e.g., `0.20.0` or similar)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add esbuild for content script bundling"
```

---

## Task 2: Create build script

**Files:**
- Create: `css_picker/css_picker/build-extension.js`

- [ ] **Step 1: Create the build script**

Create file `/home/yj437/coding/css_picker/css_picker/build-extension.js` with:

```javascript
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const inputFile = path.join(__dirname, 'css_picker', 'content.js');
const outputDir = path.join(__dirname, 'css_picker', 'dist');
const outputFile = path.join(outputDir, 'content.js');

// Ensure dist directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

esbuild
  .build({
    entryPoints: [inputFile],
    bundle: true,
    outfile: outputFile,
    sourcemap: true,
    platform: 'browser',
    target: 'es2020',
    external: ['chrome'], // chrome API is global, don't bundle it
  })
  .then(() => {
    console.log('✅ Extension bundled successfully!');
    console.log(`   Input: ${inputFile}`);
    console.log(`   Output: ${outputFile}`);
    console.log(`   Map: ${outputFile}.map`);
  })
  .catch((err) => {
    console.error('❌ Build failed:', err);
    process.exit(1);
  });
```

- [ ] **Step 2: Verify file was created**

```bash
ls -la /home/yj437/coding/css_picker/css_picker/build-extension.js
```

Expected: File exists and is readable

- [ ] **Step 3: Test the script (dry run)**

```bash
cd /home/yj437/coding/css_picker && node css_picker/build-extension.js
```

Expected: Output showing "✅ Extension bundled successfully!" and paths to input/output files

- [ ] **Step 4: Verify dist files were created**

```bash
ls -la /home/yj437/coding/css_picker/css_picker/dist/
```

Expected: Shows `content.js` and `content.js.map` files

- [ ] **Step 5: Verify bundled content looks correct**

```bash
head -20 /home/yj437/coding/css_picker/css_picker/dist/content.js
```

Expected: Shows bundled code (not import statements), starts with minified/bundled content

- [ ] **Step 6: Commit the build script**

```bash
git add css_picker/build-extension.js
git commit -m "build: create esbuild script for content script bundling

Bundles content.js with element-highlighter.js and asset-collector.js
dependencies into a single file with source maps for debugging."
```

---

## Task 3: Add npm build script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Read package.json to see current scripts**

```bash
cat /home/yj437/coding/css_picker/package.json
```

Expected: Shows existing scripts object

- [ ] **Step 2: Update package.json to add build script**

Edit `/home/yj437/coding/css_picker/package.json` and add to the `"scripts"` section:

```json
"build:extension": "node css_picker/build-extension.js"
```

(The full scripts section might look like:)

```json
"scripts": {
  "start": "...",
  "test": "...",
  "build:extension": "node css_picker/build-extension.js"
}
```

- [ ] **Step 3: Verify the script runs**

```bash
cd /home/yj437/coding/css_picker && npm run build:extension
```

Expected: Output shows "✅ Extension bundled successfully!" 

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "build: add npm script for bundling content scripts

npm run build:extension now bundles the extension's content scripts."
```

---

## Task 4: Update manifest.json to reference bundled output

**Files:**
- Modify: `css_picker/css_picker/css_picker/manifest.json`

- [ ] **Step 1: Read current manifest**

```bash
cat /home/yj437/coding/css_picker/css_picker/css_picker/manifest.json
```

Expected: Shows manifest with content_scripts section pointing to `"js": ["content.js"]`

- [ ] **Step 2: Update content_scripts in manifest.json**

In `/home/yj437/coding/css_picker/css_picker/css_picker/manifest.json`, find the `"content_scripts"` array and change:

```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["dist/content.js"],
    "type": "module"
  }
]
```

(Changed from `"js": ["content.js"]` to `"js": ["dist/content.js"]`)

- [ ] **Step 3: Verify the change**

```bash
grep -A 5 '"content_scripts"' /home/yj437/coding/css_picker/css_picker/css_picker/manifest.json
```

Expected: Shows `"js": ["dist/content.js"]`

- [ ] **Step 4: Commit**

```bash
git add css_picker/css_picker/manifest.json
git commit -m "config: update manifest to load bundled content script

Changes content_scripts to reference dist/content.js (bundled output)
instead of content.js (modular source)."
```

---

## Task 5: Delete duplicate unused file

**Files:**
- Delete: `css_picker/css_picker/css_picker/content/content.js`

- [ ] **Step 1: Verify the file exists and is unused**

```bash
cat /home/yj437/coding/css_picker/css_picker/css_picker/content/content.js
```

Expected: Shows small content.js (duplicate of modular entry point)

- [ ] **Step 2: Verify it's not referenced anywhere**

```bash
grep -r "content/content\.js" /home/yj437/coding/css_picker/css_picker/css_picker/ --include="*.json" --include="*.js" --include="*.html"
```

Expected: No results (file is not referenced)

- [ ] **Step 3: Delete the file**

```bash
rm /home/yj437/coding/css_picker/css_picker/css_picker/content/content.js
```

- [ ] **Step 4: Verify deletion**

```bash
ls -la /home/yj437/coding/css_picker/css_picker/css_picker/content/
```

Expected: Shows only `asset-collector.js` and `element-highlighter.js` (not content.js)

- [ ] **Step 5: Commit**

```bash
git add -u css_picker/css_picker/content/
git commit -m "cleanup: remove duplicate content.js from content/ folder

This file was an unused duplicate. The modular entry point is at
css_picker/css_picker/content.js, which gets bundled to dist/content.js."
```

---

## Task 6: Test the bundled extension in Chrome

**Files:**
- No files to modify (testing only)

- [ ] **Step 1: Open Chrome and navigate to extension management**

Go to: `chrome://extensions/`

- [ ] **Step 2: Reload the CSS Picker extension**

Click the reload icon (circular arrow) on the CSS Picker extension card.

Expected: Extension reloads without errors in Chrome UI

- [ ] **Step 3: Visit a test webpage**

Go to any website (e.g., memo.naver.com, wikipedia.org, google.com)

- [ ] **Step 4: Open DevTools Console**

Press `F12` → Go to Console tab

- [ ] **Step 5: Check for the specific error**

Look for `SyntaxError: Cannot use import statement outside a module`

Expected: **This error should NOT appear**

- [ ] **Step 6: Verify module initialization worked**

In the console, type:

```javascript
window.elementHighlighter
```

Expected: Returns the ElementHighlighter instance (not undefined)

- [ ] **Step 7: Verify asset collector is available**

In the console, type:

```javascript
window.assetCollector
```

Expected: Returns the AssetCollector instance (not undefined)

- [ ] **Step 8: Check for any console errors**

Look at the console messages. You should see:

```
📌 Content script starting execution...
```

Expected: This message appears, no error messages above it

- [ ] **Step 9: Final verification - test extension functionality**

Move your mouse over any element on the page. 

Expected: Element should highlight with a blue border (ElementHighlighter working)

- [ ] **Step 10: Create test result note (not a commit)**

If all tests pass, you've successfully fixed the issue. Note:
- No SyntaxError on import
- Content script initialized successfully
- Both classes are accessible globally
- Element highlighting works

---

## Summary

All tasks complete when:
1. ✅ esbuild installed as dev dependency
2. ✅ build-extension.js script created and working
3. ✅ `npm run build:extension` works and produces bundled output
4. ✅ manifest.json references `dist/content.js`
5. ✅ Duplicate `content/content.js` deleted
6. ✅ Extension loads without import errors in Chrome
7. ✅ ElementHighlighter and AssetCollector classes accessible
8. ✅ Element highlighting functionality works

All changes committed to git.
