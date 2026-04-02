
/* global firebaseConfig */

importScripts('./config.js');

const firebaseConfig = self.firebaseConfig || {};
const FIREBASE_API_KEY = firebaseConfig.apiKey;
const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
const FIREBASE_SIGNIN_URL = FIREBASE_API_KEY
  ? `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`
  : null;
const FIREBASE_TOKEN_URL = FIREBASE_API_KEY
  ? `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`
  : null;
const FIRESTORE_BASE_URL = FIREBASE_PROJECT_ID
  ? `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`
  : null;

const AUTH_STORAGE_KEY = 'csspicker_auth_state';

const authState = {
  currentUser: null,
  idToken: null,
  refreshToken: null,
  tokenExpiry: 0,
};

const authListeners = new Set();
let resolveAuthReady;
const authReadyPromise = new Promise((resolve) => {
  resolveAuthReady = resolve;
});

restoreAuthState();

const TOKEN_REFRESH_BUFFER_MS = 60_000;

function restoreAuthState() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    resolveAuthReady();
    return;
  }

  chrome.storage.local.get([AUTH_STORAGE_KEY], async (result) => {
    try {
      const stored = result?.[AUTH_STORAGE_KEY];
      if (stored?.user && stored?.refreshToken) {
        authState.currentUser = stored.user;
        authState.refreshToken = stored.refreshToken;
        authState.idToken = stored.idToken || null;
        authState.tokenExpiry = stored.tokenExpiry || 0;

        if (!authState.idToken || Date.now() >= (authState.tokenExpiry || 0) - TOKEN_REFRESH_BUFFER_MS) {
          try {
            await refreshIdToken(true);
          } catch (error) {
            console.warn('Token refresh during restore failed:', error?.message || error);
            clearAuthState(false);
          }
        } else {
          persistAuthState();
        }

        if (authState.currentUser) {
          notifyAuthListeners();
        }
      }
    } catch (error) {
      console.warn('Failed to restore auth state:', error);
      clearAuthState(false);
    } finally {
      resolveAuthReady();
    }
  });
}

function notifyAuthListeners() {
  for (const listener of authListeners) {
    try {
      listener(authState.currentUser);
    } catch (error) {
      console.warn('Auth listener failed:', error);
    }
  }
}

function persistAuthState() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return;
  }

  if (!authState.currentUser || !authState.refreshToken) {
    chrome.storage.local.remove(AUTH_STORAGE_KEY, () => {
      if (chrome.runtime?.lastError) {
        console.warn('Auth state removal warning:', chrome.runtime.lastError);
      }
    });
    return;
  }

  const payload = {
    [AUTH_STORAGE_KEY]: {
      user: authState.currentUser,
      refreshToken: authState.refreshToken,
      idToken: authState.idToken,
      tokenExpiry: authState.tokenExpiry,
    },
  };

  chrome.storage.local.set(payload, () => {
    if (chrome.runtime?.lastError) {
      console.warn('Auth state persist warning:', chrome.runtime.lastError);
    }
  });
}

function clearAuthState(notify = true) {
  authState.currentUser = null;
  authState.idToken = null;
  authState.refreshToken = null;
  authState.tokenExpiry = 0;

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.remove(AUTH_STORAGE_KEY, () => {
      if (chrome.runtime?.lastError) {
        console.warn('Auth state clear warning:', chrome.runtime.lastError);
      }
    });
  }

  if (notify) {
    notifyAuthListeners();
  }
}

function applyAuthSession(session) {
  authState.currentUser = session.user;
  authState.idToken = session.idToken;
  authState.refreshToken = session.refreshToken;
  authState.tokenExpiry = session.tokenExpiry;
  persistAuthState();
  notifyAuthListeners();
}

function buildUserFromSignInResponse(payload = {}) {
  const providerId = 'google.com';
  const providerUid = payload.rawId || payload.federatedId || null;

  return {
    uid: payload.localId || null,
    email: payload.email || null,
    displayName: payload.displayName || payload.fullName || null,
    firstName: payload.firstName || null,
    lastName: payload.lastName || null,
    photoURL: payload.photoUrl || null,
    emailVerified: Boolean(
      payload.emailVerified !== undefined ? payload.emailVerified : true
    ),
    phoneNumber: payload.phoneNumber || null,
    providerData: [
      {
        providerId,
        uid: providerUid,
        displayName: payload.displayName || null,
        email: payload.email || null,
        phoneNumber: payload.phoneNumber || null,
        photoURL: payload.photoUrl || null,
      },
    ],
  };
}

async function getIdToken(forceRefresh = false) {
  await authReadyPromise;
  if (!authState.currentUser || !authState.refreshToken) {
    return null;
  }

  if (
    !forceRefresh &&
    authState.idToken &&
    Date.now() < (authState.tokenExpiry || 0) - TOKEN_REFRESH_BUFFER_MS
  ) {
    return authState.idToken;
  }

  try {
    return await refreshIdToken(true);
  } catch (error) {
    console.error('Failed to refresh ID token:', error);
    clearAuthState();
    return null;
  }
}

