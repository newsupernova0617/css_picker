import { stripePublishableKey } from './config.js'; // Import the config

class PlanManager {
    constructor() {
        this.isReady = false;
        this.currentPlan = 'free';
        this.userId = null;
        this.stripe = null;
        this.onPlanUpdateCallback = null;

        // Firebase 객체는 sidepanel.html에서 전역으로 로드됩니다.
        if (typeof firebase === 'undefined') {
            console.error("Firebase is not loaded. Make sure firebase-app-compat.js and other SDKs are included in sidepanel.html.");
            return;
        }

        // Use the existing firebase instance
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.functions = firebase.functions();

        this._readyPromise = this.initialize();
    }

    async initialize() {
        // Stripe.js is loaded in sidepanel.html
        this.stripe = Stripe(stripePublishableKey); // Use the key from config.js

        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.userId = user.uid;
                this.listenToPlanChanges();
            } else {
                this.userId = null;
                this.currentPlan = 'free';
                this.isReady = true;
                if (this.onPlanUpdateCallback) {
                    this.onPlanUpdateCallback(this.currentPlan);
                }
            }
        });
    }

    listenToPlanChanges() {
        if (!this.userId) return;

        const userDocRef = this.db.collection('users').doc(this.userId);
        userDocRef.onSnapshot((doc) => {
            this.isReady = true;
            if (doc.exists) {
                this.currentPlan = doc.data().subscriptionStatus || 'free';
            } else {
                this.currentPlan = 'free';
            }
            console.log('PlanManager: Plan updated to', this.currentPlan);
            if (this.onPlanUpdateCallback) {
                this.onPlanUpdateCallback(this.currentPlan);
            }
        });
    }

    async waitForReady() {
        return this._readyPromise;
    }

    async canUseFeature(featureName) {
        await this.waitForReady();
        const premiumFeatures = ['color_sampling', 'asset_management', 'tailwind_conversion', 'export_features', 'console_monitoring'];
        if (premiumFeatures.includes(featureName)) {
            return { allowed: this.currentPlan === 'premium', reason: 'Premium feature' };
        }
        return { allowed: true };
    }

    async redirectToCheckout() {
        if (!this.userId) {
            alert("Please sign in to upgrade your plan.");
            return;
        }

        try {
            const createStripeCheckout = this.functions.httpsCallable('createStripeCheckout');
            const result = await createStripeCheckout({ uid: this.userId });
            const { sessionId } = result.data;

            if (!sessionId) {
                throw new Error("Failed to create a checkout session.");
            }

            const { error } = await this.stripe.redirectToCheckout({ sessionId });

            if (error) {
                console.error("Stripe redirect error:", error);
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            console.error("Checkout function error:", error);
            alert("Could not initiate checkout. Please try again.");
        }
    }

    onPlanUpdate(callback) {
        this.onPlanUpdateCallback = callback;
    }
}
