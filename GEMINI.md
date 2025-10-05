# CSS Picker Pro: Technical Documentation

## 1. Introduction

Welcome to the technical documentation for CSS Picker Pro, a professional CSS inspection tool for web developers. This document provides a comprehensive overview of the project's architecture, components, and implementation details. It is intended for developers who want to contribute to the project, understand its inner workings, or integrate with it.

### 1.1. Project Overview

CSS Picker Pro is a Chrome extension that allows users to inspect elements on a webpage, view their CSS properties, and edit them in real-time. It also includes advanced features like a color palette, console monitor, asset manager, and a CSS to Tailwind CSS converter. The extension is built with Manifest V3 and vanilla JavaScript, and it uses Firebase for backend services like authentication, database, and hosting.

### 1.2. Target Audience

This documentation is intended for:

*   **Frontend Developers:** Who want to contribute to the Chrome extension's UI and features.
*   **Backend Developers:** Who want to work on the Firebase Functions and database.
*   **Technical Writers:** Who need to understand the project to create user-facing documentation.
*   **QA Engineers:** Who need to understand the project's functionality for testing purposes.

## 2. System Architecture

CSS Picker Pro is a client-server application with the following main components:

*   **Chrome Extension (Frontend):** The user-facing part of the application, which runs in the user's browser.
*   **Firebase (Backend):** A suite of cloud services that provide the backend infrastructure for the application.
*   **Lemon Squeezy (Payment Gateway):** A third-party service for handling premium subscriptions.

### 2.1. Architecture Diagram

```
[Chrome Extension] <--> [Firebase Authentication]
      |
      |
      v
[Firebase Functions] <--> [Firestore Database]
      |
      |
      v
[Lemon Squeezy API]
```

### 2.2. Technology Stack

*   **Frontend:**
    *   **Manifest V3:** The latest version of the Chrome extension platform.
    *   **JavaScript (ES6+):** The primary programming language for the extension.
    *   **HTML5 & CSS3:** For the structure and styling of the side panel UI.
    *   **Libraries:**
        *   `html2canvas.min.js`: For taking screenshots of the page.
        *   `jszip.min.js`: For creating ZIP files.
        *   `petite-vue.iife.js`: A lightweight Vue framework for reactive UI.
        *   `bootstrap.bundle.min.js`: A popular CSS framework for building responsive, mobile-first sites.
*   **Backend:**
    *   **Firebase Functions:** A serverless framework for running backend code in response to events.
    *   **Node.js:** The runtime environment for the Firebase Functions.
    *   **Firebase Admin SDK:** For interacting with Firebase services from the backend.
    *   **Cloud Firestore:** A NoSQL document database for storing user data.
*   **Hosting:**
    *   **Firebase Hosting:** For hosting the project's landing page and other static content.
*   **Payment:**
    *   **Lemon Squeezy:** A payment gateway for handling subscriptions.

## 3. Frontend (Chrome Extension)

The Chrome extension is the core of the CSS Picker Pro application. It is responsible for the user interface, interacting with the web page, and communicating with the backend.

### 3.1. File Structure

The main files for the Chrome extension are located in the `css_picker/css_picker` directory.

*   `manifest.json`: The manifest file for the Chrome extension.
*   `service-worker.js`: The background script for the extension.
*   `content.js`: The content script that is injected into web pages.
*   `sidepanel.html`: The HTML file for the extension's side panel.
*   `sidepanel.js`: The JavaScript file for the side panel's logic.
*   `sidepanel.css`: The CSS file for the side panel's styling.
*   `lib/`: A directory containing third-party libraries.
*   `assets/`: A directory containing images and icons.

### 3.2. Key Components

#### 3.2.1. Manifest (`manifest.json`)

The `manifest.json` file defines the structure and configuration of the Chrome extension.

*   **`manifest_version`:** 3 (the latest version).
*   **`name`:** "CSS Element Picker".
*   **`permissions`:** Declares the permissions required by the extension, such as `tabs`, `sidePanel`, `scripting`, `downloads`, `activeTab`, `storage`, `identity`, and `alarms`.
*   **`background`:** Specifies the `service-worker.js` as the background script.
*   **`side_panel`:** Defines `sidepanel.html` as the default path for the side panel.
*   **`content_scripts`:** Injects `content.js` into all web pages.
*   **`web_accessible_resources`:** Makes certain resources (like libraries and CSS files) accessible to web pages.

#### 3.2.2. Service Worker (`service-worker.js`)

The `service-worker.js` is the background script that runs independently of the web page. It is responsible for:

*   **Firebase Initialization:** It initializes the Firebase app, Firebase Authentication, and Firestore.
*   **Authentication:** It handles user authentication using Google Sign-In. The `signInWithGoogle` function uses `signInWithPopup` to open a Google Sign-In popup. The `getUserProfile` function retrieves the user's profile from Firebase Authentication and Firestore.
*   **State Management:** It maintains the state of the application, such as whether the CSS picker is active (`isPickerActive`) and the ID of the active tab (`activeTabId`).
*   **Event Handling:** It listens for and responds to various events, such as messages from other parts of the extension.
*   **Communication:** The `chrome.runtime.onMessage` listener handles messages from the side panel and content scripts, allowing for communication between the different parts of the extension. It processes messages for actions like `login`, `logout`, `get_profile`, `picker_enable`, `picker_disable`, and `download_assets`.

