// Bank of America - Cross-Device Firebase Cloud Database Synchronization Engine
// Synchronizes registered accounts, balances, transfers, and deposits across all devices in real-time.

(function () {
  const DEFAULT_TIMEOUT_MS = 4000;

  function getBaseUrl() {
    const raw =
      localStorage.getItem("boa_firebase_url") ||
      window.BOA_FIREBASE_URL ||
      window.BOA_DEFAULT_FIREBASE_URL ||
      "";
    if (!raw) return "";
    let clean = raw.trim();
    if (clean.endsWith("/")) clean = clean.slice(0, -1);
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = "https://" + clean;
    }
    return clean;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { credentials: "omit", ...options, credentials: "omit", signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  const firebaseDB = {
    isConfigured() {
      const url = getBaseUrl();
      return Boolean(url && url.includes(".firebaseio.com"));
    },

    getBaseUrl,

    setBaseUrl(url) {
      if (!url) {
        localStorage.removeItem("boa_firebase_url");
        window.BOA_FIREBASE_URL = "";
      } else {
        let clean = url.trim();
        if (clean.endsWith("/")) clean = clean.slice(0, -1);
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
          clean = "https://" + clean;
        }
        localStorage.setItem("boa_firebase_url", clean);
        window.BOA_FIREBASE_URL = clean;
      }
    },

    async testConnection() {
      const url = getBaseUrl();
      if (!url) return { ok: false, error: "No Firebase Realtime Database URL specified." };
      try {
        const testRes = await fetchWithTimeout(`${url}/.json?shallow=true`, { method: "GET" }, 5000);
        if (testRes.ok) {
          return { ok: true, status: "Connected successfully to Firebase Realtime Database." };
        } else {
          return { ok: false, error: `Firebase returned status ${testRes.status}. Check database security rules.` };
        }
      } catch (err) {
        return { ok: false, error: `Connection failed: ${err.message || "Network timeout or invalid URL"}` };
      }
    },

    // ==================== User Synchronization ====================
    async saveUser(user) {
      if (!user || !user.username) return false;
      const key = user.username.trim().toLowerCase();

      // Always save to local storage immediately
      try {
        const localRaw = localStorage.getItem("boa_registered_users");
        let list = localRaw ? JSON.parse(localRaw) : [];
        const idx = list.findIndex((u) => u.username.toLowerCase() === key);
        if (idx >= 0) {
          list[idx] = Object.assign({}, list[idx], user);
        } else {
          list.push(user);
        }
        localStorage.setItem("boa_registered_users", JSON.stringify(list));
      } catch (e) {
        console.warn("Local storage write error:", e);
      }

      // If Firebase is configured, sync to cloud
      if (this.isConfigured()) {
        try {
          const url = `${getBaseUrl()}/users/${encodeURIComponent(key)}.json`;
          await fetchWithTimeout(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user)
          });
          return true;
        } catch (err) {
          console.warn("Firebase user save error:", err);
        }
      }
      return true;
    },

    async getUser(username) {
      if (!username) return null;
      const key = username.trim().toLowerCase();

      // First check local storage for instant response
      let localUser = null;
      try {
        const localRaw = localStorage.getItem("boa_registered_users");
        const list = localRaw ? JSON.parse(localRaw) : [];
        localUser = list.find((u) => u.username && u.username.toLowerCase() === key) || null;
      } catch (e) {}

      // If Firebase is configured, query cloud for authoritative / newly created users from other devices
      if (this.isConfigured()) {
        try {
          const url = `${getBaseUrl()}/users/${encodeURIComponent(key)}.json`;
          const res = await fetchWithTimeout(url, { method: "GET" }, 3500);
          if (res.ok) {
            const cloudUser = await res.json();
            if (cloudUser && cloudUser.username) {
              // Cache into local storage
              await this.saveUser(cloudUser);
              return cloudUser;
            }
          }
        } catch (err) {
          console.warn("Firebase getUser error:", err);
        }
      }

      return localUser;
    },

    async getAllUsers() {
      let localList = [];
      try {
        const localRaw = localStorage.getItem("boa_registered_users");
        localList = localRaw ? JSON.parse(localRaw) : [];
      } catch (e) {}

      if (this.isConfigured()) {
        try {
          const url = `${getBaseUrl()}/users.json`;
          const res = await fetchWithTimeout(url, { method: "GET" }, 4000);
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data === "object") {
              const cloudUsers = Object.values(data).filter((u) => u && u.username);
              // Merge cloud users with local users
              const map = new Map();
              localList.forEach((u) => map.set(u.username.toLowerCase(), u));
              cloudUsers.forEach((u) => map.set(u.username.toLowerCase(), u));
              const merged = Array.from(map.values());
              localStorage.setItem("boa_registered_users", JSON.stringify(merged));
              return merged;
            }
          }
        } catch (err) {
          console.warn("Firebase getAllUsers error:", err);
        }
      }

      return localList;
    },

    // ==================== Balances Synchronization ====================
    async syncBalances() {
      let localBalances = {};
      try {
        const raw = localStorage.getItem("boa_balances");
        if (raw) localBalances = JSON.parse(raw);
      } catch (e) {}

      if (this.isConfigured()) {
        try {
          const url = `${getBaseUrl()}/balances.json`;
          const res = await fetchWithTimeout(url, { method: "GET" }, 3500);
          if (res.ok) {
            const cloudBalances = await res.json();
            if (cloudBalances && typeof cloudBalances === "object") {
              // Cloud balances take priority for authoritative sync
              const merged = Object.assign({}, localBalances, cloudBalances);
              localStorage.setItem("boa_balances", JSON.stringify(merged));
              return merged;
            }
          }
        } catch (err) {
          console.warn("Firebase syncBalances error:", err);
        }
      }
      return localBalances;
    },

    async setBalance(accountId, amount) {
      if (!accountId) return;
      const num = Math.round(Number(amount) * 100) / 100;

      // Update local storage
      try {
        const raw = localStorage.getItem("boa_balances");
        const b = raw ? JSON.parse(raw) : {};
        b[accountId] = num;
        localStorage.setItem("boa_balances", JSON.stringify(b));
      } catch (e) {}

      // Update Firebase
      if (this.isConfigured()) {
        try {
          const url = `${getBaseUrl()}/balances/${encodeURIComponent(accountId)}.json`;
          await fetchWithTimeout(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(num)
          });
        } catch (err) {
          console.warn("Firebase setBalance error:", err);
        }
      }
    },

    // ==================== Pending Transfers Synchronization ====================
    async syncTransfers() {
      let localTransfers = [];
      try {
        const raw = localStorage.getItem("boa_pending_tx");
        if (raw) localTransfers = JSON.parse(raw);
      } catch (e) {}

      if (this.isConfigured()) {
        try {
          const url = `${getBaseUrl()}/transfers.json`;
          const res = await fetchWithTimeout(url, { method: "GET" }, 3500);
          if (res.ok) {
            const cloudData = await res.json();
            if (cloudData && typeof cloudData === "object") {
              const cloudList = Object.values(cloudData).filter((t) => t && t.txId);
              // Deduplicate by txId
              const map = new Map();
              localTransfers.forEach((t) => map.set(t.txId, t));
              cloudList.forEach((t) => map.set(t.txId, t));
              const merged = Array.from(map.values());
              localStorage.setItem("boa_pending_tx", JSON.stringify(merged));
              return merged;
            }
          }
        } catch (err) {
          console.warn("Firebase syncTransfers error:", err);
        }
      }
      return localTransfers;
    },

    async saveTransfer(tx) {
      if (!tx || !tx.txId) return;

      // Save locally
      try {
        const raw = localStorage.getItem("boa_pending_tx");
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex((t) => t.txId === tx.txId);
        if (idx >= 0) list[idx] = tx;
        else list.unshift(tx);
        localStorage.setItem("boa_pending_tx", JSON.stringify(list));
      } catch (e) {}

      // Save to Firebase
      if (this.isConfigured()) {
        try {
          const url = `${getBaseUrl()}/transfers/${encodeURIComponent(tx.txId)}.json`;
          await fetchWithTimeout(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tx)
          });
        } catch (err) {
          console.warn("Firebase saveTransfer error:", err);
        }
      }
    },

    async removeTransfer(txId) {
      if (!txId) return;
      try {
        const raw = localStorage.getItem("boa_pending_tx");
        if (raw) {
          const list = JSON.parse(raw).filter((t) => t.txId !== txId);
          localStorage.setItem("boa_pending_tx", JSON.stringify(list));
        }
      } catch (e) {}

      if (this.isConfigured()) {
        try {
          const url = `${getBaseUrl()}/transfers/${encodeURIComponent(txId)}.json`;
          await fetchWithTimeout(url, { method: "DELETE" });
        } catch (err) {
          console.warn("Firebase removeTransfer error:", err);
        }
      }
    },

    // ==================== Pending Deposits Synchronization ====================
    async syncDeposits() {
      let localDeposits = [];
      try {
        const raw = localStorage.getItem("boa_pending_deposits");
        if (raw) localDeposits = JSON.parse(raw);
      } catch (e) {}

      if (this.isConfigured()) {
        try {
          const url = `${getBaseUrl()}/deposits.json`;
          const res = await fetchWithTimeout(url, { method: "GET" }, 3500);
          if (res.ok) {
            const cloudData = await res.json();
            if (cloudData && typeof cloudData === "object") {
              const cloudList = Object.values(cloudData).filter((d) => d && d.id);
              const map = new Map();
              localDeposits.forEach((d) => map.set(d.id, d));
              cloudList.forEach((d) => map.set(d.id, d));
              const merged = Array.from(map.values());
              localStorage.setItem("boa_pending_deposits", JSON.stringify(merged));
              return merged;
            }
          }
        } catch (err) {
          console.warn("Firebase syncDeposits error:", err);
        }
      }
      return localDeposits;
    },

    async saveDeposit(dep) {
      if (!dep || !dep.id) return;

      // Save locally
      try {
        const raw = localStorage.getItem("boa_pending_deposits");
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex((d) => d.id === dep.id);
        if (idx >= 0) list[idx] = dep;
        else list.unshift(dep);
        localStorage.setItem("boa_pending_deposits", JSON.stringify(list));
      } catch (e) {}

      // Save to Firebase
      if (this.isConfigured()) {
        try {
          const url = `${getBaseUrl()}/deposits/${encodeURIComponent(dep.id)}.json`;
          await fetchWithTimeout(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dep)
          });
        } catch (err) {
          console.warn("Firebase saveDeposit error:", err);
        }
      }
    },

    // Sync all data on page load
    async syncAll() {
      if (!this.isConfigured()) return;
      try {
        await Promise.allSettled([
          this.getAllUsers(),
          this.syncBalances(),
          this.syncTransfers(),
          this.syncDeposits()
        ]);
      } catch (err) {
        console.warn("Firebase syncAll error:", err);
      }
    }
  };

  // Expose globally
  window.firebaseDB = firebaseDB;

  // Background auto-sync if configured
  if (firebaseDB.isConfigured()) {
    setTimeout(() => {
      firebaseDB.syncAll();
    }, 200);
  }
})();