async function refreshIdToken(force = false) {
  if (!authState.refreshToken) {
    throw new Error('No refresh token available');
  }
  if (!FIREBASE_TOKEN_URL) {
    throw new Error('Firebase API key not configured');
  }

  if (
    !force &&
    authState.idToken &&
    Date.now() < (authState.tokenExpiry || 0) - TOKEN_REFRESH_BUFFER_MS
  ) {
    return authState.idToken;
  }

  const response = await fetch(FIREBASE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(
      authState.refreshToken
    )}`,
  });

  if (!response.ok) {
    const details = await safeReadError(response);
    throw new Error(`Token refresh failed (${response.status}): ${details}`);
  }

  const data = await response.json();
  const expiresInSeconds = Number(data.expires_in || data.expiresIn || 0);

  authState.idToken = data.id_token || data.idToken || null;
  authState.tokenExpiry = expiresInSeconds
    ? Date.now() + Math.max(expiresInSeconds - 60, 30) * 1000
    : 0;
  authState.refreshToken =
    data.refresh_token || data.refreshToken || authState.refreshToken;

  persistAuthState();
  return authState.idToken;
}

async function safeReadError(response) {
  try {
    const text = await response.text();
    return text.slice(0, 512) || 'No response body';
  } catch (error) {
    return `Failed to read error body: ${error?.message || error}`;
  }
}

async function fetchFirestoreUserDocument(uid, idToken) {
  if (!FIRESTORE_BASE_URL) {
    throw new Error('Firestore not configured');
  }

  const url = `${FIRESTORE_BASE_URL}/users/${encodeURIComponent(uid)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (response.status === 404) {
    return {};
  }

  if (!response.ok) {
    const details = await safeReadError(response);
    throw new Error(`Firestore fetch failed (${response.status}): ${details}`);
  }

  const data = await response.json();
  return decodeFirestoreFields(data.fields || {});
}

function decodeFirestoreFields(fields = {}) {
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = decodeFirestoreValue(value);
  }
  return result;
}

function decodeFirestoreValue(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return Boolean(value.booleanValue);
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('mapValue' in value) {
    return decodeFirestoreFields(value.mapValue?.fields || {});
  }
  if ('arrayValue' in value) {
    const arr = value.arrayValue?.values || [];
    return arr.map((entry) => decodeFirestoreValue(entry));
  }
  if ('referenceValue' in value) return value.referenceValue;
  if ('geoPointValue' in value) return value.geoPointValue;

  return value;
}

const BACKEND_ENDPOINTS = [
  {
    label: "functions:prod",
    baseUrl: "https://us-central1-project-fastsaas.cloudfunctions.net",
  },
  {
    label: "functions:emulator",
    baseUrl: "http://127.0.0.1:5001/project-fastsaas/us-central1",
    emulator: true,
  },
];

function normalizePlanValue(plan) {
  if (!plan) return "free";
  const normalized = String(plan).trim().toLowerCase().replace(/\s+/g, "_");
  const premiumTokens = new Set([
    "premium",
    "premium_active",
    "premium_user",
    "paid",
    "paid_user",
    "active_paid",
    "pro",
    "lifetime",
  ]);
  return premiumTokens.has(normalized) ? "premium" : "free";
}


let isPickerActive = false;
let activeTabId = null;
let cachedBackendEndpoint = null;
// --- Core Application Logic Functions ---

