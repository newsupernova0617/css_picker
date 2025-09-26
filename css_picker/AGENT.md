# AGENT.md

This file gives Codex (GPT-5) quick guidance when working inside this repository.

## Project Snapshot
- Product: CSS Element Picker - Chrome extension plus Flask backend for authentication (Clerk), one-time payments (Stripe), and Turso/libSQL persistence.
- Top-level directories:
  - `css_picker/` - Manifest V3 extension sources (service worker, content scripts, side panel UI, libs).
  - `backend/` - Flask API (see `app.py`, `requirements.txt`, `.env.example`).
  - `brand-kit/`, `.claude/`, and other helper assets/docs (leave untouched unless asked).
- Notable docs: `CLAUDE.md` and `GEMINI.md` contain sibling-agent briefs; keep them conceptually aligned when updating shared project facts.

## Daily Operating Rules
- Use the Codex CLI harness conventions (PowerShell backend). Always provide `workdir` and avoid inline `cd` chains; run complex shells via `powershell.exe -Command`.
- Default to ASCII when editing; only add comments when they clarify non-obvious logic. Never remove user changes you did not make.
- Planning tool: skip for trivial tasks, otherwise outline 2+ steps and keep it updated as you work.
- Respect sandbox policies: current configuration is danger-full-access, network enabled, approval requests disabled (never). Adapt if the environment message changes in the future.
- Prefer `rg` or `rg --files` for searches; fall back only when unavailable.

## Working With The Codebase
- Chrome extension (`css_picker/`):
  - Core files: `manifest.json`, `background.js`, `content.js`, `sidepanel.html`, `sidepanel.js`, `sidepanel.css`, auth helpers (`clerk-config.js`, `auth-content.js`).
  - Expect extensive Korean comments; preserve tone and intent.
  - Manual testing: load unpacked in Chrome (`chrome://extensions`). No build step.
- Backend (`backend/`):
  - Install deps via `pip install -r requirements.txt`.
  - Copy `.env.example` to `.env`, then fill Clerk/Stripe/Turso keys.
  - Start dev server: `python app.py` (listens on `http://localhost:5000`).
  - No automated tests; validate endpoints with curl or Postman when feasible.

## Quality And Validation
- Run available linters/tests when you touch the backend; otherwise explain why testing was skipped.
- For extension changes, outline manual verification steps (for example: reload extension, trigger feature) if you cannot execute them.
- Document risk areas, regressions, or follow-up work in your final note. Suggest next steps (tests, manual flows, commits) only when they make sense.

Stay concise, keep a teammate tone, and reference files with clickable paths like `file.js:42`.
