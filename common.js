// Shared site chrome: mobile nav, notification dropdown, sign out, feature toasts

document.addEventListener("DOMContentLoaded", () => {
  // ==================== Back Button ====================
  const headerInner = document.querySelector(".header-inner");
  if (headerInner && !document.getElementById("back-btn")) {
    const backBtn = document.createElement("button");
    backBtn.className = "back-btn";
    backBtn.id = "back-btn";
    backBtn.type = "button";
    backBtn.setAttribute("aria-label", "Go back");
    backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    headerInner.insertBefore(backBtn, headerInner.firstChild);

    backBtn.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "index.html";
      }
    });
  }

  // ==================== Mobile Navigation ====================
  const menuBtn = document.getElementById("menu-btn");
  const mainNav = document.getElementById("main-nav");

  if (menuBtn && mainNav) {
    menuBtn.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });

    mainNav.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
      });
    });
  }

  // ==================== Just Signed In Notification ====================
  if (localStorage.getItem("boa_just_logged_in") === "true") {
    localStorage.removeItem("boa_just_logged_in");

    const notifList = document.querySelector(".notif-list");
    const badge = document.querySelector(".badge-count");

    if (notifList) {
      let welcomeMsg = "Welcome back! You are now signed in to your Bank of America account.";
      try {
        const uRaw = localStorage.getItem("boa_current_user");
        if (uRaw) {
          const u = JSON.parse(uRaw);
          if (u.fullName) welcomeMsg = `Welcome back, ${u.fullName}! You are now signed in to your Bank of America account.`;
        }
      } catch (e) {}

      const item = document.createElement("div");
      item.className = "notif-item";
      item.innerHTML = `
        <div class="notif-dot"></div>
        <div>
          <span class="notif-title">You Just Signed In</span>
          <p class="notif-text">${welcomeMsg}</p>
          <span class="notif-time">Just now</span>
        </div>
      `;
      notifList.insertBefore(item, notifList.firstChild);
    }

    if (badge) {
      const count = parseInt(badge.textContent, 10);
      if (!isNaN(count)) badge.textContent = count + 1;
    }
  }

  // ==================== Profile Button ====================
  const headerActions = document.querySelector(".header-actions");
  if (headerActions && !document.getElementById("profile-btn")) {
    const profileLink = document.createElement("a");
    profileLink.className = "profile-btn";
    profileLink.id = "profile-btn";
    profileLink.href = "profile.html";
    profileLink.setAttribute("aria-label", "View profile");
    profileLink.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    `;
    headerActions.insertBefore(profileLink, headerActions.querySelector(".sign-out-btn"));
  }

  // ==================== Notification Dropdown ====================
  const notifBtn = document.getElementById("notif-btn");
  const notifDropdown = document.getElementById("notif-dropdown");
  const closeNotifBtn = document.getElementById("close-notif");

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle("active");
    });

    closeNotifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.classList.remove("active");
    });

    document.addEventListener("click", (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove("active");
      }
    });
  }

  // ==================== Sign Out ====================
  function performLogout() {
    if (confirm("Are you sure you want to sign out?")) {
      localStorage.removeItem("boa_authenticated");
      localStorage.removeItem("boa_current_user");
      window.location.href = "login.html?logout=true";
    }
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", performLogout);

  const cardSignout = document.getElementById("card-signout");
  if (cardSignout) cardSignout.addEventListener("click", performLogout);

  // ==================== Customer Support & WhatsApp Integration ====================
  const SUPPORT_PHONE = "14438269495";
  const DEFAULT_SUPPORT_MSG = encodeURIComponent("Hello Bank of America Customer Support, I need assistance with my account.");
  const WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE}?text=${DEFAULT_SUPPORT_MSG}`;

  window.openCustomerSupport = function () {
    window.open(WHATSAPP_URL, "_blank");
  };

  // Inject Floating Customer Support WhatsApp Icon (where previous widget was)
  if (!document.getElementById("floating-support-btn")) {
    const floatBtn = document.createElement("a");
    floatBtn.id = "floating-support-btn";
    floatBtn.className = "floating-support-btn";
    floatBtn.href = WHATSAPP_URL;
    floatBtn.target = "_blank";
    floatBtn.rel = "noopener noreferrer";
    floatBtn.setAttribute("aria-label", "Contact Customer Support on WhatsApp (+1 443 826 9495)");
    floatBtn.innerHTML = `
      <div class="support-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <path d="M8 9h8"></path>
          <path d="M8 13h5"></path>
        </svg>
        <span class="support-online-badge"></span>
      </div>
      <div class="floating-support-text">
        <span>Customer Support</span>
        <span>WhatsApp &bull; Online</span>
      </div>
    `;
    document.body.appendChild(floatBtn);
  }


  // ==================== Feature Toasts & Event Handlers ====================
  window.showFeatureAlert = function (featureName) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.innerHTML = `<strong>${featureName}</strong> option selected. Mockup redirection.`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => { toast.style.opacity = "1"; });

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 350);
    }, 2200);
  };

  document.querySelectorAll("[data-feature]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const feature = el.getAttribute("data-feature");
      if (
        feature === "Contact Us" ||
        feature === "Customer Support" ||
        feature === "Live Support" ||
        feature === "Crypto Deposit Support" ||
        feature === "Missing Deposit Inquiry"
      ) {
        window.openCustomerSupport();
      } else {
        window.showFeatureAlert(feature);
      }
    });
  });

  // ==================== Success Modal ====================
  window.showSuccessModal = function (options) {
    const confNum = "BOA" + Math.floor(100000 + Math.random() * 900000);
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 id="modal-title">${options.title || "Transfer Successful"}</h3>
        <p class="modal-sub">${options.subtitle || ""}</p>
        <div class="modal-details">
          <div class="modal-row"><span>From</span><strong>${options.from || "—"}</strong></div>
          <div class="modal-row"><span>To</span><strong>${options.to || "—"}</strong></div>
          <div class="modal-row"><span>Amount</span><strong>${options.amount || "—"}</strong></div>
          <div class="modal-row"><span>Confirmation</span><strong>${confNum}</strong></div>
        </div>
        <button class="btn-primary modal-close-btn">Done</button>
      </div>
    `;
    document.body.appendChild(overlay);

    function closeModal() {
      overlay.classList.add("fade-out");
      setTimeout(() => overlay.remove(), 250);
    }

    overlay.querySelector(".modal-close-btn").addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", onKey);
      }
    });
  };
});
