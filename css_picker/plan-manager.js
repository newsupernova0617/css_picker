//plan-manage.js
// 계획 관리 시스템 - Chrome 확장 프로그램용
// 사용자 구독 플랜, 사용량 제한, 기능 제약을 처리합니다

console.log('plan-manager.js is loading...');

// 사용자의 구독 플랜을 관리하는 클래스
class PlanManager {
  constructor() {
    this.currentPlan = 'free';            // 현재 계획: 'free'(무료) 또는 'premium'(유료)
    this.userId = null;                   // 사용자 고유 ID
    this.isReady = false;                 // 초기화 완료 상태 추적
    this.initializationPromise = null;    // 비동기 초기화 추적
    this.usageData = {
      // Track usage for analytics only (no limits in free plan)
      feature_usage: {},
      last_reset: this.getTodayDateString()
    };
    
    // Plan definitions
    this.plans = {
      free: {
        name: 'Free Plan',
        limits: {
          // No limits needed for free features
        },
        features: {
          css_inspection: true,        // View CSS properties
          css_manipulation: true,      // Edit/modify CSS properties
          color_sampling: false,       // Premium only
          asset_management: false,     // Premium only
          tailwind_conversion: false,  // Premium only
          export_features: false,      // Premium only
          console_monitoring: false    // Premium only
        },
        description: 'Basic CSS inspection and manipulation'
      },
      premium: {
        name: 'Premium Plan',
        limits: {
          // All unlimited for premium
        },
        features: {
          css_inspection: true,        // Basic features
          css_manipulation: true,      // Basic features
          color_sampling: true,        // Unlimited color picker
          asset_management: true,      // Asset collection & download
          tailwind_conversion: true,   // CSS to Tailwind conversion
          export_features: true,       // Export palettes, CSS, etc.
          console_monitoring: true     // Advanced console features
        },
        description: 'All features unlocked with unlimited usage'
      }
    };
    
    this.backendUrl = 'http://localhost:4242/'; // For development - will update when deployed
    
    // Event listeners and callbacks
    this.planUpdateCallbacks = [];
    
    this.init();
    this.setupAuthenticationListener();
  }
  
