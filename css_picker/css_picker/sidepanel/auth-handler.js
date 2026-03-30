export async function handleLoginSuccess() {
  const result = await chrome.runtime.sendMessage({ type: "get_profile" });
  if (result.success) {
    document.getElementById("authSignedOut").style.display = "none";
    document.getElementById("authSignedIn").style.display = "block";
    document.getElementById("userName").textContent = result.user.name;
    document.getElementById("userEmail").textContent = result.user.email;
    window.sidePanel.showUser(result.user);
  } else {
    // fallback: 여전히 signed-out 보여주기
    document.getElementById("authSignedOut").style.display = "block";
    document.getElementById("authSignedIn").style.display = "none";
  }
}
