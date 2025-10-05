
import { getFirestore, doc, getDoc } from './lib/firebase-firestore-compat.js';
import { initializeApp } from './lib/firebase-app-compat.js';
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signOut,
  signInWithCredential
} from './lib/firebase-auth-compat.js';
import { firebaseConfig } from './config.js'; // Import the config

// Firebase 초기화
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);



let isPickerActive = false;
let activeTabId = null;
let cachedBackendEndpoint = null;
// --- Core Application Logic Functions ---

async function loginWithGoogle() {
  const redirectUri = chrome.identity.getRedirectURL();
  const clientId = "308268216165-jmac1fg2rbm696dl3dbqq31rgrv8llu0.apps.googleusercontent.com"; // This clientId is from manifest.json oauth2
  const authUrl =
    "https://accounts.google.com/o/oauth2/auth" +
    `?client_id=${clientId}` +
    `&response_type=token` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=openid%20email%20profile`;

  try {
    const redirectUrl = await new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        (url) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          if (!url) {
            return reject(new Error("No redirect URL found."));
          }
          resolve(url);
        }
      );
    });

    const params = new URLSearchParams(redirectUrl.split("#")[1]);
    const accessToken = params.get("access_token");

    if (!accessToken) {
      console.error("No access_token found in redirect URL");
      return { success: false, error: "No access_token found." };
    }

    // Use Firebase signInWithCredential
    const credential = GoogleAuthProvider.credential(accessToken);
    try {
      const userCredential = await signInWithCredential(auth, credential);
      console.log("✅ Firebase Google Sign-In successful!");
      return { success: true, user: userCredential.user };
    } catch (firebaseError) {
      console.error("Firebase Google Sign-In Error:", firebaseError);
      return { success: false, error: firebaseError.message };
    }

  } catch (error) {
    console.error("Login process failed:", error.message);
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



// --- Utility Functions ---

function normalizeBackendUrl(baseUrl, path) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function cloneRequestInit(init = {}) {
  const cloned = { ...init };
  if (init.headers instanceof Headers) {
    cloned.headers = new Headers(init.headers);
  } else if (init.headers && typeof init.headers === "object") {
    cloned.headers = { ...init.headers };
  }
  return cloned;
}

function logBackendAttempts(context, err) {
  if (err && Array.isArray(err.attempts) && err.attempts.length) {
    console.warn(`${context} attempts:`, err.attempts);
  }
}

async function fetchFromBackend(path, init = {}) {
  const attempts = [];
  const candidates = cachedBackendEndpoint
    ? [
        cachedBackendEndpoint,
        ...BACKEND_ENDPOINTS.filter(
          (endpoint) => endpoint.baseUrl !== cachedBackendEndpoint.baseUrl
        ),
      ]
    : BACKEND_ENDPOINTS;

  for (const endpoint of candidates) {
    const url = normalizeBackendUrl(endpoint.baseUrl, path);
    try {
      const response = await fetch(url, cloneRequestInit(init));
      if (!response.ok) {
        attempts.push(`${endpoint.label} ${response.status}`);
        continue;
      }
      cachedBackendEndpoint = endpoint;
      return { response, endpoint, url };
    } catch (error) {
      attempts.push(`${endpoint.label} ${error.message}`);
    }
  }

  const error = new Error("All backend endpoints failed");
  error.attempts = attempts;
  throw error;
}

// --- Core Application Logic Functions ---




async function downloadAssets(assets) {
  if (!assets || assets.length === 0) {
    return { success: false, error: "No assets to download" };
  }

  const downloadResults = [];
  const failedDownloads = [];

  try {
    for (const asset of assets) {
      try {
        const url = new URL(asset.url);
        const pathParts = url.pathname.split('/');
        let filename = pathParts[pathParts.length - 1] || 'download';
        
        if (!filename.includes('.')) {
          const extensions = {
            'image': '.jpg',
            'stylesheet': '.css',
            'script': '.js',
            'font': '.woff',
            'video': '.mp4',
            'audio': '.mp3'
          };
          filename += extensions[asset.type] || '.txt';
        }

        const downloadId = await chrome.downloads.download({
          url: asset.url,
          filename: `CSS-Picker-Assets/${asset.type}s/${filename}`,
          conflictAction: 'uniquify'
        });

        downloadResults.push({
          id: downloadId,
          url: asset.url,
          filename: filename,
          type: asset.type
        });

        console.log(`Download started: ${filename} (ID: ${downloadId})`);

      } catch (error) {
        console.error(`Failed to download asset: ${asset.url}`, error);
        failedDownloads.push({
          url: asset.url,
          error: error.message
        });
      }
    }

    return {
      success: true,
      downloadedCount: downloadResults.length,
      failedCount: failedDownloads.length,
      downloads: downloadResults,
      failures: failedDownloads
    };

  } catch (error) {
    console.error("Download assets error:", error);
    return { success: false, error: error.message };
  }
}

// --- Event Handlers ---

async function handleActionClick(tab) {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
    activeTabId = tab.id;
  } catch (error) {
    console.error("Failed to open side panel:", error);
  }
}

async function enablePicker() {
  isPickerActive = true;
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs[0]?.id) {
    activeTabId = tabs[0].id;
    try {
      await chrome.tabs.sendMessage(activeTabId, {
        action: "border-on",
        timestamp: Date.now()
      });
    } catch (messageError) {
      await chrome.scripting.executeScript({
        target: { tabId: activeTabId },
        files: ['content.js']
      });
      await chrome.tabs.sendMessage(activeTabId, {
        action: "border-on",
        timestamp: Date.now()
      });
    }
    console.log("Picker enabled for tab:", activeTabId);
  }
}

async function disablePicker() {
  isPickerActive = false;
  if (!activeTabId) return;
  try {
    await chrome.tabs.sendMessage(activeTabId, {
      action: "border-off",
      timestamp: Date.now()
    });
  } catch (messageError) {
    console.log("Content script not loaded, normal for picker disable");
  }
  console.log("Picker disabled for tab:", activeTabId);
}

function handleTabChange(activeInfo) {
  if (isPickerActive && activeTabId !== activeInfo.tabId) {
    disablePicker();
    activeTabId = activeInfo.tabId;
    setTimeout(() => {
      if (isPickerActive) {
        enablePicker();
      }
    }, 100);
  }
}

function handleTabUpdate(tabId, changeInfo) {
  if (changeInfo.status === "complete" && isPickerActive && tabId === activeTabId) {
    setTimeout(() => {
      enablePicker();
    }, 500);
  }
}

function handleDownloadChange(delta) {
  if (delta.state?.current === 'complete') {
    console.log(`Download completed: ${delta.id}`);
    chrome.runtime.sendMessage({
      type: 'download_complete',
      downloadId: delta.id
    }).catch(() => {});
  } else if (delta.state?.current === 'interrupted') {
    console.error(`Download failed: ${delta.id}`);
    chrome.runtime.sendMessage({
      type: 'download_failed',
      downloadId: delta.id,
      error: delta.error
    }).catch(() => {});
  }
}

// --- V3 Event Listeners ---

// 1. Action (Icon) Click Listener
chrome.action.onClicked.addListener(handleActionClick);

// 2. Tab Change and Update Listeners
chrome.tabs.onActivated.addListener(handleTabChange);
chrome.tabs.onUpdated.addListener(handleTabUpdate);

// 3. Downloads Listener
chrome.downloads.onChanged.addListener(handleDownloadChange);



// 4. Message Listener (Handles communication from popup, sidepanel, etc.)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const normalizedType = 
    typeof message?.type === "string" ? message.type.trim().toLowerCase() : message?.type;
  const normalizedAction =
    typeof message?.action === "string" ? message.action.trim().toLowerCase() : message?.action;

  switch (normalizedType || normalizedAction) { // check both type and action
    case "login":
      loginWithGoogle().then(sendResponse);
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

        case "sidepanel_opened":
      sendResponse({ success: true });
      break;

    case "sidepanel_closed":
      disablePicker();
      sendResponse({ success: true });
      break;

    case "picker_enable":
      enablePicker();
      sendResponse({ success: true });
      break;

    case "picker_disable":
      disablePicker();
      sendResponse({ success: true });
      break;

    case "download_assets":
      downloadAssets(message.assets).then(sendResponse).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;

    
    // Fallback for unknown messages or health check pings
    case "ping":
      // A simple ping-pong for health check
      sendResponse({ status: "pong" });
      break;


    default:
      console.warn("Unknown message type received:", message);
      sendResponse({ success: false, error: (normalizedType || normalizedAction) ? `Unknown message type: ${normalizedType || normalizedAction}` : 'Unknown message type' });
      break;
  }
});

// 5. Alarms Listener (Replaces setInterval for health checks)
chrome.alarms.create("sidePanelHealthCheck", { periodInMinutes: 0.05 }); // 3 seconds

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "sidePanelHealthCheck" && isPickerActive) {
    chrome.runtime.sendMessage({ ping: true }, (response) => {
      if (chrome.runtime.lastError || !response) {
        console.log("Side panel disconnected, disabling picker");
        disablePicker();
      }
    });
  }})