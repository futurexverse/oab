// Bank of America - Firebase Cloud Database Configuration
// This enables cross-device sync: accounts created on one device can log in on any device!

window.BOA_DEFAULT_FIREBASE_URL = "https://boa-online-banking-demo-default-rtdb.firebaseio.com";

// Clear stale placeholder from localStorage if it exists
try {
  const savedUrl = localStorage.getItem("boa_firebase_url");
  if (!savedUrl || savedUrl.includes("YOUR-PROJECT-ID")) {
    localStorage.setItem("boa_firebase_url", window.BOA_DEFAULT_FIREBASE_URL);
  }
} catch (e) {}

window.BOA_FIREBASE_URL =
  localStorage.getItem("boa_firebase_url") ||
  window.BOA_DEFAULT_FIREBASE_URL;
