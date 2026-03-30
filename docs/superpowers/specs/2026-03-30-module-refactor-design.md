# CSS Picker Module Refactoring Design
**Date:** 2026-03-30
**Objective:** Split monolithic `sidepanel.js` (8,186 lines) and `content.js` (1,465 lines) into focused, independently maintainable modules using vanilla JavaScript.

---

## Problem Statement

Currently:
- **sidepanel.js** contains 4 classes and 400+ lines of config/constants, making it hard to navigate and maintain
- **content.js** mixes element highlighting and asset collection logic in a single file
- Finding specific functionality requires scanning thousands of lines
- Testing individual features is difficult due to tight coupling
- Adding new features requires understanding the entire file structure

Goal: Improve **navigability** and **maintainability** without changing behavior or adding framework dependencies.

---

## Solution Overview

**Option A: Flat Module Structure** — Split files into focused modules with clear responsibilities, organized by file type (ui classes, utility classes, config).

**Migration approach:**
1. Extract classes and constants into separate files
2. Update imports/dependencies in entry points
3. Verify no behavioral changes through manual testing
4. Clean up inline dependencies

---

## Module Responsibilities

### sidepanel/ directory

| Module | Contains | Approx Lines | Purpose |
|--------|----------|--------------|---------|
| `sidepanel.js` | Script initialization, DOMContentLoaded listener, global instantiation | ~50 | Entry point: Load dependencies, create instances, initialize |
| `sidepanel-ui.js` | `SidePanel` class | ~1200 | Main UI orchestration: DOM queries, event listeners, mode switching (CSS editor, Tailwind, Console, Color Palette) |
| `tailwind-converter.js` | `TailwindConverter` class | ~700 | CSS-to-Tailwind conversion logic: property mapping, special case handling, batch conversion |
| `console-manager.js` | `ConsoleManager` class | ~600 | Console monitoring: message capture, filtering, performance tracking |
| `auth-handler.js` | `handleLoginSuccess()` function, auth UI helpers | ~100 | Authentication flow: login/logout UI updates, user profile display |
| `config.js` | `CSS_DROPDOWN_OPTIONS`, `CSS_CATEGORIES`, `TAILWIND_MAPPINGS`, `SPACING_MAPPINGS`, etc. | ~400 | All shared configuration constants |

### content/ directory

| Module | Contains | Approx Lines | Purpose |
|--------|----------|--------------|---------|
| `content.js` | Message listener setup, script initialization, global instance creation | ~100 | Entry point: Load classes, set up message handlers |
| `element-highlighter.js` | `ElementHighlighter` class | ~960 | Element selection & highlighting: hover/click behavior, CSS extraction, style modification |
| `asset-collector.js` | `AssetCollector` class | ~505 | Asset collection: images, stylesheets, scripts, fonts, videos, audio |

---

## Dependency Graph

```
sidepanel.html
  ├── sidepanel.js (entry point)
  │   ├── sidepanel-ui.js
  │   │   └── config.js
  │   ├── tailwind-converter.js
  │   │   └── config.js (SPACING_MAPPINGS, TAILWIND_MAPPINGS)
  │   ├── console-manager.js
  │   ├── auth-handler.js
  │   │   └── config.js (optional, for any auth constants)
  │   └── Creates: planManager (already exists separately)
  │
  └── (loads CSS, HTML)

manifest.json (content_scripts)
  └── content.js (entry point)
      ├── element-highlighter.js
      │   └── (internal only)
      └── asset-collector.js
          └── (internal only)
```

---

## Implementation Strategy

### Phase 1: Extract Config
1. Create `sidepanel/config.js` with all constants
2. Update `sidepanel.js` to import from config
3. Verify no side effects

### Phase 2: Extract Classes
1. Create `sidepanel/auth-handler.js` (auth function)
2. Create `sidepanel/tailwind-converter.js` (TailwindConverter class)
3. Create `sidepanel/console-manager.js` (ConsoleManager class)
4. Create `sidepanel/sidepanel-ui.js` (SidePanel class)
5. Update entry point `sidepanel.js` to import all

### Phase 3: Update Content Script
1. Create `content/element-highlighter.js` (ElementHighlighter class)
2. Create `content/asset-collector.js` (AssetCollector class)
3. Update entry point `content.js` to import classes

### Phase 4: Verify & Test
1. Manual testing in Chrome extension
2. Verify all features work (CSS picker, Tailwind conversion, Console monitor, Color palette, Assets)
3. Check console for import errors

---

## Code Organization Principles

### Import Order (in entry points)
```javascript
// 1. Config
import { CSS_CATEGORIES, TAILWIND_MAPPINGS, ... } from './config.js';

// 2. Classes (in dependency order)
import { TailwindConverter } from './tailwind-converter.js';
import { ConsoleManager } from './console-manager.js';
import { SidePanel } from './sidepanel-ui.js';
import { handleLoginSuccess } from './auth-handler.js';

// 3. Initialize
const sidePanel = new SidePanel();
```

### Each Module Pattern
```javascript
// At top: imports needed
import { CONFIG } from './config.js';

// Class definition
class ClassName {
  // ...
}

// At bottom: export
export { ClassName };
```

---

## Testing Strategy

**Approach:** Manual functional testing (no unit test framework added)

**Test scenarios:**
- [ ] CSS Picker mode: hover highlights elements, clicking selects, CSS displays correctly
- [ ] Tailwind conversion: CSS → Tailwind conversion works, unconverted properties show correctly
- [ ] Console Monitor: console messages capture, filter, and display
- [ ] Color Palette: color sampling and extraction works
- [ ] Asset Manager: images, stylesheets, scripts, fonts collected
- [ ] Authentication: login/logout flows work
- [ ] Message passing: content script ↔ sidepanel messaging intact

---

## Rollback Plan

If issues arise:
1. Git has clean commit history
2. Each phase can be individually reverted
3. Test after each phase to isolate issues

---

## Benefits

✅ **Navigability:** Easy to find specific functionality (each file ~100-1200 lines)
✅ **Maintainability:** Changes to one feature don't risk breaking others
✅ **Testability:** Individual classes can be reasoned about independently
✅ **Scalability:** Adding new features/converters is straightforward
✅ **No breaking changes:** Behavior identical to current implementation
✅ **No build step required:** Vanilla JS imports work in Chrome extensions

---

## Success Criteria

- All files split into separate modules
- All imports resolve without errors
- All extension features work identically to before
- No behavioral changes to end user
- Code navigability improved (no file >1200 lines for UI, ~700 for converters)
