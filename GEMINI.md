# Project Overview: CSS Picker Pro

This project is a Chrome extension called "CSS Picker Pro". It's a professional CSS inspection tool for web developers that allows them to extract, edit, and convert CSS to Tailwind CSS. It also includes features for asset management, color sampling, and console monitoring.

## Key Components

### 1. Chrome Extension (Frontend)

The core of the project is a Chrome extension built with Manifest V3.

*   **Core Functionality:** Allows users to inspect elements on a webpage, view their CSS properties, and edit them in real-time.
*   **Key Features:**
    *   **CSS Inspector:** Highlights elements and displays their CSS properties, neatly categorized into sections like Layout, Box Model, Colors, and Typography.
    *   **Tailwind CSS Converter:** Provides a powerful feature to convert standard CSS properties into Tailwind CSS utility classes.
    *   **Asset Manager:** Collects and manages various assets from the inspected web page, such as images and stylesheets.
    *   **Color Palette:** A tool for sampling, managing, and generating color palettes from the page.
    *   **Console Monitor:** Captures and displays console messages from the inspected page, helping with debugging.
    *   **Authentication:** Integrates with Firebase Authentication for user sign-in via Google.
*   **Technologies:**
    *   Manifest V3
    *   Vanilla JavaScript
    *   HTML/CSS for the side panel UI
    *   **Libraries:** `html2canvas.min.js`, `jszip.min.js`, `petite-vue.iife.js`, `bootstrap.bundle.min.js`
    *   Firebase SDK for frontend authentication.

### 2. Backend (Firebase)

The backend is built on the Firebase platform, utilizing its serverless capabilities.

*   **Platform:** Firebase Functions (Node.js).
*   **Functionality:**
    *   Handles user authentication logic.
    *   Manages user data and subscription status using Firestore.
    *   Likely processes payments and manages subscriptions through Stripe integration.
*   **Technologies:**
    *   Firebase Functions
    *   Firebase Admin SDK
    *   Cloud Firestore (as the database)
    *   Stripe (for payments and subscriptions)

### 3. Web Hosting

*   The project's landing page and other static content are hosted using **Firebase Hosting**.

## Project Structure

*   `css_picker/`: Contains the source code for the Chrome extension.
    *   `css_picker/`: The actual extension code.
        *   `manifest.json`: Defines the extension's properties and permissions.
        *   `service-worker.js`: The background script for the extension.
        *   `content.js`: The script injected into web pages to handle element interaction.
        *   `sidepanel.html`, `sidepanel.js`, `sidepanel.css`: The UI and logic for the extension's side panel.
*   `functions/`: Contains the Node.js code for the Firebase Functions backend.
*   `public/`: Contains the files for the public-facing website, hosted on Firebase Hosting.
*   `firestore.rules`: Defines the security rules for the Firestore database.
*   `firebase.json`: Configuration file for Firebase deployment (Hosting and Functions).
