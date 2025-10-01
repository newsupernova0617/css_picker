import { initializeApp } from './lib/firebase-app-compat.js';
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from './lib/firebase-auth-compat.js';
import { getFirestore, doc, getDoc } from './lib/firebase-firestore-compat.js';

// Firebase 웹 설정
const firebaseConfig = {
    apiKey: "AIzaSyBoSF6ymRxQShwtCUZ_tNkilChozl42SYU",
    authDomain: "project-fastsaas.firebaseapp.com",
    projectId: "project-fastsaas",
    storageBucket: "project-fastsaas.appspot.com",
    messagingSenderId: "359112377577",
    appId: "1:359112377577:web:932e77fbf6a021f0bfdc78",
    measurementId: "G-19E807NXPL"
};

// Firebase 초기화
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

let isPickerActive = false;
let activeTabId = null;

// --- Core Application Logic Functions ---

async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return { success: true, user: result.user };
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        return { success: false, error: error.message };
    }
}

async function getUserProfile() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe(); // Stop listening after getting the current state
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                try {
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        resolve({ success: true, user: { ...user, ...docSnap.data() } });
                    } else {
                        resolve({ success: true, user });
                    }
                } catch (error) {
                    console.error("Firestore getDoc error:", error);
                    resolve({ success: false, error: "Failed to fetch user data from Firestore." });
                }
            } else {
                resolve({ success: false, error: "No user logged in" });
            }
        });
    });
}

// ... (The rest of the functions like downloadAssets, handleActionClick, etc. remain the same) ...

// 4. Message Listener (Handles communication from popup, sidepanel, etc.)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const normalizedType = 
    typeof message?.type === "string" ? message.type.trim().toLowerCase() : message?.type;
  const normalizedAction =
    typeof message?.action === "string" ? message.action.trim().toLowerCase() : message?.action;

  switch (normalizedType || normalizedAction) { // check both type and action
    case "login":
      signInWithGoogle().then(sendResponse);
      return true; // Indicates that the response is sent asynchronously

    case "get_profile":
      getUserProfile().then(sendResponse);
      return true;

    case "logout":
      signOut(auth).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        console.error("Firebase signOut error:", error);
        sendResponse({ success: false, error: error.message });
      });
      return true;

    // ... (other cases remain the same) ...

    default:
      console.warn("Unknown message type received:", message);
      sendResponse({ success: false, error: (normalizedType || normalizedAction) ? `Unknown message type: ${normalizedType || normalizedAction}` : 'Unknown message type' });
      break;
  }
});

// ... (The rest of the file remains the same) ...