  async init() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._performInit();
    return this.initializationPromise;
  }
  
  // Wait for Clerk client to be available AND fully loaded
  async waitForClerkClient() {
    const maxWait = 10000; // 10 seconds max wait (increased)
    const checkInterval = 100; // Check every 100ms
    let waited = 0;
    
    console.log('Waiting for Clerk client to be available and loaded...');
    
    while (waited < maxWait) {
      if (typeof clerkClient !== 'undefined') {
        console.log('Clerk client is defined, checking if loaded...');
        
        // CRITICAL: Also wait for Clerk to be fully loaded, not just defined
        if (clerkClient.isLoaded) {
          console.log('Clerk client is fully loaded');
          
          // Additional validation - check if authentication state is consistent
          const isSignedIn = clerkClient.isSignedIn;
          const hasUser = !!clerkClient.user;
          const hasSessionToken = !!clerkClient.sessionToken;
          
          console.log(`Authentication state - SignedIn: ${isSignedIn}, HasUser: ${hasUser}, HasToken: ${hasSessionToken}`);
          
          // If signed in, verify we have the necessary data for backend calls
          if (isSignedIn && (!hasUser || !hasSessionToken)) {
            console.warn('User appears signed in but missing user data or session token, waiting...');
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          console.log('Clerk client ready for authentication operations');
          return;
        } else {
          console.log('Clerk client defined but not yet loaded, waiting...');
        }
      } else {
        console.log('Clerk client not yet defined, waiting...');
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }
    
    console.warn('Clerk client not fully ready within timeout, continuing with free plan fallback');
  }

  async _performInit() {
    try {
      console.log('Initializing Plan Manager...');
      // Wait for Clerk client to be available before trying to load user plan
      await this.waitForClerkClient();
      
      await this.loadUserPlan();
      await this.loadUsageData();
      this.resetDailyUsageIfNeeded();
      this.isReady = true;
      
      // IMPORTANT: Notify callbacks about initial plan state
      this.notifyPlanUpdateCallbacks('initialization');
      console.log('Plan Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize plan manager:', error);
      // Even if init fails, mark as ready with safe defaults
      this.currentPlan = 'free';
      this.isReady = true;
      // Still notify callbacks about fallback state
      this.notifyPlanUpdateCallbacks('initialization_fallback');
    }
  }
  
  // Wait for initialization to complete
  async waitForReady() {
    if (this.isReady) return;
    if (this.initializationPromise) {
      await this.initializationPromise;
    } else {
      await this.init();
    }
  }
  
  // Load user plan from backend
  async loadUserPlan() {
    try {
      // Get current user from Clerk
      console.log('Checking Clerk authentication state...');
      console.log(`clerkClient available: ${typeof clerkClient !== 'undefined'}`);
      
      if (typeof clerkClient === 'undefined') {
        console.log('ClerkClient not available, setting plan to free');
        this.currentPlan = 'free';
        this.userId = null;
        return;
      }
      
      console.log(`clerkClient.isSignedIn: ${clerkClient.isSignedIn}`);
      
      if (!clerkClient.isSignedIn) {
        console.log('User not signed in, setting plan to free');
        this.currentPlan = 'free';
        this.userId = null;
        return;
      }
      
      this.userId = clerkClient.user?.id;
      console.log(`User ID: ${this.userId}`);
      console.log(`Session token available: ${!!clerkClient.sessionToken}`);
      
      // Fetch plan from backend using Clerk session token
      
      const response = await fetch(`${this.backendUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${clerkClient.sessionToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      
      if (response.ok) {
        const userData = await response.json();
        
        // Enhanced plan extraction with validation
        const userPlan = userData.user?.plan;
        const directPlan = userData.plan;
        const extractedPlan = userPlan || directPlan || 'free';
        
        this.currentPlan = extractedPlan;
        
        // Validate the plan is actually changed from previous
        if (this.currentPlan === 'premium') {
          console.log('Premium plan detected! User should have access to all features.');
        }
        
      } else {
        const errorText = await response.text();
        console.warn(`Backend request failed with status ${response.status}:`);
        console.warn(`Error response: ${errorText}`);
        console.warn('Falling back to free plan');
        this.currentPlan = 'free';
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
      this.currentPlan = 'free';
    }
    
    // Store in extension storage
    await chrome.storage.local.set({ user_plan: this.currentPlan });
  }
  
  // Load usage data from extension storage
  async loadUsageData() {
    try {
      const stored = await chrome.storage.local.get('usage_data');
      if (stored.usage_data) {
        this.usageData = { ...this.usageData, ...stored.usage_data };
      }
    } catch (error) {
      console.error('Failed to load usage data:', error);
    }
  }
  
  // Save usage data to extension storage
  async saveUsageData() {
    try {
      await chrome.storage.local.set({ usage_data: this.usageData });
    } catch (error) {
      console.error('Failed to save usage data:', error);
    }
  }
  
  // Reset daily usage if it's a new day
  resetDailyUsageIfNeeded() {
    const today = this.getTodayDateString();
    if (this.usageData.last_reset !== today) {
      this.usageData = {
        color_sampling: 0,
        asset_export: 0,
        last_reset: today
      };
      this.saveUsageData();
    }
  }
  
  // Get today's date as string (YYYY-MM-DD)
  getTodayDateString() {
    return new Date().toISOString().split('T')[0];
  }
  
  // Check if user can use a feature
  async canUseFeature(featureName) {
    try {
      // Ensure plan manager is ready
      await this.waitForReady();
      
      // Validate inputs
      if (!featureName || typeof featureName !== 'string') {
        console.error('Invalid featureName provided to canUseFeature:', featureName);
        return {
          allowed: false,
          reason: 'Invalid feature name',
          upgradeRequired: false,
          currentPlan: this.currentPlan || 'free'
        };
      }

      // Check if plans object is properly initialized
      if (!this.plans || typeof this.plans !== 'object') {
        console.error('Plans object not initialized:', this.plans);
        return {
          allowed: false,
          reason: 'Plan system not initialized',
          upgradeRequired: true,
          currentPlan: 'free'
        };
      }

      // Ensure currentPlan is set and valid
      if (!this.currentPlan || typeof this.currentPlan !== 'string' || !this.plans[this.currentPlan]) {
        console.warn(`Invalid currentPlan: ${this.currentPlan}, falling back to 'free'`);
        this.currentPlan = 'free';
      }
      
      const plan = this.plans[this.currentPlan];
      
      // Double check plan exists and has features
      if (!plan || typeof plan !== 'object' || !plan.features || typeof plan.features !== 'object') {
        console.error(`Plan data corrupted for plan: ${this.currentPlan}`, plan);
        // Fallback to free plan
        const freePlan = this.plans['free'];
        if (!freePlan || typeof freePlan !== 'object' || !freePlan.features || typeof freePlan.features !== 'object') {
          // Last resort - deny all premium features
          console.error('Even free plan is corrupted, denying all features');
          return {
            allowed: false,
            reason: `Plan data unavailable, feature ${featureName} requires Premium plan`,
            upgradeRequired: true,
            currentPlan: 'free'
          };
        }
        // Use free plan as fallback
        this.currentPlan = 'free';
        return this.canUseFeature(featureName);
      }
      
      // Check if feature exists in plan.features and get its value
      const featureValue = plan.features[featureName];
      
      if (featureValue !== true) {
        console.log(`Feature ${featureName} not allowed for ${this.currentPlan} plan`);
        return {
          allowed: false,
          reason: `${featureName} requires Premium plan`,
          upgradeRequired: true,
          currentPlan: this.currentPlan
        };
      }
      
      // Feature is available in current plan
      return { 
        allowed: true, 
        reason: `Available in ${plan.name || 'Current Plan'}`,
        currentPlan: this.currentPlan
      };
    } catch (error) {
      console.error('Error in canUseFeature:', error, {
        featureName,
        currentPlan: this.currentPlan,
        plansKeys: this.plans ? Object.keys(this.plans) : 'undefined'
      });
      // Fallback to denying access for safety
      return {
        allowed: false,
        reason: `Error checking feature access: ${error.message}`,
        upgradeRequired: true,
        currentPlan: this.currentPlan || 'free'
      };
    }
  }

  // Track feature usage for analytics
  async trackUsage(featureName) {
    try {
      // Update local usage for analytics
      if (!this.usageData.feature_usage[featureName]) {
        this.usageData.feature_usage[featureName] = 0;
      }
      this.usageData.feature_usage[featureName]++;
      await this.saveUsageData();
      
      // Send to backend for analytics tracking
      if (this.userId) {
        await this.trackUsageOnServer(featureName);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to track usage:', error);
      return false;
    }
  }

  // Send usage tracking to backend
  async trackUsageOnServer(featureName) {
    try {
      if (!clerkClient.sessionToken) return;
      
      await fetch(`${this.backendUrl}/api/usage/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clerkClient.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feature: featureName,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to track usage on server:', error);
    }
  }
  
  // Get current plan info
  getCurrentPlan() {
    return {
      name: this.currentPlan,
      ...this.plans[this.currentPlan]
    };
  }
  
  // Get usage statistics for analytics
  getUsageStats() {
    return {
      plan: this.currentPlan,
      usage: this.usageData.feature_usage,
      features: this.plans[this.currentPlan].features
    };
  }
  
  // Check if upgrade is needed
  needsUpgrade() {
    return this.currentPlan === 'free';
  }
  
  // Create upgrade URL
  getUpgradeUrl() {
    return `${this.backendUrl}/upgrade?user_id=${this.userId}`;
  }
  
  // Show upgrade prompt
  showUpgradePrompt(featureName) {
    const plan = this.getCurrentPlan();
    const featureNames = {
      color_sampling: 'Color Sampling',
      asset_management: 'Asset Management', 
      tailwind_conversion: 'Tailwind Conversion',
      export_features: 'Export Features',
      console_monitoring: 'Console Monitoring'
    };
    
    return {
      title: 'Premium Feature',
      message: `${featureNames[featureName] || featureName} is available in Premium plan only.`,
      upgradeUrl: this.getUpgradeUrl(),
      benefits: [
        'Unlimited color sampling & palettes',
        'Asset collection & download',
        'CSS to Tailwind conversion',
        'Advanced console monitoring',
        'Export functionality (CSS, colors, etc.)',
        'Priority support'
      ]
    };
  }
  
  // Sync plan with backend
  async syncPlanStatus() {
    await this.loadUserPlan();
    return this.currentPlan;
  }

  // Setup authentication listener to refresh plan on auth changes
  setupAuthenticationListener() {
    // Wait for clerkClient to be available
    const checkForClerkClient = () => {
      if (typeof clerkClient !== 'undefined') {
        console.log('Setting up authentication listener in plan manager');
        clerkClient.addListener((event, client) => {
          this.handleAuthenticationChange(event, client);
        });
      } else {
        // Retry after a short delay if clerkClient isn't available yet
        setTimeout(checkForClerkClient, 100);
      }
    };
    
    checkForClerkClient();
  }

  // Handle authentication state changes
  async handleAuthenticationChange(event, client) {
    try {
      console.log('Plan Manager: Authentication event:', event);
      
      if (event === 'signIn' || event === 'signOut') {
        console.log('Plan Manager: Refreshing plan due to auth change');
        
        // Reset initialization state to force reload
        this.isReady = false;
        this.initializationPromise = null;
        
        // Reinitialize plan manager
        await this.refreshPlanAndNotify();
        
        // Notify callbacks about plan update
        this.notifyPlanUpdateCallbacks(event);
      }
    } catch (error) {
      console.error('Plan Manager: Error handling auth change:', error);
    }
  }

  // Add callback for plan updates
  onPlanUpdate(callback) {
    if (typeof callback === 'function') {
      this.planUpdateCallbacks.push(callback);
    }
  }

  // Remove callback
  removePlanUpdateCallback(callback) {
    const index = this.planUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      this.planUpdateCallbacks.splice(index, 1);
    }
  }

  // Notify all callbacks about plan updates
  notifyPlanUpdateCallbacks(event) {
    this.planUpdateCallbacks.forEach(callback => {
      try {
        callback(this.currentPlan, event);
      } catch (error) {
        console.error('Error in plan update callback:', error);
      }
    });
  }

  // Refresh plan and trigger updates
  async refreshPlanAndNotify() {
    try {
      await this.loadUserPlan();
      this.notifyPlanUpdateCallbacks('refresh');
      return this.currentPlan;
    } catch (error) {
      console.error('Error refreshing plan:', error);
      throw error;
    }
  }
}

// Global instance
const planManager = new PlanManager();