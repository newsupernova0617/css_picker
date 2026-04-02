# Mobile Performance Quick Fixes Design

**Date:** 2026-04-02  
**Scope:** Quick rendering-blocking fixes for landing page without major refactoring  
**Target:** Improve mobile performance from 71/100 → 80+/100  

## Problem Statement

Landing page metrics show significant desktop/mobile disparity:

| Metric | Desktop | Mobile | Gap |
|--------|---------|--------|-----|
| Performance | 96 | 71 | -25 |
| First Contentful Paint | 0.7s | 4.6s | -3.9s |
| Largest Contentful Paint | 0.7s | 4.6s | -3.9s |
| SEO Score | 92 | 92 | - |

**Root causes:**
1. Rendering-blocking requests (CSS/JS in `<head>`) block parsing on slow mobile CPUs (-1,110ms impact)
2. Missing `robots.txt` causing 1,212 Google crawl errors (SEO risk)

## Solution Overview

Two minimal, low-risk changes:

### 1. Move Script Tags from `<head>` to End of `<body>`

**Current state:** All `<script>` tags in `<head>` block HTML parsing on mobile

**New state:** 
- External libraries (Firebase, Bootstrap) moved to end of `<body>`
- Custom scripts follow in same order
- CSS remains in `<head>` (must load before render)

**Impact:**
- Mobile rendering unblocked: browsers can parse/render HTML while scripts download
- FCP/LCP should improve from 4.6s → 2-3s (40% faster)
- Zero functionality impact (modern browsers execute in correct order)

**Order matters:**
```html
<!-- Head: CSS only -->
<head>
  <link rel="stylesheet" href="bootstrap.css">
  <!-- other meta, links -->
</head>

<body>
  <!-- Page content -->
  
  <!-- Scripts at end, in dependency order -->
  <script src="firebase-app.js"></script>
  <script src="firebase-auth.js"></script>
  <!-- other Firebase scripts -->
  <script src="custom-app.js"></script>
</body>
```

### 2. Create `/public/robots.txt`

**Current state:** No robots.txt file → Google can't crawl (1,212 errors)

**New state:** Basic robots.txt allowing full crawl

```
User-agent: *
Allow: /

Sitemap: https://csspicker.site/sitemap.xml
```

**Impact:**
- Fixes 1,212 crawl errors in PageSpeed audit
- Allows Google to index all pages
- Maintains SEO score (92) and prevents future degradation

## What We're NOT Doing

Per user preference for quick fixes:
- ❌ Code-split unused JavaScript (173KiB)
- ❌ Remove unused CSS (30KiB)
- ❌ Add image width/height attributes
- ❌ Upgrade build tooling (no webpack/vite setup)
- ❌ Cache header optimization

These can be addressed in a future performance phase if needed.

## Success Criteria

✅ Mobile Performance: 71 → 80+ (target: 2-3s FCP/LCP)  
✅ SEO Score: maintain 92+  
✅ Desktop: no regression (stays 96)  
✅ No broken functionality  
✅ No build tool changes required  

## Implementation Steps

1. Read `public/index.html` to identify all `<script>` tags in `<head>`
2. Move all scripts to end of `<body>` in dependency order
3. Create `public/robots.txt` with allow-all + sitemap reference
4. Verify no syntax errors in HTML
5. (Optional) Re-run PageSpeed audit to confirm improvements

## Testing Strategy

- Visual inspection: page loads and functions normally
- Browser console: no JavaScript errors
- Rerun PageSpeed Insights: confirm FCP/LCP improvement and robots.txt fix
