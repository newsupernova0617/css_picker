// Clerk Configuration for Chrome Extension
// You need to replace this with your actual Clerk publishable key from the dashboard

console.log('🔧 clerk-config.js is loading...');
//clerk 관련 정보들
const CLERK_CONFIG = {
  publishableKey: 'pk_test_bWVldC13YXJ0aG9nLTgyLmNsZXJrLmFjY291bnRzLmRldiQ',
  // Replace with your Clerk frontend API URL  
  frontendApi: 'https://meet-warthog-82.clerk.accounts.dev',
  // Development backend URL - change to https://www.csspicker.site for production
  syncHost: 'https://www.csspicker.site',
  // Landing page URL for authentication
  landingPageUrl: 'https://www.csspicker.site'
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
      console.log('🔧 Clerk client initializing...');
      
      // Load user session from chrome storage
      const result = await chrome.storage.local.get(['clerk_session', 'clerk_user']);
      console.log('📦 Loaded from storage:', {
        hasSession: !!result.clerk_session,
        hasUser: !!result.clerk_user,
        sessionLength: result.clerk_session?.length || 0
      });
      
      if (result.clerk_session && result.clerk_user) {
        // Validate the stored data is not corrupted
        try {
          // Basic validation of user object
          if (typeof result.clerk_user === 'object' && result.clerk_user.id) {
            this.sessionToken = result.clerk_session;
            this.user = result.clerk_user;
            
            console.log('✅ Session data loaded successfully');
            
            // Verify the existing session is still valid
            const isValid = await this.checkExistingSession();
            this.isSignedIn = isValid;
            
            console.log('🔐 Session validation result:', isValid ? 'VALID' : 'INVALID');
          } else {
            console.warn('⚠️ Stored user data appears corrupted, clearing...');
            await chrome.storage.local.remove(['clerk_session', 'clerk_user']);
          }
        } catch (validationError) {
          console.error('❌ Error validating stored session data:', validationError);
          await chrome.storage.local.remove(['clerk_session', 'clerk_user']);
        }
      } else {
        console.log('ℹ️ No existing session found in storage');
      }
      
      // Listen for messages from landing page
      this.setupMessageListener();
      
      this.isLoaded = true;
      console.log('✅ Clerk client initialization complete');
      this.notifyListeners('loaded');
    } catch (error) {
      console.error('❌ Failed to initialize Clerk client:', error);
      this.isLoaded = true;
    }
  }
  
  setupMessageListener() {
    // Listen for auth messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('🔐 CLERK CONFIG: Received message:', message);
      
      if (message.type === 'CLERK_AUTH_UPDATE' && message.data) {
        console.log('🔐 CLERK CONFIG: Processing auth update from background:', message.data);
        this.handleAuthSuccess(message.data);
        sendResponse({ success: true });
      } else if (message.type === 'CLERK_AUTH_ERROR') {
        console.log('🔐 CLERK CONFIG: Received auth error:', message.error);
        this.handleAuthError(message.error);
        sendResponse({ success: true });
      }
    });
  }
  
  async handleAuthSuccess(authData) {
    try {
      console.log('🎉 Processing authentication success...');

      // Enhanced validation of auth data
      if (!authData || typeof authData !== 'object') {
        throw new Error('Invalid auth data: data is null or not an object');
      }

      if (!authData.user || typeof authData.user !== 'object' || !authData.user.id) {
        throw new Error('Invalid auth data: missing or invalid user object');
      }

      if (!authData.sessionToken || typeof authData.sessionToken !== 'string') {
        throw new Error('Invalid auth data: missing or invalid sessionToken');
      }

      this.user = authData.user;
      this.sessionToken = authData.sessionToken;
      this.isSignedIn = true;

      console.log('💾 Storing session data to chrome.storage.local...');

      // Store in chrome storage with enhanced error handling
      let storageAttempts = 0;
      const maxStorageAttempts = 3;
      let storageSuccess = false;

      while (storageAttempts < maxStorageAttempts && !storageSuccess) {
        try {
          storageAttempts++;

          await chrome.storage.local.set({
            clerk_session: this.sessionToken,
            clerk_user: this.user,
            auth_timestamp: Date.now() // Add timestamp for debugging
          });

          // Verify storage was successful
          const verification = await chrome.storage.local.get(['clerk_session', 'clerk_user']);
          if (verification.clerk_session && verification.clerk_user) {
            console.log('✅ Session data successfully persisted to storage');
            storageSuccess = true;
          } else {
            throw new Error('Storage verification failed - data not found after save');
          }

        } catch (storageError) {
          console.warn(`⚠️ Storage attempt ${storageAttempts} failed:`, storageError);
          if (storageAttempts < maxStorageAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500 * storageAttempts));
          } else {
            console.error('❌ All storage attempts failed, continuing without persistence');
          }
        }
      }

      console.log('🔔 Notifying auth listeners of sign in...');
      this.notifyListeners('signIn');

      // Trigger plan synchronization if plan manager is available
      if (typeof planManager !== 'undefined') {
        console.log('🔄 CLERK CONFIG: Triggering plan sync after auth success...');
        try {
          // Add small delay to ensure all components are ready
          setTimeout(async () => {
            try {
              await planManager.handleAuthenticationChange('signIn', this);
              console.log('✅ CLERK CONFIG: Plan sync triggered successfully');
            } catch (planError) {
              console.error('❌ CLERK CONFIG: Plan sync trigger failed:', planError);
            }
          }, 300);
        } catch (error) {
          console.error('❌ CLERK CONFIG: Failed to trigger plan sync:', error);
        }
      }

    } catch (error) {
      console.error('❌ Failed to handle auth success:', error);

      // Enhanced error recovery
      this.handleAuthError(error.message);

      // Don't clear session on validation/storage errors unless critical
      if (error.message.includes('Invalid auth data')) {
        console.log('🧹 Clearing invalid session data due to validation failure');
        await this.signOut();
      }
    }
  }
  
  handleAuthError(error) {
    console.error('❌ Authentication error:', error);

    // Enhanced error handling and recovery
    const errorMessage = typeof error === 'string' ? error : error?.message || 'Unknown authentication error';

    // Log detailed error information for debugging
    console.error('🔍 Auth Error Details:', {
      error: errorMessage,
      isSignedIn: this.isSignedIn,
      hasUser: !!this.user,
      hasSessionToken: !!this.sessionToken,
      timestamp: new Date().toISOString()
    });

    // Attempt recovery for specific error types
    if (errorMessage.includes('Invalid auth data') || errorMessage.includes('session')) {
      console.log('🔄 Attempting auth error recovery...');
      this.attemptAuthRecovery();
    }

    this.notifyListeners('authError');
  }

  // Attempt to recover from authentication errors
  async attemptAuthRecovery() {
    try {
      console.log('🔄 Starting authentication recovery...');

      // Check if we have valid data in storage
      const stored = await chrome.storage.local.get(['clerk_session', 'clerk_user']);

      if (stored.clerk_session && stored.clerk_user) {
        console.log('🔍 Found stored auth data, attempting validation...');

        // Validate the stored session
        const isValid = await this.checkExistingSession();
        if (isValid) {
          console.log('✅ Recovery successful - session is valid');
          this.sessionToken = stored.clerk_session;
          this.user = stored.clerk_user;
          this.isSignedIn = true;
          this.notifyListeners('signIn');
          return true;
        } else {
          console.log('❌ Stored session is invalid, clearing...');
          await this.signOut();
        }
      } else {
        console.log('ℹ️ No stored auth data found for recovery');
      }

      return false;

    } catch (recoveryError) {
      console.error('❌ Auth recovery failed:', recoveryError);
      return false;
    }
  }
  
  // Redirect to landing page for Clerk authentication
  async signIn(email, password) {
    try {
      console.log('🔐 Starting direct Clerk authentication...');
      
      // Clerk API endpoint for sign in
      const response = await fetch(`${this.config.frontendApi}/v1/client/sign_ins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          strategy: 'password',
          identifier: email,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === 'complete') {
        console.log('🔐 Sign in successful, getting JWT token...');
        
        // Get the session ID
        const sessionId = data.response.created_session_id;
        
        // Now get the actual JWT token using the session ID
        const tokenResponse = await fetch(`${this.config.frontendApi}/v1/client/sessions/${sessionId}/tokens`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template: 'integration_clerk'  // or just leave empty for default template
          })
        });
        
        const tokenData = await tokenResponse.json();
        let jwtToken = null;
        
        if (tokenResponse.ok && tokenData.jwt) {
          jwtToken = tokenData.jwt;
          console.log('✅ JWT token obtained');
        } else {
          console.warn('⚠️ Could not get JWT token, using session ID as fallback');
          jwtToken = sessionId; // Fallback to session ID
        }
        
        // Get user data
        const user = {
          id: data.response.user.id,
          email: data.response.user.email_addresses[0].email_address,
          firstName: data.response.user.first_name,
          lastName: data.response.user.last_name
        };
        
        // Handle successful authentication with JWT token
        await this.handleAuthSuccess({ user, sessionToken: jwtToken });
        
        return { success: true };
      } else {
        throw new Error(data.errors?.[0]?.message || 'Authentication failed');
      }
      
    } catch (error) {
      console.error('Direct sign in failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async signUp(email, password, firstName, lastName) {
    try {
      console.log('✨ Starting direct Clerk sign up...');
      
      // Clerk API endpoint for sign up
      const response = await fetch(`${this.config.frontendApi}/v1/client/sign_ups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.publishableKey}`
        },
        body: JSON.stringify({
          email_address: email,
          password: password,
          first_name: firstName,
          last_name: lastName
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.status === 'complete') {
          console.log('✨ Sign up successful, getting JWT token...');
          
          // Account created and signed in - get JWT token
          const sessionId = data.response.created_session_id;
          
          // Get the actual JWT token using the session ID
          const tokenResponse = await fetch(`${this.config.frontendApi}/v1/client/sessions/${sessionId}/tokens`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              template: 'integration_clerk'
            })
          });
          
          const tokenData = await tokenResponse.json();
          let jwtToken = null;
          
          if (tokenResponse.ok && tokenData.jwt) {
            jwtToken = tokenData.jwt;
            console.log('✅ JWT token obtained for new user');
          } else {
            console.warn('⚠️ Could not get JWT token for new user, using session ID as fallback');
            jwtToken = sessionId;
          }
          
          const user = {
            id: data.response.user.id,
            email: data.response.user.email_addresses[0].email_address,
            firstName: data.response.user.first_name,
            lastName: data.response.user.last_name
          };
          
          await this.handleAuthSuccess({ user, sessionToken: jwtToken });
          return { success: true };
        } else if (data.status === 'missing_requirements') {
          // Need email verification
          return { 
            success: false, 
            needsVerification: true, 
            message: 'Please check your email for verification link',
            signUpId: data.response.id
          };
        }
      } else {
        throw new Error(data.errors?.[0]?.message || 'Sign up failed');
      }
      
    } catch (error) {
      console.error('Direct sign up failed:', error);
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
  async checkExistingSession(retryCount = 0) {
    const MAX_RETRIES = 2;
    
    try {
      if (this.sessionToken && this.user) {
        console.log('🔍 Checking existing session with token:', this.sessionToken?.substring(0, 20) + '...');
        
        try {
          // Verify token is still valid by checking with backend
          const response = await fetch(`${this.config.syncHost}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${this.sessionToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          });
          
          if (response.ok) {
            console.log('✅ Existing session is valid');
            return true;
          } else if (response.status === 401 || response.status === 403) {
            // Only clear session for actual authentication failures
            console.log('❌ Authentication failed (status:', response.status, '), clearing session');
            await this.signOut();
            return false;
          } else {
            // Server error, network issue, etc. - don't clear session
            console.warn('⚠️ Backend validation failed (status:', response.status, '), but keeping session. Error might be temporary.');
            
            // Retry for server errors if we haven't exceeded max retries
            if (retryCount < MAX_RETRIES && (response.status >= 500 || response.status === 429)) {
              console.log(`🔄 Retrying session validation (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
              return await this.checkExistingSession(retryCount + 1);
            }
            
            // Assume session is valid locally even if backend check failed
            console.log('✅ Assuming session is valid locally due to backend issues');
            return true;
          }
        } catch (fetchError) {
          // Network error, timeout, etc.
          console.warn('⚠️ Network error during session validation:', fetchError.message);
          
          // Retry network errors
          if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Retrying session validation due to network error (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
            return await this.checkExistingSession(retryCount + 1);
          }
          
          // After max retries, assume session is valid locally
          console.log('✅ Assuming session is valid locally due to persistent network issues');
          return true;
        }
      }
      console.log('⚠️ No session token or user found');
      return false;
    } catch (error) {
      console.error('❌ Unexpected error checking existing session:', error);
      // Don't clear session for unexpected errors - assume it's valid locally
      return true;
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