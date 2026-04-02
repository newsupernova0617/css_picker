/**
 * Lightweight client-side plan manager used by the side panel to decide whether
 * premium features should be unlocked. The real plan data is persisted in
 * Firestore via Firebase Cloud Functions; when that backend is unavailable we
 * gracefully fall back to locally cached state.
 */
class PlanManager {
  constructor(options = {}) {
    this.currentPlan = 'free';
    this.isReady = false;
    this.userId = null;
    this.sessionToken = null;
    this.lastSyncedAt = null;
    this.backendUrl =
      options.backendUrl ||
      'https://us-central1-project-fastsaas.cloudfunctions.net';
    this.checkoutUrl =
      options.checkoutUrl || 'https://www.csspicker.site/pricing';

    // Feature access matrix – extend as new premium capabilities ship.
    this.featureMatrix = {
      color_sampling: 'premium',
      asset_management: 'premium',
      console_monitoring: 'premium',
      tailwind_conversion: 'premium',
      export_features: 'premium',
    };

    this.planUpdateCallbacks = new Set();
    this.usageCounters = {};
    this._storedState = null;

    this._readyResolvers = [];
    this._init();
  }

  async _init() {
    await this._hydrateFromStorage();
    this.isReady = true;
    this._resolveReady();
  }

  _resolveReady() {
    this._readyResolvers.forEach((resolve) => resolve());
    this._readyResolvers = [];
  }