#### 3.2.3. Content Script (`content.js`)

The `content.js` script is injected into every web page that the user visits. It is responsible for the direct interaction with the page's content.

*   **`ElementHighlighter` Class:** This is the main class that handles the core functionality of the CSS picker.
    *   **Element Highlighting:** It highlights elements on the page as the user hovers over them and when they are selected.
    *   **CSS Extraction:** When an element is clicked, it extracts its computed CSS properties, filters out default values, and sends the information to the side panel.
    *   **Style Editing:** It applies style changes to the elements on the page in real-time as the user edits them in the side panel.
*   **`AssetCollector` Class:** This class is responsible for collecting assets from the page.
    *   It collects images, stylesheets, scripts, fonts, videos, and audio.
    *   It sends the collected asset information to the side panel.
*   **Console Monitoring:**
    *   It injects the `console-injector.js` script into the page to intercept console messages.
    *   It sends the captured console messages to the service worker, which then forwards them to the side panel.

#### 3.2.4. Side Panel (`sidepanel.html`, `sidepanel.js`, `sidepanel.css`)

The side panel is the main user interface for the extension.

*   **`sidepanel.html`:** Defines the structure of the side panel, including the different sections for CSS properties, color palette, console monitor, and asset manager.
*   **`sidepanel.css`:** Provides the styling for the side panel.
*   **`sidepanel.js`:** Contains the logic for the side panel, including:
    *   **UI management:** Handling the display and interaction of the different UI elements.
    *   **Feature implementation:** Implementing the logic for the CSS picker, color palette, console monitor, and asset manager.
    *   **Communication:** Communicating with the service worker and the content script.
    *   **Tailwind CSS conversion:** The `TailwindConverter` class handles the conversion of CSS properties to Tailwind CSS classes.

#### 3.2.5. Plan Manager (`planManager.js`)

The `planManager.js` file is responsible for managing the user's subscription plan and controlling access to premium features.

*   **`PlanManager` Class:** This class encapsulates all the logic for plan management.
    *   **Initialization:** It initializes Firebase and Stripe.
    *   **Plan Listening:** It listens for real-time changes to the user's subscription status in the Firestore database.
    *   **Feature Access Control:** The `canUseFeature` method checks if a user has access to a specific premium feature based on their current plan.
    *   **Checkout:** The `redirectToCheckout` method redirects the user to a Stripe checkout page to upgrade their plan.

## 4. Backend (Firebase)

The backend of the application is built on Firebase, a platform that provides a suite of cloud services.

### 4.1. File Structure

The backend code is located in the `functions` directory.

*   `index.js`: The main file for the Firebase Functions.
*   `package.json`: Defines the dependencies for the backend.
*   `firestore.rules`: Defines the security rules for the Firestore database.

### 4.2. Key Components

#### 4.2.1. Firebase Functions (`functions/index.js`)

The `functions/index.js` file contains the serverless functions that power the backend.

*   **`createCheckout`:** Creates a checkout session with Lemon Squeezy for premium subscriptions.
*   **`handleWebhook`:** Handles webhooks from Lemon Squeezy to update the user's subscription status.
*   **`handleBeforeUserCreated`:** Creates a new user document in Firestore when a new user signs up.
*   **`getUserProfile`:** A callable function that returns the user's profile information.

#### 4.2.2. Firestore (`firestore.rules`)

Firestore is used as the database for the application. The `firestore.rules` file defines the security rules for the database, ensuring that users can only access their own data.

*   **`users` collection:** Stores user information, including their email, subscription status, and other details.
*   **`webhooks` collection:** Logs all webhook events from Lemon Squeezy.

## 5. Getting Started

### 5.1. Prerequisites

*   [Node.js](https://nodejs.org/) (version 20 or higher)
*   [Firebase CLI](https://firebase.google.com/docs/cli)
*   A Google account for Firebase authentication.
*   A Lemon Squeezy account for payment processing.

### 5.2. Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/css-picker-pro.git
    cd css-picker-pro
    ```

2.  **Install frontend dependencies:**
    The frontend has no dependencies to install with npm.

3.  **Install backend dependencies:**
    ```bash
    cd functions
    npm install
    ```

### 5.3. Configuration

1.  **Firebase:**
    *   Create a new project on the [Firebase Console](https://console.firebase.google.com/).
    *   Enable Firebase Authentication (with Google Sign-In), Firestore, and Firebase Hosting.
    *   Get your Firebase project configuration and add it to the `sidepanel.js` file.
    *   Set up a `.firebaserc` file with your project ID.

2.  **Lemon Squeezy:**
    *   Get your API key and webhook secret from the Lemon Squeezy dashboard.
    *   Set them as environment variables for your Firebase Functions.

### 5.4. Running the Extension

1.  **Load the extension in Chrome:**
    *   Open Chrome and go to `chrome://extensions`.
    *   Enable "Developer mode".
    *   Click "Load unpacked" and select the `css_picker/css_picker` directory.

2.  **Run the backend locally:**
    ```bash
    cd functions
    firebase emulators:start --only functions
    ```

## 6. How to Contribute

We welcome contributions to CSS Picker Pro! Please see our [contributing guidelines](CONTRIBUTING.md) for more information.