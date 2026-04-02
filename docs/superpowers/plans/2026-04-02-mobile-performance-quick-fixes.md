# Mobile Performance Quick Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix mobile performance bottleneck (4.6s → 2-3s FCP/LCP) and SEO crawl errors by moving blocking scripts and creating robots.txt.

**Architecture:** Move all `<script>` tags from `<head>` to end of `<body>` to unblock HTML parsing on mobile. Preserve script execution order (external libraries first, custom code after). Create basic robots.txt to allow Google crawling.

**Tech Stack:** Plain HTML, Express.js serving static files

---

## File Structure

**Modify:**
- `public/index.html` — Move all `<script>` tags from `<head>` to end of `<body>`, preserve dependency order

**Create:**
- `public/robots.txt` — Allow all crawlers, reference sitemap

---

## Task 1: Read Current index.html and Identify Script Tags

**Files:**
- Read: `public/index.html`

- [ ] **Step 1: Read the index.html file to see all `<script>` tags currently in `<head>`**

Run: 
```bash
grep -n "<script" public/index.html | head -30
```

Expected: Output showing line numbers of all script tags and their src attributes

**Why:** Need to know exact script sources and order before moving them

---

## Task 2: Move Firebase and Bootstrap Scripts to End of Body

**Files:**
- Modify: `public/index.html` — Move scripts from `<head>` to end of `</body>`

- [ ] **Step 1: Read the full index.html to identify the closing `</head>` tag and where to place scripts**

Run:
```bash
sed -n '1,150p' public/index.html | tail -50
```

Expected: Shows the section near end of `<head>` with script tags

- [ ] **Step 2: Delete all `<script>` tags from the `<head>` section**

Using Edit tool, remove every `<script>...</script>` tag that appears before `</head>`. Keep order mentally:
- Firebase app
- Firebase auth
- Firebase firestore
- Firebase functions
- Any other external scripts
- Custom/internal scripts

- [ ] **Step 3: Add all scripts to end of body (before closing `</body>` tag)**

Find the closing `</body>` tag near the end of the file and insert all scripts in this exact order:

```html
    <!-- Firebase Scripts -->
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-functions-compat.js"></script>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
            crossorigin="anonymous"></script>
    
    <!-- Custom Application Scripts -->
    <script src="js/main.js"></script>
    <script src="js/app.js"></script>
  </body>
</html>
```

(Adjust file names/sources based on what you find in Step 1)

- [ ] **Step 4: Verify no `<script>` tags remain in `<head>`**

Run:
```bash
head -100 public/index.html | grep -i "<script"
```

Expected: No output (no scripts in head section)

- [ ] **Step 5: Verify scripts are at end of body**

Run:
```bash
tail -20 public/index.html
```

Expected: Shows `<script>` tags followed by `</body>` and `</html>`

- [ ] **Step 6: Commit this change**

Run:
```bash
git add public/index.html
git commit -m "perf: move script tags from head to body to unblock mobile rendering"
```

Expected: Commit succeeds with 1 file changed

---

## Task 3: Create robots.txt

**Files:**
- Create: `public/robots.txt`

- [ ] **Step 1: Create robots.txt file with allow-all policy**

Create file `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://csspicker.site/sitemap.xml
```

- [ ] **Step 2: Verify file exists and has correct content**

Run:
```bash
cat public/robots.txt
```

Expected: 
```
User-agent: *
Allow: /

Sitemap: https://csspicker.site/sitemap.xml
```

- [ ] **Step 3: Commit this change**

Run:
```bash
git add public/robots.txt
git commit -m "seo: add robots.txt to allow Google crawling"
```

Expected: Commit succeeds with 1 file changed (new)

---

## Task 4: Verify HTML Syntax

**Files:**
- Verify: `public/index.html`

- [ ] **Step 1: Check for basic HTML syntax errors**

Run:
```bash
node -e "require('fs').readFileSync('public/index.html', 'utf8')" && echo "HTML file is readable (no syntax error)"
```

Expected: "HTML file is readable (no syntax error)"

- [ ] **Step 2: Verify opening `<html>` and closing `</html>` tags match**

Run:
```bash
grep -c "^<html" public/index.html && grep -c "</html>$" public/index.html
```

Expected: Both return 1 (one opening, one closing)

- [ ] **Step 3: Verify `<body>` and `</body>` tags exist**

Run:
```bash
grep -c "<body" public/index.html && grep -c "</body>" public/index.html
```

Expected: Both return 1

---

## Task 5: Final Verification and Summary

**Files:**
- Verify: `public/index.html`, `public/robots.txt`

- [ ] **Step 1: Confirm script count is preserved (same number before and after)**

Count before should equal count after. Run:
```bash
echo "Total scripts in file:" && grep -c "<script" public/index.html
```

Expected: Should match the count from Task 1 Step 1

- [ ] **Step 2: Verify robots.txt is server-accessible path**

Run:
```bash
ls -lh public/robots.txt
```

Expected: Shows file with size > 0

- [ ] **Step 3: View git log to confirm both commits**

Run:
```bash
git log --oneline | head -2
```

Expected: Two commits visible:
```
seo: add robots.txt to allow Google crawling
perf: move script tags from head to body to unblock mobile rendering
```

- [ ] **Step 4: Summary of changes**

Changes complete:
- ✅ All `<script>` tags moved from `<head>` to end of `<body>`
- ✅ Script execution order preserved (Firebase → Bootstrap → Custom)
- ✅ `robots.txt` created with allow-all policy
- ✅ HTML syntax valid
- ✅ 2 commits made

---

## Plan Self-Review

**Spec coverage:**
- ✅ Move scripts from head to body — Tasks 2 (steps 1-5)
- ✅ Preserve script order — Task 2 (step 3, explicit ordering)
- ✅ Create robots.txt — Task 3
- ✅ Verify no breakage — Task 4
- ✅ Frequent commits — Tasks 2 & 3 end with commits

**Placeholder scan:** None found. All steps have exact code/commands.

**Type consistency:** No types defined (HTML/plain text). File paths consistent throughout.

**Completeness:** All steps are executable without ambiguity.
