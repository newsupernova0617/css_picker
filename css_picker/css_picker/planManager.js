/**
 * PlanManager - Handles user plan/subscription management
 * This is a stub that provides basic interface to prevent errors
 */

class PlanManager {
  constructor() {
    this.userId = null;
    this.currentPlan = 'free';
    this.isReady = false;
    this.backendUrl = 'https://api.example.com';
    this._callbacks = [];

    console.log('📋 PlanManager initialized');

    // Try to load user plan
    this.loadUserPlan();
  }

  async loadUserPlan() {
    try {
      // Load from Chrome storage
      const { userId, userPlan } = await chrome.storage.local.get(['userId', 'userPlan']);
      this.userId = userId || null;
      this.currentPlan = userPlan || 'free';
      this.isReady = true;

      // Notify all callbacks
      this._callbacks.forEach(cb => cb({ userId: this.userId, plan: this.currentPlan }));
    } catch (error) {
      console.warn('PlanManager: Could not load user plan', error);
      this.isReady = true;
    }
  }

  async waitForReady() {
    if (this.isReady) return Promise.resolve();
    return new Promise(resolve => {
      const checkReady = () => {
        if (this.isReady) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  canUseFeature(featureName) {
    // Free plan has basic features
    const freeFeatures = ['css-picker', 'color-palette', 'console-monitor'];
    const premiumFeatures = ['advanced-analytics', 'asset-export'];

    if (freeFeatures.includes(featureName)) {
      return true;
    }

    if (premiumFeatures.includes(featureName)) {
      return this.currentPlan !== 'free';
    }

    return false;
  }

  onPlanUpdate(callback) {
    this._callbacks.push(callback);
  }

  async refreshPlanAndNotify() {
    await this.loadUserPlan();
  }

  async syncPlanStatus() {
    await this.loadUserPlan();
  }

  async trackUsage(feature, action) {
    console.log(`Tracked: ${feature} - ${action}`);
  }

  showUpgradePrompt(feature) {
    alert(`Premium feature: ${feature}\nPlease upgrade your plan to use this feature.`);
  }

  async redirectToCheckout() {
    try {
      // Get the pre-generated checkout link from backend
      const functions = firebase.functions();
      const getCheckoutLink = functions.httpsCallable('getCheckoutLink');
      const result = await getCheckoutLink();

      if (!result.data || !result.data.url) {
        throw new Error("Failed to get checkout link");
      }

      // Get current user's UID
      const user = firebase.auth().currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Redirect to checkout with user's UID as query parameter
      // Polar will show the checkout page, and we'll get a webhook after payment
      const checkoutUrl = `${result.data.url}?uid=${user.uid}`;
      chrome.tabs.create({ url: checkoutUrl });
    } catch (error) {
      console.error("Error redirecting to checkout:", error);
      alert("Could not open checkout. Please try again.");
    }
  }
}

// Create global instance
const planManager = new PlanManager();
window.planManager = planManager;
