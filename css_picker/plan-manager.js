// Plan Management System for Chrome Extension
// Handles user plans, usage limits, and feature restrictions

console.log('=Ë plan-manager.js is loading...');

class PlanManager {
  constructor() {
    this.currentPlan = 'free'; // 'free', 'premium'
    this.userId = null;
    this.isReady = false; // Track initialization state
    this.initializationPromise = null; // Track async initialization
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
    
    this.backendUrl = 'http://localhost:4242'; // For development - will update when deployed
    
    this.init();
  }
  
  async init() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._performInit();
    return this.initializationPromise;
  }
  
  async _performInit() {
    try {
      console.log('= Initializing Plan Manager...');
      await this.loadUserPlan();
      await this.loadUsageData();
      this.resetDailyUsageIfNeeded();
      this.isReady = true;
      console.log(' Plan Manager initialized successfully');
    } catch (error) {
      console.error('L Failed to initialize plan manager:', error);
      // Even if init fails, mark as ready with safe defaults
      this.currentPlan = 'free';
      this.isReady = true;
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
      if (typeof clerkClient === 'undefined' || !clerkClient.isSignedIn) {
        this.currentPlan = 'free';
        this.userId = null;
        return;
      }
      
      this.userId = clerkClient.user?.id;
      
      // Fetch plan from backend using Clerk session token
      const response = await fetch(`${this.backendUrl}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${clerkClient.sessionToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.currentPlan = userData.plan || 'free';
      } else {
        console.warn('Failed to load user plan from backend, using free plan');
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
  //øl 
  // Track feature usage for analytics
  // async trackUsage(featureName) {
  //   try {
  //     // Update local usage for analytics
  //     if (!this.usageData.feature_usage[featureName]) {
  //       this.usageData.feature_usage[featureName] = 0;
  //     }
  //     this.usageData.feature_usage[featureName]++;
  //     await this.saveUsageData();
      
  //     // Send to backend for analytics tracking
  //     if (this.userId) {
  //       await this.trackUsageOnServer(featureName);
  //     }
      
  //     return true;
  //   } catch (error) {
  //     console.error('Failed to track usage:', error);
  //     return false;
  //   }
  // }
  //øl 
  // // Send usage tracking to backend
  // async trackUsageOnServer(featureName) {
  //   try {
  //     if (!clerkClient.sessionToken) return;
      
  //     await fetch(`${this.backendUrl}/api/usage/track`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${clerkClient.sessionToken}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({
  //         feature: featureName,
  //         timestamp: new Date().toISOString()
  //       })
  //     });
  //   } catch (error) {
  //     console.error('Failed to track usage on server:', error);
  //   }
  // }
  
  //usageøl
  // Get current plan info
  // getCurrentPlan() {
  //   return {
  //     name: this.currentPlan,
  //     ...this.plans[this.currentPlan]
  //   };
  // }
  
  //usageøl
  // // Get usage statistics for analytics
  // getUsageStats() {
  //   return {
  //     plan: this.currentPlan,
  //     usage: this.usageData.feature_usage,
  //     features: this.plans[this.currentPlan].features
  //   };
  // }
  
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
      title: '=€ Premium Feature',
      message: `${featureNames[featureName] || featureName} is available in Premium plan only.`,
      upgradeUrl: this.getUpgradeUrl(),
      benefits: [
        '<¨ Unlimited color sampling & palettes',
        '=æ Asset collection & download',
        '<¯ CSS to Tailwind conversion',
        '=¥ Advanced console monitoring',
        '=ä Export functionality (CSS, colors, etc.)',
        '¡ Priority support'
      ]
    };
  }
  
  // Sync plan with backend
  async syncPlanStatus() {
    await this.loadUserPlan();
    return this.currentPlan;
  }
}

// Global instance
const planManager = new PlanManager();