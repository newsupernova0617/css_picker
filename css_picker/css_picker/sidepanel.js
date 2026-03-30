// ===== Sidepanel Script Entry Point (ES6 Module) =====
// This wraps the modular sidepanel for Chrome Manifest V3
// Imports from: sidepanel/sidepanel.js

import { SidePanel } from './sidepanel/sidepanel-ui.js';
import { TailwindConverter } from './sidepanel/tailwind-converter.js';
import { ConsoleManager } from './sidepanel/console-manager.js';
import { handleLoginSuccess } from './sidepanel/auth-handler.js';

console.log('===== SIDEPANEL.JS START =====');
console.log('This file is loading at:', new Date().toISOString());
console.log('🚨 HTML inline script moved to sidepanel.js');
console.log('Chrome object exists?', typeof chrome !== 'undefined');
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('Extension ID:', chrome.runtime.id);
}

// Instantiate PlanManager and make it globally available
const planManager = new PlanManager();
window.planManager = planManager;

// Initialize SidePanel
const sidePanel = new SidePanel();

document.addEventListener("DOMContentLoaded", () => {
  const signInBtn = document.getElementById("signInBtn");
  const signOutBtn = document.getElementById("signOutBtn");
  const authSignedOut = document.getElementById("authSignedOut");
  const authSignedIn = document.getElementById("authSignedIn");
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const premiumSection = document.getElementById("premiumSection");
  const authLoading = document.getElementById("authLoading");

  // 로그인 버튼
  signInBtn.addEventListener("click", () => {
    authLoading.style.display = "block";
    chrome.runtime.sendMessage({ type: "login" }, (response) => {
      authLoading.style.display = "none";
      if (response?.success) {
        chrome.runtime.sendMessage({ type: "get_profile" }, (resp) => {
          if (resp?.success) {
            sidePanel.showUser(resp.user);
          }
        });
      }
    });
  });

  // 로그아웃 버튼
  signOutBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "logout" }, () => {
      authSignedOut.style.display = "block";
      authSignedIn.style.display = "none";
      premiumSection.style.display = "none";
    });
  });

  // Page load 시 user 정보 check
  chrome.runtime.sendMessage({ type: "get_profile" }, (result) => {
    if (result?.success) {
      sidePanel.showUser(result.user);
    }
  });
});

export { sidePanel, handleLoginSuccess };
