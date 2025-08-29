// Clerk Configuration for Chrome Extension
// You need to replace this with your actual Clerk publishable key from the dashboard

console.log('🔧 clerk-config.js is loading...');

const CLERK_CONFIG = {
  publishableKey: 'pk_test_bWVldC13YXJ0aG9nLTgyLmNsZXJrLmFjY291bnRzLmRldiQ',
  // Replace with your Clerk frontend API URL  
  frontendApi: 'https://meet-warthog-82.clerk.accounts.dev',
  // For development, sync with localhost backend
  syncHost: 'http://localhost:4242',  // Will update this when you deploy
  // Landing page URL for authentication
  landingPageUrl: 'http://localhost:4242'
};

// Simple Clerk client implementation for Chrome Extension
class ClerkExtensionClient {
  constructor(config) {
    this.config = config;
    this.user = null;
    this.isLoaded = false;
    this.isSignedIn = false;
    this.sessionToken = null;
    
    this.init();
  }
  
  async init() {
    try {
      // Load user session from chrome storage
      const result = await chrome.storage.local.get(['clerk_session', 'clerk_user']);
      if (result.clerk_session && result.clerk_user) {
        this.sessionToken = result.clerk_session;
        this.user = result.clerk_user;
        
        // Verify the existing session is still valid
        const isValid = await this.checkExistingSession();
        this.isSignedIn = isValid;
      }
      
      // Listen for messages from landing page
      this.setupMessageListener();
      
      this.isLoaded = true;
      this.notifyListeners('loaded');
    } catch (error) {
      console.error('Failed to initialize Clerk client:', error);
      this.isLoaded = true;
    }
  }
  
  setupMessageListener() {
    // Listen for auth messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'CLERK_AUTH_UPDATE' && message.data) {
        console.log('Received auth update from background:', message.data);
        this.handleAuthSuccess(message.data);
        sendResponse({ success: true });
      } else if (message.type === 'CLERK_AUTH_ERROR') {
        console.log('Received auth error:', message.error);
        this.handleAuthError(message.error);
        sendResponse({ success: true });
      }
    });
  }
  
  async handleAuthSuccess(authData) {
    try {
      this.user = authData.user;
      this.sessionToken = authData.sessionToken;
      this.isSignedIn = true;
      
      // Store in chrome storage
      await chrome.storage.local.set({
        clerk_session: this.sessionToken,
        clerk_user: this.user
      });
      
      this.notifyListeners('signIn');
    } catch (error) {
      console.error('Failed to handle auth success:', error);
    }
  }
  
  handleAuthError(error) {
    console.error('Authentication error:', error);
    this.notifyListeners('authError');
  }
  
  // Redirect to landing page for Clerk authentication
  async signIn() {
    try {
      // Open landing page in a new tab for Clerk authentication
      const extensionId = chrome.runtime.id;
      const authUrl = `${this.config.landingPageUrl}?extension_auth=true&extension_id=${extensionId}`;
      
      // Open landing page for authentication
      chrome.tabs.create({ url: authUrl });
      
      return { success: true, redirected: true };
      
    } catch (error) {
      console.error('Sign in failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Simple sign out
  async signOut() {
    try {
      this.user = null;
      this.sessionToken = null;
      this.isSignedIn = false;
      
      // Clear storage
      await chrome.storage.local.remove(['clerk_session', 'clerk_user']);
      
      this.notifyListeners('signOut');
      return { success: true };
    } catch (error) {
      console.error('Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Check if user has valid session on initialization
  async checkExistingSession() {
    try {
      if (this.sessionToken && this.user) {
        // Verify token is still valid by checking with backend
        const response = await fetch(`${this.config.syncHost}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${this.sessionToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('Existing session is valid');
          return true;
        } else {
          console.log('Existing session is invalid, clearing');
          await this.signOut();
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking existing session:', error);
      return false;
    }
  }
  
  // Event listeners
  listeners = [];
  
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event, this);
      } catch (error) {
        console.error('Listener callback failed:', error);
      }
    });
  }
  
  // Utility methods
  getUser() {
    return this.user;
  }
  
  getSessionToken() {
    return this.sessionToken;
  }
}

// Initialize Clerk client
const clerkClient = new ClerkExtensionClient(CLERK_CONFIG);