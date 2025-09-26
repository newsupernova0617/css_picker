# Project Overview

This project is a Chrome extension called "CSS Picker" with a Python Flask backend. The extension allows users to select elements on a web page, view their CSS properties, and extract them. It also includes features for asset collection (images, stylesheets, etc.) and console message monitoring.

The backend handles user authentication via Clerk, Stripe payments for premium subscriptions, and stores user data in a Turso database.

## Key Technologies

**Chrome Extension (Frontend):**

*   **Manifest V3:** The extension is built using the latest Chrome extension manifest version.
*   **JavaScript:** The core logic is written in vanilla JavaScript.
*   **HTML/CSS:** The side panel and other UI components are built with HTML and CSS.
*   **Libraries:**
    *   `html2canvas.min.js`: For taking screenshots of the page.
    *   `jszip.min.js`: For creating zip files.
    *   `petite-vue.iife.js`: A lightweight Vue framework for reactive UI.

**Backend:**

*   **Python:** The backend is written in Python.
*   **Flask:** A lightweight web framework for Python.
*   **Clerk:** For user authentication.
*   **Stripe:** For handling payments.
*   **Turso:** A distributed SQLite database for data persistence.
*   **Gunicorn:** As a production web server.

## Architecture

The project is divided into two main parts:

1.  **`css_picker/`:** This directory contains the Chrome extension's source code.
    *   `manifest.json`: Defines the extension's structure, permissions, and capabilities.
    *   `background.js`: The service worker that handles background tasks, such as event handling, communication with the backend, and managing the extension's state.
    *   `content.js`: A content script that is injected into web pages to handle element highlighting, CSS extraction, and other interactions with the page content.
    *   `sidepanel.html`, `sidepanel.js`, `sidepanel.css`: The UI for the extension's side panel, where users can see the extracted CSS and other information.
2.  **`backend/`:** This directory contains the Flask backend application.
    *   `run.py`: The entry point for the Flask application.
    *   `app/`: This directory contains the core application logic, including routes, authentication, database models, and services.
    *   `requirements.txt`: Lists the Python dependencies for the backend.

# Building and Running

## Chrome Extension

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode".
3.  Click "Load unpacked" and select the `css_picker/css_picker` directory.

## Backend

1.  **Install Dependencies:**
    ```bash
    cd backend
    pip install -r requirements.txt
    ```
2.  **Configure Environment:**
    *   Create a `.env` file based on `.env.example` and fill in the required values for your Turso database, Stripe, and Clerk accounts.
3.  **Run the Development Server:**
    ```bash
    python run.py
    ```
    The server will run on `http://localhost:5000`.

# Development Conventions

*   The project uses a modular structure, with the frontend and backend clearly separated.
*   The Chrome extension uses a service worker for background tasks and content scripts for interacting with web pages.
*   The backend uses a RESTful API to communicate with the Chrome extension.
*   The backend uses environment variables for configuration, which are loaded from a `.env` file.
*   The project includes a `README.md` file with detailed instructions for setting up and running the backend.
*   The frontend JavaScript code is well-commented, with explanations in both English and Korean.
