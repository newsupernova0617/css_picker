# GEMINI.md

## Project Overview

This project is a Chrome extension called **CSS Element Picker**. It allows users to inspect and manipulate web elements in various ways. The extension is built with a frontend using HTML, CSS, and JavaScript, and a backend powered by Flask (Python).

The core functionalities of the extension include:

*   **CSS Picker:** Select any element on a webpage to view and edit its CSS properties.
*   **Tailwind CSS Converter:** Convert the CSS of a selected element to Tailwind CSS classes.
*   **Color Palette:** Sample colors from the webpage and create color palettes.
*   **Console Monitor:** Track console messages and network errors.
*   **Asset Manager:** Collect and download assets from the webpage (images, fonts, stylesheets, etc.).

The extension uses **Clerk** for user authentication and **Stripe** for handling premium subscriptions. The backend is a Flask application that provides a RESTful API for the extension to communicate with.

## Building and Running

### Backend (Flask)

1.  **Install Dependencies:**
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

2.  **Configure Environment:**
    ```bash
    cp .env.example .env
    # Edit .env with your actual values for Clerk, Stripe, and Turso database.
    ```

3.  **Run Development Server:**
    ```bash
    python app.py
    ```
    The backend server will run on `http://localhost:5000`.

### Frontend (Chrome Extension)

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode".
3.  Click on "Load unpacked".
4.  Select the `css_picker` directory.

## Development Conventions

*   **Code Style:** The JavaScript code follows a class-based structure. The code is well-commented, with many comments in Korean.
*   **Authentication:** User authentication is handled by Clerk. The frontend communicates with the Clerk API to sign in and sign out users. The backend verifies the Clerk token to protect its API endpoints.
*   **Premium Features:** The extension has a free plan and a premium plan. Premium features are locked for free users. The `plan-manager.js` script is responsible for managing the user's plan and checking for feature access.
*   **Communication:** The frontend (side panel and content script) and the backend communicate with each other through a combination of Chrome extension messaging and RESTful API calls.
*   **Error Handling:** The code includes `try...catch` blocks for error handling.
*   **Modularity:** The code is organized into different files and classes, each with a specific responsibility. For example, the `SidePanel` class manages the UI of the side panel, the `ElementHighlighter` class is responsible for highlighting elements on the page, and the `TailwindConverter` class handles the conversion of CSS to Tailwind CSS.
