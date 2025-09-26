# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CSS Element Picker is a Chrome extension with SaaS backend that provides CSS inspection, manipulation, and analysis tools. The architecture consists of:

1. **Chrome Extension** (`css_picker/`) - Manifest V3 extension with side panel interface
2. **Flask Backend** (`backend/`) - Python Flask API with Stripe payments and Clerk authentication
3. **Authentication** - Clerk for user management
4. **Payments** - Stripe for premium subscriptions (one-time lifetime payment)
5. **Database** - Turso (libSQL) for user data and payment records

## Development Commands

### Backend (Flask)
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Set up environment
cp .env.example .env  # Configure with actual API keys

# Run development server
python app.py  # Runs on http://localhost:5000

# Database setup (Turso)
turso db create css-picker
turso db show css-picker
turso db tokens create css-picker
```

### Chrome Extension
```bash
# Development installation
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the css_picker/ directory

# No build process required - direct development
```

### Testing
- Extension testing requires manual testing in Chrome browser
- Backend API testing can be done with curl/Postman
- No automated test suite currently exists

## Architecture

### Chrome Extension Structure
```
css_picker/
├── manifest.json          # Manifest V3 configuration
├── background.js          # Service worker (main extension logic)
├── sidepanel.html/.js     # Side panel UI and logic
├── content.js             # Content script (injected into web pages)
├── auth-content.js        # Authentication-specific content script
├── plan-manager.js        # Subscription plan management
├── clerk-config.js        # Clerk authentication configuration
├── console-injector.js    # Console monitoring injection script
└── lib/                   # External libraries (html2canvas, jszip, bootstrap)
```

### Core Extension Classes
- **BackgroundService** (`background.js`) - Main service worker managing extension lifecycle
- **ElementHighlighter** (`content.js`) - DOM element inspection and CSS extraction
- **AssetCollector** (`content.js`) - Web asset collection and analysis
- **SidePanel** (`sidepanel.js`) - UI management and user interactions
- **PlanManager** (`plan-manager.js`) - Feature access control based on subscription

### Communication Flow
1. **User Action** → Side Panel UI
2. **Side Panel** → Background Script (chrome.runtime.sendMessage)
3. **Background** → Content Script (chrome.tabs.sendMessage)
4. **Content Script** → DOM manipulation/analysis
5. **Content Script** → Background → Side Panel (results)

### Flask Backend Structure
```
backend/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── templates/            # HTML templates (landing pages)
├── static/              # Static assets (images, icons)
└── README.md            # Backend documentation
```

### Key Backend Components
- **DatabaseManager** class - Turso database operations
- **Clerk authentication** - JWT token verification
- **Stripe integration** - One-time lifetime payment processing
- **API endpoints** - User management, usage tracking, payments

### Authentication Flow
1. User signs in through Clerk in extension
2. Extension receives JWT token from Clerk
3. Extension stores token in Chrome storage
4. Backend verifies Clerk JWT for API requests
5. Plan manager syncs user subscription status

### Database Schema
- **users** table - User profiles, plan status, Stripe customer IDs
- **payments** table - One-time payment records
- **usage_logs** table - Feature usage analytics (planned)

## Key Integration Points

### Chrome Extension APIs Used
- `chrome.sidePanel` - Side panel management
- `chrome.tabs` - Tab communication and script injection
- `chrome.runtime` - Message passing between contexts
- `chrome.downloads` - Asset download functionality
- `chrome.storage` - User preferences and authentication data

### External Dependencies
- **html2canvas** - Screenshot and color sampling capabilities
- **jszip** - Asset bundling for downloads
- **bootstrap** - UI framework for side panel
- **Clerk** - Authentication provider
- **Stripe** - Payment processing

### Security Considerations
- Content Security Policy (CSP) restrictions in manifest
- JWT token verification for API access
- Stripe webhook signature verification
- Chrome extension host permissions limited to necessary domains

### Development Notes
- Code contains extensive Korean comments for maintainability
- Performance optimizations implemented for DOM traversal and CSS extraction
- Error handling includes graceful degradation when services unavailable
- Console monitoring uses script injection to bypass CSP restrictions

## Common Development Tasks

### Adding New Features
1. Update `plan-manager.js` to define feature availability
2. Implement feature logic in appropriate script (content/background/sidepanel)
3. Add UI controls in `sidepanel.html/.js`
4. Update backend API if server-side functionality needed

### Debugging Extension
- Use Chrome DevTools for extension pages
- Background script debugging: chrome://extensions → "Service Worker" link
- Content script debugging: DevTools on target webpage
- Message passing debugging: Check console logs with specific prefixes (📨, 🔄, etc.)

### Backend API Development
- All endpoints require Clerk JWT authentication
- Use Turso database manager for persistence
- Stripe webhooks handle payment status updates
- CORS enabled for Chrome extension origin access