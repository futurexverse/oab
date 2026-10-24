// Bank of America Profile Page - Session Verification and User Display

if (localStorage.getItem("boa_authenticated") !== "true") {
  window.location.href = "login.html?redirect=true";
}

document.addEventListener("DOMContentLoaded", () => {
  const currentUserRaw = localStorage.getItem("boa_current_user");
  if (!currentUserRaw) return;

  try {
    const user = JSON.parse(currentUserRaw);
    if (!user || !user.fullName) return;

    // Check if user is a newly created account (not Executive Empire)
    const isCustom = Boolean(
      user.username && user.username.toLowerCase() !== "executiveempire"
    );

    if (!isCustom) {
      // Default Executive Empire account - keep original joint account data
      return;
    }

    // ==================== Page Heading ====================
    const pageSub = document.getElementById("profile-heading-subtitle");
    if (pageSub) {
      pageSub.textContent = "Personal account information, account owner details and contact preferences.";
    }

    // ==================== Hero Banner ====================
    const avatarEl = document.getElementById("profile-avatar");
    if (avatarEl) {
      avatarEl.textContent = user.fullName.trim()[0].toUpperCase();
    }

    const profileNameEl = document.getElementById("profile-name");
    if (profileNameEl) {
      profileNameEl.textContent = `Hello, ${user.fullName}`;
    }

    const bannerTagEl = document.getElementById("profile-banner-tag");
    if (bannerTagEl) {
      bannerTagEl.textContent = "Single Account \u2022 Primary Owner";
    }

    // ==================== Single Account Details (Not Joint) ====================
    const acctHeading = document.getElementById("profile-acct-heading");
    if (acctHeading) acctHeading.textContent = "Account Details";

    const acctSub = document.getElementById("profile-acct-sub");
    if (acctSub) acctSub.textContent = "Account linked to routing number 0260 0959 3.";

    const acctRows = document.getElementById("profile-acct-rows");
    if (acctRows) {
      acctRows.innerHTML = `
        <div class="profile-acct-row">
          <div class="profile-acct-title">${user.accountType || "Advantage Plus Banking"} &middot;&middot;&middot;&middot; ${user.accountLast4 || "7284"}</div>
          <div class="profile-acct-nums"><b>Account No: ${user.accountNum || "5165 8482 7284"}</b><span>Routing No: 0260 0959 3</span></div>
        </div>
      `;
    }

    // ==================== Account Owner (Sole Owner, Not Joint) ====================
    const holdersHeading = document.getElementById("profile-holders-heading");
    if (holdersHeading) holdersHeading.textContent = "Account Owner";

    const holdersSub = document.getElementById("profile-holders-sub");
    if (holdersSub) holdersSub.textContent = "Primary individual account owner and sole authorized signer.";

    const holdersList = document.getElementById("profile-holders-list");
    if (holdersList) {
      holdersList.innerHTML = `
        <div class="profile-holder">
          <span>${user.fullName}</span>
          <span class="prio-tag primary">Primary Owner</span>
        </div>
      `;
    }

    // ==================== Mailing Address ====================
    const addrHeading = document.getElementById("profile-addr-heading");
    if (addrHeading) addrHeading.textContent = "Mailing Address";

    const addrSub = document.getElementById("profile-addr-sub");
    if (addrSub) addrSub.textContent = "Primary address on file with Bank of America.";

    const addrList = document.getElementById("profile-addr-list");
    if (addrList) {
      addrList.innerHTML = `
        <div class="profile-addr">
          <span class="addr-label">Primary</span>
          <p>Primary mailing address on file<br>Verified Online Banking Customer</p>
        </div>
      `;
    }

    // ==================== Contact Details ====================
    const contactHeading = document.getElementById("profile-contact-heading");
    if (contactHeading) contactHeading.textContent = "Contact Details";

    const contactSub = document.getElementById("profile-contact-sub");
    if (contactSub) contactSub.textContent = "Primary contact details for account owner.";

    const contactGrid = document.getElementById("profile-contact-grid");
    if (contactGrid) {
      contactGrid.innerHTML = `
        <div class="contact-card" style="max-width: 440px;">
          <strong>${user.fullName}</strong>
          <span class="prio-tag primary">Primary Owner</span>
          <div class="contact-line">
            <span class="contact-label">Account Ownership</span>
            <span style="font-weight: 600; color: var(--navy);">Individual Account (Single Owner)</span>
          </div>
          <div class="contact-line">
            <span class="contact-label">Online ID</span>
            <span>${user.username}</span>
          </div>
          <div class="contact-line">
            <span class="contact-label">Email</span>
            <span>${user.email}</span>
          </div>
          <div class="contact-line">
            <span class="contact-label">Account Status</span>
            <span style="color: var(--positive); font-weight: 600;">Active &bull; Verified</span>
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.error("Error populating profile data:", err);
  }
});