  waitForReady() {
    if (this.isReady) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this._readyResolvers.push(resolve));
  }

  async _hydrateFromStorage() {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return;
    }

    return new Promise((resolve) => {
      chrome.storage.local.get(
        ['plan_manager_state', 'plan_usage_counters'],
        (result) => {
          try {
            const state = result?.plan_manager_state;
            if (state?.userId && state?.plan) {
              this._storedState = {
                userId: state.userId,
                plan: this._normalizePlanValue(state.plan),
                lastSyncedAt: state?.lastSyncedAt || null,
              };
            } else {
              this._storedState = null;
            }

            this.currentPlan = 'free';
            this.userId = null;
            this.lastSyncedAt = this._storedState?.lastSyncedAt || null;
            const counters = result?.plan_usage_counters;
            if (counters && typeof counters === 'object') {
              this.usageCounters = counters;
            }
          } catch (error) {
            console.warn('PlanManager hydrate failed:', error);
          } finally {
            resolve();
          }
        }
      );
    });
  }

  async _persistState() {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return;
    }
    if (!this.userId) {
      chrome.storage.local.remove('plan_manager_state', () => {
        if (chrome.runtime?.lastError) {
          console.warn('PlanManager persist warning:', chrome.runtime.lastError);
        }
      });
      this._storedState = null;
      return;
    }

    const payload = {
      plan_manager_state: {
        plan: this.currentPlan,
        userId: this.userId,
        lastSyncedAt: this.lastSyncedAt,
      },
    };
    chrome.storage.local.set(payload, () => {
      if (chrome.runtime?.lastError) {
        console.warn('PlanManager persist warning:', chrome.runtime.lastError);
      }
    });
    this._storedState = {
      plan: this.currentPlan,
      userId: this.userId,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  async _persistUsage() {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return;
    }
    chrome.storage.local.set(
      { plan_usage_counters: this.usageCounters },
      () => {
        if (chrome.runtime?.lastError) {
          console.warn(
            'PlanManager usage persist warning:',
            chrome.runtime.lastError
          );
        }
      }
    );
  }

  _notifyPlanUpdate(event = 'refresh') {
    for (const callback of this.planUpdateCallbacks) {
      try {
        callback(this.currentPlan, event);
      } catch (error) {
        console.warn('PlanManager callback failed:', error);
      }
    }
  }

  /**
   * Registers a plan update callback. Returns an unsubscribe function.
   */
  onPlanUpdate(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    this.planUpdateCallbacks.add(callback);
    return () => this.planUpdateCallbacks.delete(callback);
  }

  /**
   * Returns the feature gate for the given feature.
   */
  getFeatureRule(featureName) {
    return this.featureMatrix[featureName] || 'free';
  }

  /**
   * Public helper to refresh plan data and notify listeners on change.
   */
  async refreshPlanAndNotify(event = 'manual-refresh') {
    const previousPlan = this.currentPlan;
    const result = await this.loadUserPlan();
    if (result?.plan && result.plan !== previousPlan) {
      this._notifyPlanUpdate(event);
    }
    return result;
  }

  async syncPlanStatus() {
    return this.refreshPlanAndNotify('sync');
  }

  /**
   * Fetches plan data. For now we optimistically try the backend and fall
   * back to cached values. Step 2 extends this with Cloud Function wiring.
   */
  async loadUserPlan() {
    await this.waitForReady();

    // Attempt backend sync when we have an authenticated user.
    if (this.userId) {
      try {
        const response = await this.fetchPlanFromBackend();
        if (response?.plan) {
          this._applyPlanUpdate(response.plan, {
            source: response.source || 'backend',
            fetchedAt: response.fetchedAt || Date.now(),
            allowDowngrade: true,
          });
          return { plan: this.currentPlan, source: response.source || 'backend' };
        }
      } catch (error) {
        console.warn('PlanManager backend sync failed:', error?.message || error);
      }
  }

  // Fall back to cached plan state.
  return { plan: this.currentPlan, source: 'cache' };
}

  _normalizePlanValue(plan) {
    if (!plan) return 'free';
    const normalized = String(plan).trim().toLowerCase().replace(/\s+/g, '_');
    const premiumTokens = new Set([
      'premium',
      'premium_active',
      'premium_user',
      'paid',
      'paid_user',
      'active_paid',
      'pro',
      'lifetime',
    ]);
    return premiumTokens.has(normalized) ? 'premium' : 'free';
  }

  _applyPlanUpdate(plan, metadata = {}) {
    const normalizedPlan = this._normalizePlanValue(plan);
    const allowDowngrade =
      metadata.allowDowngrade === undefined ? true : metadata.allowDowngrade;

    if (
      !allowDowngrade &&
      this.currentPlan === 'premium' &&
      normalizedPlan !== 'premium'
    ) {
      return;
    }

    this.currentPlan = normalizedPlan;
    this.lastSyncedAt = metadata.fetchedAt || Date.now();
    if (this.userId) {
      this._storedState = {
        userId: this.userId,
        plan: normalizedPlan,
        lastSyncedAt: this.lastSyncedAt,
      };
    }
    this._persistState();
  }

  /**
   * Attempt to fetch plan state from the background service worker. The
   * service worker proxies requests to Firebase Cloud Functions.
   */
  async fetchPlanFromBackend() {
    if (
      typeof chrome === 'undefined' ||
      !chrome.runtime?.sendMessage ||
      !this.userId
    ) {
      return null;
    }

    try {
      const result = await chrome.runtime.sendMessage({
        type: 'plan_manager:fetch_plan',
        userId: this.userId,
        sessionToken: this.sessionToken || null,
      });

      if (result?.success && result.plan) {
        return {
          plan: result.plan,
          source: 'backend',
          fetchedAt: Date.now(),
          raw: result,
        };
      }

      if (result?.plan) {
        return {
          plan: result.plan,
          source: result.source || 'fallback',
          fetchedAt: Date.now(),
        };
      }
    } catch (error) {
      console.warn('PlanManager fetchPlanFromBackend error:', error);
    }
    return null;
  }

  /**
   * Set the active user context. Should be called after Firebase auth login.
   */
  async setUserContext(user = {}) {
    const nextUserId = user?.uid || user?.id || null;
    this.userId = nextUserId;

    if (user?.plan) {
      this._applyPlanUpdate(user.plan, {
        source: 'profile',
        allowDowngrade: false,
      });
      this._notifyPlanUpdate('profile');
    } else if (nextUserId) {
      if (
        this._storedState &&
        this._storedState.userId === nextUserId &&
        this._storedState.plan
      ) {
        this._applyPlanUpdate(this._storedState.plan, {
          source: 'cache',
          allowDowngrade: false,
          fetchedAt: this._storedState.lastSyncedAt || Date.now(),
        });
        this._notifyPlanUpdate('cache');
      }
      await this.refreshPlanAndNotify('user-change');
    } else {
      this._applyPlanUpdate('free', { source: 'sign-out', allowDowngrade: true });
      this._notifyPlanUpdate('sign-out');
      this._storedState = null;
    }
  }

  setSessionToken(token) {
    this.sessionToken = token || null;
  }

  /**
   * Determine whether a feature can be used in the current plan.
   */
  async canUseFeature(featureName) {
    await this.waitForReady();

    const rule = this.getFeatureRule(featureName);
    if (rule === 'free') {
      return {
        allowed: true,
        plan: this.currentPlan,
        reason: 'Feature available on free tier',
      };
    }

    const allowed = this.currentPlan === 'premium';
    const hasUser = !!this.userId;
    return {
      allowed: allowed && hasUser,
      plan: this.currentPlan,
      requiredPlan: rule,
      reason: allowed && hasUser
        ? 'Premium plan active'
        : hasUser
          ? 'Upgrade required'
          : 'Sign in required',
    };
  }

  /**
   * Track feature usage for analytics or soft limits.
   */
  async trackUsage(featureName) {
    await this.waitForReady();
    this.usageCounters[featureName] =
      (this.usageCounters[featureName] || 0) + 1;
    this._persistUsage();
    return this.usageCounters[featureName];
  }

  /**
   * Returns information used to populate upgrade messaging.
   */
  showUpgradePrompt(featureName) {
    const rule = this.getFeatureRule(featureName);
    const signedIn = !!this.userId;
    let message;

    if (!signedIn) {
      message = 'Sign in to access this premium feature.';
    } else if (rule === 'premium' && this.currentPlan === 'premium') {
      message = 'You already have access to this Premium feature.';
    } else if (rule === 'premium') {
      message = 'Unlock this feature with the Premium plan.';
    } else {
      message = 'Feature available on current plan.';
    }

    return {
      feature: featureName,
      requiredPlan: rule,
      currentPlan: this.currentPlan,
      message,
    };
  }

  /**
   * Opens pricing page in a new tab.
   */
  redirectToCheckout() {
    if (!this.checkoutUrl) return;
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
        chrome.tabs.create({ url: this.checkoutUrl });
      } else if (typeof window !== 'undefined') {
        window.open(this.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.warn('PlanManager redirect failed:', error);
    }
  }
}

// Expose globally for the side panel.
window.PlanManager = PlanManager;