async function loginWithGoogle() {
  await authReadyPromise;

  if (!FIREBASE_SIGNIN_URL) {
    return {
      success: false,
      error: "Firebase authentication is not configured.",
    };
  }

  const redirectUri = chrome.identity.getRedirectURL();
  const clientId = "50897249016-u2s4265ncehujgob91dh0rqqupo50bqh.apps.googleusercontent.com"; // This clientId is from manifest.json oauth2
  const authUrl =
    "https://accounts.google.com/o/oauth2/auth" +
    `?client_id=${clientId}` +
    `&response_type=token%20id_token` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=openid%20email%20profile` +
    `&prompt=select_account`;

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

    const fragment = redirectUrl.split("#")[1] || "";
    const params = new URLSearchParams(fragment);
    const accessToken = params.get("access_token");
    const idTokenHint = params.get("id_token");

    if (!accessToken && !idTokenHint) {
      console.error("No access_token or id_token found in redirect URL");
      return { success: false, error: "No OAuth token returned." };
    }

    const postBody = new URLSearchParams();
    if (idTokenHint) {
      postBody.append("id_token", idTokenHint);
    } else if (accessToken) {
      postBody.append("access_token", accessToken);
    }
    postBody.append("providerId", "google.com");

    const response = await fetch(FIREBASE_SIGNIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postBody: postBody.toString(),
        requestUri: redirectUri,
        returnSecureToken: true,
        returnIdpCredential: true,
      }),
    });

    if (!response.ok) {
      const details = await safeReadError(response);
      throw new Error(`Firebase signInWithIdp failed (${response.status}): ${details}`);
    }

    const firebaseAuthData = await response.json();
    const session = {
      user: buildUserFromSignInResponse(firebaseAuthData),
      idToken: firebaseAuthData.idToken || firebaseAuthData.id_token || null,
      refreshToken: firebaseAuthData.refreshToken || firebaseAuthData.refresh_token || null,
      tokenExpiry: (() => {
        const expiresIn = Number(firebaseAuthData.expiresIn || firebaseAuthData.expires_in || 0);
        return expiresIn ? Date.now() + Math.max(expiresIn - 60, 30) * 1000 : 0;
      })(),
    };

    if (!session.user?.uid || !session.idToken || !session.refreshToken) {
      throw new Error("Incomplete authentication response from Firebase.");
    }

    applyAuthSession(session);
    console.log("✅ Firebase Google Sign-In successful (REST)!");
    return { success: true, user: serializeUser(session.user) };
  } catch (error) {
    console.error("Login process failed:", error);
    return { success: false, error: error.message || "Login failed." };
  }
}

async function getUserProfile() {
  await authReadyPromise;
  const user = authState.currentUser;

  if (!user) {
    return { success: false, error: "No user logged in" };
  }

  try {
    const idToken = await getIdToken(false);
    if (!idToken) {
      return { success: false, error: "Missing ID token" };
    }

    const profileData = await fetchFirestoreUserDocument(user.uid, idToken);
    const plan = normalizePlanValue(
      profileData.plan ||
        profileData.subscriptionStatus ||
        profileData.status
    );
    const enrichedProfile = {
      ...profileData,
      plan,
      status: profileData.status || plan,
      subscriptionStatus: profileData.subscriptionStatus || plan,
    };

    return {
      success: true,
      user: { ...serializeUser(user), ...enrichedProfile },
    };
  } catch (error) {
    console.error("Firestore getDoc error:", error);
    return {
      success: false,
      error: "Failed to fetch user data from Firestore.",
    };
  }
}

async function signOutUser() {
  await authReadyPromise;
  clearAuthState();
  return { success: true };
}

// ... (The rest of the functions like downloadAssets, handleActionClick, etc. remain the same) ...



// --- Utility Functions ---

function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email || null,
    name: user.displayName || user.name || null,
    displayName: user.displayName || user.name || null,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    photoURL: user.photoURL || null,
    emailVerified: Boolean(user.emailVerified),
    phoneNumber: user.phoneNumber || null,
    providerData: (user.providerData || []).map((provider) => ({
      providerId: provider.providerId,
      uid: provider.uid,
      displayName: provider.displayName || null,
      email: provider.email || null,
      phoneNumber: provider.phoneNumber || null,
      photoURL: provider.photoURL || null,
    })),
  };
}

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

// Wraps fetchFromBackend to return parsed JSON payloads alongside endpoint info.
async function fetchBackendJson(path, init = {}) {
  const { response, endpoint, url } = await fetchFromBackend(path, init);
  let data;
  try {
    data = await response.json();
  } catch (err) {
    const parseError = new Error(`Failed to parse JSON from ${url}: ${err.message}`);
    parseError.responseStatus = response.status;
    throw parseError;
  }
  return { data, endpoint, url };
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
      signOutUser()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error("Sign-out error:", error);
          sendResponse({ success: false, error: error?.message || "Sign out failed." });
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

    case "element_clicked":
      if (message.__fromServiceWorkerRelay) {
        // Already relayed to sidepanel; nothing else to do.
        if (typeof sendResponse === "function") {
          sendResponse({ success: true });
        }
        break;
      }

      try {
        chrome.runtime.sendMessage(
          { ...message, __fromServiceWorkerRelay: true },
          () => {
            if (chrome.runtime.lastError) {
              console.debug(
                "element_clicked relay encountered runtime error:",
                chrome.runtime.lastError.message
              );
            }
          }
        );
      } catch (relayError) {
        console.error("Failed to relay element_clicked to sidepanel:", relayError);
      }

      if (typeof sendResponse === "function") {
        sendResponse({ success: true });
      }
      break;

    case "plan_manager:fetch_plan":
      (async () => {
        try {
          await authReadyPromise;
          const currentUser = authState.currentUser;
          if (!currentUser) {
            sendResponse({ success: false, error: "Not authenticated" });
            return;
          }

          if (message.userId && message.userId !== currentUser.uid) {
            sendResponse({ success: false, error: "UID mismatch" });
            return;
          }

          const idToken = await getIdToken(false);
          if (!idToken) {
            sendResponse({ success: false, error: "Missing ID token" });
            return;
          }

          const { data, endpoint } = await fetchBackendJson("/getUserPlan", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          sendResponse({
            success: true,
            plan: data?.plan || data?.status || "free",
            source: "backend",
            endpoint: endpoint?.label || null,
          });
        } catch (error) {
          console.error("Failed to fetch plan from backend:", error);
          sendResponse({
            success: false,
            error: error?.message || "Plan fetch failed",
          });
        }
      })();
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
