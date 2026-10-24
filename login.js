// Bank of America Login Screen — Logic and Validation

// Default valid credentials
const VALID_USERNAME = "ExecutiveEmpire";
const VALID_PASSCODE = "080297";
const USERS_STORAGE_KEY = "boa_registered_users";

// Helper functions for user storage
function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveRegisteredUser(user) {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function findUser(username, password) {
  const users = getRegisteredUsers();
  return users.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() &&
      u.password === password
  );
}

function isUsernameTaken(username) {
  const lower = username.toLowerCase();
  if (lower === "david" || lower === VALID_USERNAME.toLowerCase()) {
    return true;
  }
  const users = getRegisteredUsers();
  return users.some((u) => u.username.toLowerCase() === lower);
}

document.addEventListener("DOMContentLoaded", () => {
  // Tabs & Forms
  const tabBtnSignIn = document.getElementById("tab-btn-signin");
  const tabBtnRegister = document.getElementById("tab-btn-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const linkToRegister = document.getElementById("link-to-register");
  const linkToSignIn = document.getElementById("link-to-signin");

  // Sign In inputs
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const saveIdCheckbox = document.getElementById("save-id");
  const togglePasswordBtn = document.getElementById("toggle-password");
  const biometricBtn = document.getElementById("biometric-btn");

  // Register inputs
  const regFullName = document.getElementById("reg-fullname");
  const regUsername = document.getElementById("reg-username");
  const regEmail = document.getElementById("reg-email");
  const regPassword = document.getElementById("reg-password");
  const regConfirmPassword = document.getElementById("reg-confirm-password");
  const regAccountType = document.getElementById("reg-account-type");

  const toggleRegPasswordBtn = document.getElementById("toggle-reg-password");
  const toggleRegConfirmPasswordBtn = document.getElementById("toggle-reg-confirm-password");

  const formFeedback = document.getElementById("form-feedback");
  const loadingOverlay = document.getElementById("loading-overlay");

  const usernameWrapper = usernameInput.parentElement;
  const passwordWrapper = passwordInput.parentElement;

  // ==================== Switch Auth Tabs ====================
  function showSignInTab() {
    tabBtnSignIn.classList.add("active");
    tabBtnSignIn.setAttribute("aria-selected", "true");
    tabBtnRegister.classList.remove("active");
    tabBtnRegister.setAttribute("aria-selected", "false");

    loginForm.style.display = "block";
    registerForm.style.display = "none";
  }

  function showRegisterTab() {
    tabBtnRegister.classList.add("active");
    tabBtnRegister.setAttribute("aria-selected", "true");
    tabBtnSignIn.classList.remove("active");
    tabBtnSignIn.setAttribute("aria-selected", "false");

    loginForm.style.display = "none";
    registerForm.style.display = "block";
  }

  if (tabBtnSignIn) tabBtnSignIn.addEventListener("click", showSignInTab);
  if (tabBtnRegister) tabBtnRegister.addEventListener("click", showRegisterTab);
  if (linkToRegister) {
    linkToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      showRegisterTab();
    });
  }
  if (linkToSignIn) {
    linkToSignIn.addEventListener("click", (e) => {
      e.preventDefault();
      showSignInTab();
    });
  }

  // ==================== Pre-fill saved login ====================
  const savedOnlineId = localStorage.getItem("boa_saved_online_id");
  const savedPasscode = localStorage.getItem("boa_saved_passcode");
  if (savedOnlineId) {
    usernameInput.value = savedOnlineId;
  }
  if (savedPasscode) {
    passwordInput.value = savedPasscode;
  }
  if (savedOnlineId || savedPasscode) {
    saveIdCheckbox.checked = true;
  }

  // ==================== URL Query Parameters ====================
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("logout") === "true") {
    showFormFeedback("You have signed out successfully.", "success");
  } else if (urlParams.get("redirect") === "true") {
    showFormFeedback("Please sign in to access your accounts.", "info");
  }

  function showFormFeedback(msg, type) {
    formFeedback.textContent = msg;
    formFeedback.className = `form-feedback ${type}`;
    formFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ==================== Toggle Password Visibility ====================
  function bindPasswordToggle(btn, input) {
    if (!btn || !input) return;
    btn.addEventListener("click", () => {
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "Hide";
      } else {
        input.type = "password";
        btn.textContent = "Show";
      }
    });
  }

  bindPasswordToggle(togglePasswordBtn, passwordInput);
  bindPasswordToggle(toggleRegPasswordBtn, regPassword);
  bindPasswordToggle(toggleRegConfirmPasswordBtn, regConfirmPassword);

  usernameInput.addEventListener("input", () => {
    usernameWrapper.classList.remove("has-error");
  });

  passwordInput.addEventListener("input", () => {
    passwordWrapper.classList.remove("has-error");
  });

  [regFullName, regUsername, regEmail, regPassword, regConfirmPassword].forEach((input) => {
    if (input) {
      input.addEventListener("input", () => {
        const wrap = input.parentElement;
        if (wrap) wrap.classList.remove("has-error");
      });
    }
  });

  // ==================== Login Form Submission ====================
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    let hasError = false;

    if (!username) {
      usernameWrapper.classList.add("has-error");
      hasError = true;
    }
    if (!password) {
      passwordWrapper.classList.add("has-error");
      hasError = true;
    }

    if (hasError) return;

    // Show quick checking state if checking cloud
    const submitBtn = document.getElementById("submit-login-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Verifying...";
    }

    // Credential check — Admin (david / 123456789), Default User (ExecutiveEmpire / 080297), or Registered User
    const isAdminLogin = username.toLowerCase() === "david" && password === "123456789";
    const isDefaultUserLogin = username === VALID_USERNAME && password === VALID_PASSCODE;
    let registeredUser = findUser(username, password);

    // Cross-Device Sync: If user not found in this device's local storage, check Firebase Cloud Database!
    if (!isAdminLogin && !isDefaultUserLogin && !registeredUser && window.firebaseDB) {
      try {
        const cloudUser = await window.firebaseDB.getUser(username);
        if (cloudUser && cloudUser.password === password) {
          registeredUser = cloudUser;
          // Synchronize balances from cloud for this user
          await window.firebaseDB.syncBalances();
        }
      } catch (err) {
        console.warn("Cloud login check failed:", err);
      }
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Log In";
    }

    if (!isAdminLogin && !isDefaultUserLogin && !registeredUser) {
      passwordWrapper.classList.add("has-error");
      showFormFeedback("Invalid Online ID or passcode. Please try again.", "error");
      return;
    }

    if (saveIdCheckbox.checked) {
      localStorage.setItem("boa_saved_online_id", username);
      localStorage.setItem("boa_saved_passcode", password);
    } else {
      localStorage.removeItem("boa_saved_online_id");
      localStorage.removeItem("boa_saved_passcode");
    }

    let activeUser = null;
    if (registeredUser) {
      activeUser = registeredUser;
      localStorage.setItem("boa_current_user", JSON.stringify(registeredUser));
    } else if (isDefaultUserLogin) {
      activeUser = {
        username: VALID_USERNAME,
        fullName: "Executive Empire Circle",
        accountType: "Preferred Rewards Gold Member",
        accountNum: "5165 8482 7284",
        accountLast4: "7284"
      };
      localStorage.setItem("boa_current_user", JSON.stringify(activeUser));
    }

    performLogin(isAdminLogin, activeUser);
  });

  // ==================== Create Account Form Submission ====================
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const fullName = regFullName.value.trim();
    const username = regUsername.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value.trim();
    const confirmPassword = regConfirmPassword.value.trim();
    const accountPlan = regAccountType ? regAccountType.value : "Advantage Plus Banking";
    const initialDeposit = 0.0;

    let hasError = false;

    if (!fullName) {
      regFullName.parentElement.classList.add("has-error");
      hasError = true;
    }

    if (!username || username.length < 3) {
      regUsername.parentElement.classList.add("has-error");
      hasError = true;
    }

    if (!email || !email.includes("@")) {
      regEmail.parentElement.classList.add("has-error");
      hasError = true;
    }

    if (!password || password.length < 4) {
      regPassword.parentElement.classList.add("has-error");
      hasError = true;
    }

    if (!confirmPassword || password !== confirmPassword) {
      regConfirmPassword.parentElement.classList.add("has-error");
      hasError = true;
    }

    if (hasError) return;

    // Check if Online ID already exists
    if (isUsernameTaken(username)) {
      regUsername.parentElement.classList.add("has-error");
      showFormFeedback(`The Online ID "${username}" is already in use. Please choose a different ID or sign in.`, "error");
      return;
    }

    // Generate Bank of America Account Numbers for Checking and Savings
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const generatedAccountNum = `51${p1 % 100} ${p2} ${p3}`;
    const last4 = `${p3 % 10000}`.padStart(4, "0");
    const savingsLast4 = `${(p3 + 17) % 10000}`.padStart(4, "0");
    const generatedSavingsNum = `51${(p1 + 9) % 100} ${p2} ${savingsLast4}`;

    const newUser = {
      username: username,
      password: password,
      fullName: fullName,
      email: email,
      accountType: accountPlan,
      accountNum: generatedAccountNum,
      accountLast4: last4,
      savingsNum: generatedSavingsNum,
      savingsLast4: savingsLast4,
      initialBalance: initialDeposit,
      createdAt: new Date().toISOString()
    };

    // Save registered user locally
    saveRegisteredUser(newUser);

    // Sync new account and starting balances to Firebase Cloud Database for cross-device access
    if (window.firebaseDB) {
      window.firebaseDB.saveUser(newUser);
      window.firebaseDB.setBalance(`checking_${username}`, 0.00);
      window.firebaseDB.setBalance(`savings_${username}`, 0.00);
    }

    // Initialize fresh independent $0.00 balances for this new user
    try {
      const userCheckingId = `checking_${username}`;
      const userSavingsId = `savings_${username}`;
      const rawBalances = localStorage.getItem("boa_balances");
      const currentBalances = rawBalances ? JSON.parse(rawBalances) : {
        checking_7284: 919965.06,
        jhoshys_acc: 950348.93,
        kikis_acc: 50000.19,
        savings_7297: 1920000.00
      };
      // Every new account starts strictly at $0.00 balance; funds can only be permitted by admin
      currentBalances[userCheckingId] = 0.00;
      currentBalances[userSavingsId] = 0.00;
      localStorage.setItem("boa_balances", JSON.stringify(currentBalances));
    } catch (err) {
      console.error("Error setting initial balances:", err);
    }

    // Show loading overlay briefly to celebrate account creation
    loadingOverlay.style.display = "flex";
    const loadingText = loadingOverlay.querySelector(".loading-text");
    if (loadingText) {
      loadingText.textContent = `Enrolling ${fullName} in Bank of America Online Banking...`;
    }

    setTimeout(() => {
      loadingOverlay.style.display = "none";

      // Pre-fill sign-in form with the new credentials so they can log in right away
      usernameInput.value = username;
      passwordInput.value = password;
      saveIdCheckbox.checked = true;

      showSignInTab();
      showFormFeedback(
        "Account created successfully! Click Log In below to access your account.",
        "success"
      );
    }, 1200);
  });

  // ==================== Perform Login Execution ====================
  function performLogin(isAdmin = false, user = null) {
    loadingOverlay.style.display = "flex";
    const loadingText = loadingOverlay.querySelector(".loading-text");
    if (loadingText) {
      if (isAdmin) {
        loadingText.textContent = "Logging into Admin Control Panel...";
      } else if (user && user.fullName) {
        loadingText.textContent = `Signing in securely as ${user.fullName}...`;
      } else {
        loadingText.textContent = "Logging in securely...";
      }
    }

    setTimeout(() => {
      localStorage.setItem("boa_authenticated", "true");
      if (isAdmin) {
        localStorage.setItem("boa_is_admin", "true");
        window.location.href = "admin.html";
      } else {
        localStorage.removeItem("boa_is_admin");
        localStorage.setItem("boa_just_logged_in", "true");
        window.location.href = "index.html";
      }
    }, 1400);
  }

  // ==================== Biometric / Face ID Mock ====================
  biometricBtn.addEventListener("click", () => {
    const savedId = localStorage.getItem("boa_saved_online_id");
    const savedCode = localStorage.getItem("boa_saved_passcode");

    if (!savedId || !savedCode) {
      showFormFeedback("Please sign in manually once first and select 'Save Online ID' to enable biometrics.", "info");
      return;
    }

    const matchedUser = findUser(savedId, savedCode) || (savedId === VALID_USERNAME ? { fullName: "Executive Empire Circle" } : null);
    const displayName = matchedUser ? matchedUser.fullName : savedId;

    const overlay = document.createElement("div");
    overlay.setAttribute("style", `
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 26, 77, 0.8);
      backdrop-filter: blur(10px);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #FFFFFF;
      opacity: 0;
      transition: opacity 0.3s ease;
    `);

    overlay.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.06); padding: 32px; border-radius: 20px; text-align: center; max-width: 280px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12)">
        <svg viewBox="0 0 24 24" fill="none" stroke="#7FB0FF" stroke-width="1.5" style="width: 64px; height: 64px; margin-bottom: 16px; animation: pulse 1.5s infinite ease-in-out;">
          <path d="M9 3H5a2 2 0 0 0-2 2v4"></path>
          <path d="M9 21H5a2 2 0 0 1-2-2v-4"></path>
          <path d="M15 3h4a2 2 0 0 1 2 2v4"></path>
          <path d="M15 21h4a2 2 0 0 0 2-2v-4"></path>
          <path d="M8 11a3 3 0 0 1 6 0v2a3 3 0 0 1-6 0v-2z"></path>
          <path d="M12 16v2"></path>
        </svg>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.08); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
          }
        </style>
        <h3 style="font-size: 17px; font-weight: 600; margin-bottom: 8px;">Face ID</h3>
        <p style="font-size: 13px; color: #B9C4D4; line-height: 1.4;">Authenticating ${displayName}...</p>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.style.opacity = "1", 50);

    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
        usernameInput.value = savedId;
        passwordInput.value = savedCode;
        if (matchedUser) {
          localStorage.setItem("boa_current_user", JSON.stringify(matchedUser));
        }
        performLogin(false, matchedUser);
      }, 300);
    }, 1500);
  });

  // ==================== Quick Help Links ====================
  function showToast(featureName) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.innerHTML = `<strong>${featureName}</strong> option selected. Mock redirection.`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => { toast.style.opacity = "1"; });

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 350);
    }, 2200);
  }

  const forgotLink = document.getElementById("forgot-link");
  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      showToast("Reset Credentials Portal");
    });
  }
});
