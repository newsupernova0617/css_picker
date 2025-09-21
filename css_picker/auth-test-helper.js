// Authentication Flow Test Helper
// This script helps test and debug the authentication flow in development

console.log('🧪 AUTH TEST HELPER: Loading...');

class AuthTestHelper {
  constructor() {
    this.testResults = [];
    this.setupTestButtons();
  }

  // Add test buttons to the sidepanel for debugging
  setupTestButtons() {
    // Only run in development/test environment
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
      setTimeout(() => {
        this.addTestUI();
      }, 2000); // Wait for main UI to load
    }
  }

  addTestUI() {
    const testContainer = document.createElement('div');
    testContainer.id = 'auth-test-container';
    testContainer.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #f0f0f0;
      border: 1px solid #ccc;
      padding: 10px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 12px;
      max-width: 200px;
    `;

    testContainer.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">🧪 Auth Test</div>
      <button id="test-auth-state" style="margin: 2px; padding: 3px 6px; font-size: 11px;">Check Auth State</button>
      <button id="test-plan-sync" style="margin: 2px; padding: 3px 6px; font-size: 11px;">Test Plan Sync</button>
      <button id="test-ui-refresh" style="margin: 2px; padding: 3px 6px; font-size: 11px;">Force UI Refresh</button>
      <button id="test-home-signin" style="margin: 2px; padding: 3px 6px; font-size: 11px;">Test Home Signin</button>
      <button id="test-auth-speed" style="margin: 2px; padding: 3px 6px; font-size: 11px;">Test Auth Speed</button>
      <button id="clear-auth-data" style="margin: 2px; padding: 3px 6px; font-size: 11px;">Clear Auth</button>
      <div id="test-results" style="margin-top: 5px; font-size: 10px; max-height: 150px; overflow-y: auto;"></div>
    `;

    document.body.appendChild(testContainer);

    // Add event listeners
    document.getElementById('test-auth-state').addEventListener('click', () => this.testAuthState());
    document.getElementById('test-plan-sync').addEventListener('click', () => this.testPlanSync());
    document.getElementById('test-ui-refresh').addEventListener('click', () => this.testUIRefresh());
    document.getElementById('test-home-signin').addEventListener('click', () => this.testHomePageSignin());
    document.getElementById('test-auth-speed').addEventListener('click', () => this.testAuthSpeed());
    document.getElementById('clear-auth-data').addEventListener('click', () => this.clearAuthData());

    console.log('✅ AUTH TEST HELPER: Test UI added');
  }

  async testAuthState() {
    console.log('🧪 Testing authentication state...');
    const results = [];

    try {
      // Test 1: Check Clerk Client
      if (typeof clerkClient !== 'undefined') {
        results.push(`✅ Clerk Client: Available`);
        results.push(`🔐 Signed In: ${clerkClient.isSignedIn}`);
        results.push(`👤 User: ${clerkClient.user ? clerkClient.user.email : 'None'}`);
        results.push(`🎫 Token: ${clerkClient.sessionToken ? 'Present' : 'Missing'}`);
      } else {
        results.push(`❌ Clerk Client: Not Available`);
      }

      // Test 2: Check Plan Manager
      if (typeof planManager !== 'undefined') {
        results.push(`✅ Plan Manager: Available`);
        results.push(`📋 Current Plan: ${planManager.currentPlan}`);
        results.push(`🟢 Ready: ${planManager.isReady}`);
      } else {
        results.push(`❌ Plan Manager: Not Available`);
      }

      // Test 3: Check Chrome Storage
      const stored = await chrome.storage.local.get(['clerk_session', 'clerk_user', 'user_plan']);
      results.push(`💾 Storage Session: ${stored.clerk_session ? 'Present' : 'Missing'}`);
      results.push(`💾 Storage User: ${stored.clerk_user ? 'Present' : 'Missing'}`);
      results.push(`💾 Storage Plan: ${stored.user_plan || 'Not Set'}`);

      this.displayResults(results);

    } catch (error) {
      console.error('❌ Auth state test failed:', error);
      this.displayResults([`❌ Test failed: ${error.message}`]);
    }
  }

  async testPlanSync() {
    console.log('🧪 Testing plan synchronization...');
    const results = [];

    try {
      if (typeof planManager !== 'undefined') {
        results.push(`🔄 Starting plan sync...`);

        const oldPlan = planManager.currentPlan;
        await planManager.refreshPlanAndNotify();
        const newPlan = planManager.currentPlan;

        results.push(`📋 Old Plan: ${oldPlan}`);
        results.push(`📋 New Plan: ${newPlan}`);
        results.push(`✅ Sync completed`);

        if (typeof window.cssSidepanel !== 'undefined') {
          await window.cssSidepanel.updatePlanUI();
          await window.cssSidepanel.setupPremiumLocks();
          results.push(`🎨 UI updated`);
        }

      } else {
        results.push(`❌ Plan Manager not available`);
      }

      this.displayResults(results);

    } catch (error) {
      console.error('❌ Plan sync test failed:', error);
      this.displayResults([`❌ Plan sync failed: ${error.message}`]);
    }
  }

  async testUIRefresh() {
    console.log('🧪 Testing UI refresh...');
    const results = [];

    try {
      if (typeof window.cssSidepanel !== 'undefined') {
        results.push(`🎨 Starting UI refresh...`);

        await window.cssSidepanel.initializeAuthentication();
        results.push(`✅ Auth initialized`);

        await window.cssSidepanel.updatePlanUI();
        results.push(`✅ Plan UI updated`);

        await window.cssSidepanel.setupPremiumLocks();
        results.push(`✅ Premium locks setup`);

        results.push(`🎨 UI refresh completed`);
      } else {
        results.push(`❌ Sidepanel not available`);
      }

      this.displayResults(results);

    } catch (error) {
      console.error('❌ UI refresh test failed:', error);
      this.displayResults([`❌ UI refresh failed: ${error.message}`]);
    }
  }

  async clearAuthData() {
    console.log('🧪 Clearing authentication data...');
    const results = [];

    try {
      // Clear Clerk client state
      if (typeof clerkClient !== 'undefined') {
        await clerkClient.signOut();
        results.push(`✅ Clerk client cleared`);
      }

      // Clear Chrome storage
      await chrome.storage.local.remove(['clerk_session', 'clerk_user', 'user_plan', 'auth_timestamp']);
      results.push(`✅ Storage cleared`);

      // Reset plan manager
      if (typeof planManager !== 'undefined') {
        planManager.currentPlan = 'free';
        planManager.isReady = false;
        planManager.initializationPromise = null;
        results.push(`✅ Plan manager reset`);
      }

      results.push(`🧹 Auth data cleared`);
      this.displayResults(results);

    } catch (error) {
      console.error('❌ Clear auth data failed:', error);
      this.displayResults([`❌ Clear failed: ${error.message}`]);
    }
  }

  displayResults(results) {
    const resultsDiv = document.getElementById('test-results');
    if (resultsDiv) {
      resultsDiv.innerHTML = results.join('<br>');
    }
    console.log('🧪 Test Results:', results);
  }

  // Simulate premium login for testing
  async simulatePremiumLogin() {
    console.log('🧪 Simulating premium login...');

    const testUser = {
      id: 'test_user_123',
      email: 'test@premium.com',
      firstName: 'Test',
      lastName: 'User'
    };

    const testSessionToken = 'test_premium_token_' + Date.now();

    // Simulate auth success
    if (typeof clerkClient !== 'undefined') {
      await clerkClient.handleAuthSuccess({
        user: testUser,
        sessionToken: testSessionToken
      });
    }

    // Force premium plan
    if (typeof planManager !== 'undefined') {
      planManager.currentPlan = 'premium';
      await planManager.refreshPlanAndNotify();
    }

    console.log('✅ Premium login simulation completed');
  }

  // Test specific home page signin flow
  async testHomePageSignin() {
    console.log('🧪 Testing home page signin flow...');
    const results = [];

    try {
      // Step 1: Go to home and check initial state
      if (typeof window.cssSidepanel !== 'undefined') {
        window.cssSidepanel.showHome();
        results.push(`✅ Navigated to home`);

        // Check if auth prompt is visible
        const authPrompt = document.getElementById('homeAuthPrompt');
        if (authPrompt) {
          const isVisible = authPrompt.style.display !== 'none';
          results.push(`🔍 Auth prompt visible: ${isVisible}`);
        }

        // Step 2: Simulate login
        await this.simulatePremiumLogin();
        results.push(`✅ Simulated login`);

        // Step 3: Wait and check if auth prompt is hidden
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (authPrompt) {
          const isHidden = authPrompt.style.display === 'none';
          results.push(`✅ Auth prompt hidden after login: ${isHidden}`);
        }

        // Step 4: Navigate away and back to home
        window.cssSidepanel.showSection('css-info');
        results.push(`✅ Navigated away from home`);

        await new Promise(resolve => setTimeout(resolve, 500));

        window.cssSidepanel.showHome();
        results.push(`✅ Navigated back to home`);

        // Step 5: Check if auth prompt stays hidden
        await new Promise(resolve => setTimeout(resolve, 500));

        if (authPrompt) {
          const isStillHidden = authPrompt.style.display === 'none';
          results.push(`${isStillHidden ? '✅' : '❌'} Auth prompt stays hidden: ${isStillHidden}`);
        }

        // Step 6: Check authentication state
        const authState = window.cssSidepanel.getAuthenticationState();
        results.push(`🔍 Final auth state: ${authState.isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);

      } else {
        results.push(`❌ Sidepanel not available`);
      }

      this.displayResults(results);

    } catch (error) {
      console.error('❌ Home page signin test failed:', error);
      this.displayResults([`❌ Test failed: ${error.message}`]);
    }
  }

  // Test authentication UI speed
  async testAuthSpeed() {
    console.log('🧪 Testing authentication UI speed...');
    const results = [];

    try {
      // Clear auth first
      await this.clearAuthData();
      await new Promise(resolve => setTimeout(resolve, 500));

      if (typeof window.cssSidepanel !== 'undefined') {
        // Go to home
        window.cssSidepanel.showHome();

        const authSignedIn = document.getElementById('authSignedIn');
        const authSignedOut = document.getElementById('authSignedOut');

        if (authSignedIn && authSignedOut) {
          // Check initial state
          const initialSignedIn = authSignedIn.style.display !== 'none';
          const initialSignedOut = authSignedOut.style.display !== 'none';

          results.push(`🔍 Initial state - SignedIn: ${initialSignedIn}, SignedOut: ${initialSignedOut}`);

          // Measure timing
          const startTime = performance.now();

          // Simulate login with timing measurement
          const testUser = {
            id: 'speed_test_user',
            email: 'speed@test.com',
            firstName: 'Speed',
            lastName: 'Test'
          };

          // Trigger immediate auth update
          window.cssSidepanel.updateAuthUI('signed-in');

          const immediateTime = performance.now();
          const immediateDelay = immediateTime - startTime;

          // Check if UI changed immediately
          const immediateSignedIn = authSignedIn.style.display !== 'none';
          const immediateSignedOut = authSignedOut.style.display !== 'none';

          results.push(`⚡ Immediate update (${immediateDelay.toFixed(2)}ms) - SignedIn: ${immediateSignedIn}, SignedOut: ${immediateSignedOut}`);

          // Wait a bit and check again
          await new Promise(resolve => setTimeout(resolve, 100));

          const finalTime = performance.now();
          const totalDelay = finalTime - startTime;

          const finalSignedIn = authSignedIn.style.display !== 'none';
          const finalSignedOut = authSignedOut.style.display !== 'none';

          results.push(`✅ Final state (${totalDelay.toFixed(2)}ms) - SignedIn: ${finalSignedIn}, SignedOut: ${finalSignedOut}`);

          // Performance assessment
          if (immediateDelay < 50) {
            results.push(`🚀 Excellent: Auth UI updated in ${immediateDelay.toFixed(2)}ms`);
          } else if (immediateDelay < 200) {
            results.push(`✅ Good: Auth UI updated in ${immediateDelay.toFixed(2)}ms`);
          } else {
            results.push(`⚠️ Slow: Auth UI took ${immediateDelay.toFixed(2)}ms to update`);
          }

        } else {
          results.push(`❌ Auth elements not found`);
        }

      } else {
        results.push(`❌ Sidepanel not available`);
      }

      this.displayResults(results);

    } catch (error) {
      console.error('❌ Auth speed test failed:', error);
      this.displayResults([`❌ Test failed: ${error.message}`]);
    }
  }
}

// Initialize test helper if in development environment
if (typeof window !== 'undefined') {
  window.authTestHelper = new AuthTestHelper();

  // Global test functions for console access
  window.testAuth = () => window.authTestHelper.testAuthState();
  window.testPlan = () => window.authTestHelper.testPlanSync();
  window.testUI = () => window.authTestHelper.testUIRefresh();
  window.testHomeSignin = () => window.authTestHelper.testHomePageSignin();
  window.testAuthSpeed = () => window.authTestHelper.testAuthSpeed();
  window.clearAuth = () => window.authTestHelper.clearAuthData();
  window.simulatePremium = () => window.authTestHelper.simulatePremiumLogin();

  console.log('✅ AUTH TEST HELPER: Initialized');
  console.log('💡 Available test functions: testAuth(), testPlan(), testUI(), testHomeSignin(), testAuthSpeed(), clearAuth(), simulatePremium()');
}