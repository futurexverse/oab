// Bank of America Accounts Page — Screen, Search, and Inline Details Logic

// Session Verification Check
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

// Database for Account Details and Transactions
let mockAccountsData = {};

if (isCustomUser) {
  const chkId = `checking_${currentUser.username}`;
  const savId = `savings_${currentUser.username}`;
  mockAccountsData = {
    [chkId]: {
      accountId: chkId,
      name: currentUser.fullName,
      plan: currentUser.accountType || "Advantage Plus Banking",
      balanceClass: "positive",
      routing: "026009593",
      accountNum: "******" + (currentUser.accountLast4 || "7284"),
      transactions: []
    },
    [savId]: {
      accountId: savId,
      name: "Advantage Savings",
      plan: "Preferred Savings",
      balanceClass: "ash",
      routing: "026009593",
      accountNum: "******" + (currentUser.savingsLast4 || "7297"),
      transactions: []
    }
  };
} else {
  mockAccountsData = {
    checking_7284: {
      accountId: "checking_7284",
      name: "Mr Jason Statham",
      plan: "Checking",
      balanceClass: "positive",
      routing: "026009593",
      accountNum: "******7284",
      transactions: [
        { desc: "Mobile Check Deposit from Jason Statham", date: "Jul 15, 2026", amount: "+$250,000.00", isNegative: false },
        { desc: "Mobile Check Deposit from Jason Statham", date: "Jun 01, 2026", amount: "+$250,000.00", isNegative: false },
        { desc: "Mobile Check Deposit from Jason Statham", date: "Apr 15, 2026", amount: "+$200,000.00", isNegative: false },
        { desc: "Mobile Check Deposit from Jason Statham", date: "Mar 01, 2026", amount: "+$150,000.00", isNegative: false },
        { desc: "Mobile Check Deposit from Jason Statham", date: "Jan 15, 2026", amount: "+$70,000.00", isNegative: false }
      ]
    },
    jhoshys_acc: {
      accountId: "jhoshys_acc",
      name: "Mr Sylvester Stallone",
      plan: "Account",
      balanceClass: "positive",
      routing: "026009593",
      accountNum: "******5839",
      transactions: [
        { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Jun 09, 2026", amount: "+$250,000.00", isNegative: false },
        { desc: "Mobile Check Deposit from Sylvester Stallone", date: "May 15, 2026", amount: "+$250,000.00", isNegative: false },
        { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Apr 18, 2026", amount: "+$200,000.00", isNegative: false },
        { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Mar 22, 2026", amount: "+$100,000.00", isNegative: false },
        { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Feb 24, 2026", amount: "+$75,000.00", isNegative: false },
        { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Jan 28, 2026", amount: "+$50,000.00", isNegative: false },
        { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Jan 02, 2026", amount: "+$25,000.00", isNegative: false }
      ]
    },
    kikis_acc: {
      accountId: "kikis_acc",
      name: "Mr Timothy Terk P",
      plan: "Account",
      balanceClass: "positive",
      routing: "026009593",
      accountNum: "******9012",
      transactions: [
        { desc: "Mobile Check Deposit from Timothy Terk P", date: "Jul 07, 2026", amount: "+$50,000.00", isNegative: false }
      ]
    },
    savings_7297: {
      accountId: "savings_7297",
      name: "Savings Account 7297",
      plan: "Savings",
      balanceClass: "ash",
      routing: "026009593",
      accountNum: "******7297",
      transactions: SAVINGS_HISTORY
    }
  };
}

const ACTION_ICONS = {
  Transfer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3L21 7L17 11"></path><path d="M3 17L7 21L3 25"></path><path d="M21 7H9C5.13 7 2 10.13 2 14v2"></path><path d="M3 17h12c3.87 0 7-3.13 7-7V8"></path></svg>',
  "Add Money": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
  Deposit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>'
};

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const tabAccounts = document.getElementById("tab-accounts");
  const tabDashboard = document.getElementById("tab-dashboard");
  const navLinkAccounts = document.getElementById("nav-link-accounts");
  const navLinkDashboard = document.getElementById("nav-link-dashboard");
  const accountsScreen = document.getElementById("accounts-screen");
  const dashboardScreen = document.getElementById("dashboard-screen");

  // Balance Show / Hide Toggle
  const balanceToggle = document.getElementById("balance-toggle");
  const balanceText = document.getElementById("balance-text");

  // ==================== Render Accounts List ====================
  const accountsContainer = document.getElementById("accounts-list-container");
  if (isCustomUser && accountsContainer) {
    const chkId = `checking_${currentUser.username}`;
    const savId = `savings_${currentUser.username}`;

    accountsContainer.innerHTML = `
      <div class="account-row" data-account-id="${chkId}">
        <div class="account-info">
          <div class="account-name">${currentUser.fullName}</div>
          <div class="account-meta">${currentUser.accountType || 'Advantage Plus Banking'} &middot; Account ending ${currentUser.accountLast4 || '7284'}</div>
        </div>
        <div class="account-right">
          <div class="account-balance positive" data-balance-id="${chkId}">$0.00</div>
          <button class="view-details-btn" data-account-id="${chkId}">VIEW</button>
        </div>
      </div>

      <div class="account-row" data-account-id="${savId}">
        <div class="account-info">
          <div class="account-name">Advantage Savings</div>
          <div class="account-meta">Preferred Savings &middot; Account ending ${currentUser.savingsLast4 || '7297'}</div>
        </div>
        <div class="account-right">
          <div class="account-balance ash" data-balance-id="${savId}">$0.00</div>
          <button class="view-details-btn" data-account-id="${savId}">VIEW</button>
        </div>
      </div>
    `;

    // Update greeting
    const greetingEl = document.querySelector(".page-heading .page-greeting");
    if (greetingEl) {
      greetingEl.innerHTML = `Hello, <strong>${currentUser.fullName}</strong> &mdash; ${currentUser.accountType || 'Advantage Banking Member'}`;
    }

    // Update dashboard stats
    const statCards = document.querySelectorAll(".stat-card .stat-value");
    if (statCards.length >= 2) {
      statCards[0].textContent = "2"; // Accounts count
      const userPending = getPendingTransfers().filter(
        (t) => t.fromId === chkId || t.userId === currentUser.username
      );
      const totalPending = userPending.reduce((sum, t) => sum + (t.amount || 0), 0);
      statCards[1].textContent = formatMoney(totalPending);
    }

    // New accounts have no spending history — zero out the Dashboard spending widgets
    // (Spending — Last 6 Months chart and Monthly Spending Breakdown) so they don't
    // display the default demo account's hardcoded historical figures.
    zeroOutDashboardSpending();
  }

  // ==================== Zero Out Dashboard Spending (New Accounts) ====================
  // A newly created account has no spending history, so replace the hardcoded demo
  // spending chart + monthly breakdown with $0.00 values for the last 6 months.
  function zeroOutDashboardSpending() {
    const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Build the last 6 calendar months (oldest -> newest) based on today's date
    const now = new Date();
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6.push({ short: MONTHS_SHORT[d.getMonth()], long: MONTHS_LONG[d.getMonth()], year: d.getFullYear() });
    }

    // --- Spending — Last 6 Months chart ---
    const chartBars = document.querySelector("#dashboard-screen .chart-bars");
    if (chartBars) {
      chartBars.innerHTML = last6
        .map(
          (m) => `
        <div class="chart-col">
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="height: 2%; background: linear-gradient(180deg, #D8DCE3 0%, #B9C0CB 100%);">
              <div class="bar-tooltip">
                <strong>${m.long} ${m.year}</strong>
                <span class="tip-total"><em>Total</em><b>$0.00</b></span>
              </div>
            </div>
          </div>
          <div class="chart-label">${m.short} <b>$0.00</b></div>
        </div>`
        )
        .join("");

      const chartTitle = document.querySelector("#dashboard-screen .chart-card h3");
      if (chartTitle) chartTitle.innerHTML = "Spending &mdash; Last 6 Months";
    }

    // --- Monthly Spending Breakdown list ---
    const breakdownCard = Array.from(document.querySelectorAll("#dashboard-screen .list-card")).find((c) =>
      (c.querySelector("h3") || {}).textContent?.includes("Monthly Spending Breakdown")
    );
    if (breakdownCard) {
      // Newest month first
      const rows = last6
        .slice()
        .reverse()
        .map(
          (m) => `
        <div class="list-item">
          <div>
            <div class="list-item-title">${m.long} ${m.year}</div>
            <div class="list-item-sub">No spending activity yet &mdash; new account</div>
          </div>
          <div class="list-item-right">
            <span class="list-item-amt">$0.00</span>
          </div>
        </div>`
        )
        .join("");

      // Remove existing demo rows, keep the heading, then insert fresh $0.00 rows
      breakdownCard.querySelectorAll(".list-item").forEach((el) => el.remove());
      breakdownCard.insertAdjacentHTML("beforeend", rows);
    }
  }

  // ==================== Sync Balances from Store ====================
  function syncBalances() {
    document.querySelectorAll("[data-balance-id]").forEach((el) => {
      const id = el.getAttribute("data-balance-id");
      const value = getBalance(id);
      el.textContent = formatMoney(value);
      if (value < 0) {
        el.classList.add("negative");
      }
    });

    if (balanceText) {
      if (isCustomUser) {
        const total =
          getBalance(`checking_${currentUser.username}`) +
          getBalance(`savings_${currentUser.username}`);
        balanceText.textContent = formatMoney(total);
      } else {
        const b = loadBalances();
        balanceText.textContent = formatMoney(b.savings_7297 || 1920000.0);
      }
    }
  }

  syncBalances();

  if (balanceToggle && balanceText) {
    const eyeIcon =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    const eyeOffIcon =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

    let isHidden = false;
    balanceToggle.addEventListener("click", () => {
      isHidden = !isHidden;
      if (isHidden) {
        balanceText.textContent = "$\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
        balanceToggle.setAttribute("aria-label", "Show balance");
        balanceToggle.innerHTML = eyeOffIcon;
      } else {
        syncBalances();
        balanceToggle.setAttribute("aria-label", "Hide balance");
        balanceToggle.innerHTML = eyeIcon;
      }
    });
  }

  // ==================== Screen Tabs ====================
  function switchScreen(screen) {
    const showAccounts = screen === "accounts";

    tabAccounts.classList.toggle("active", showAccounts);
    tabDashboard.classList.toggle("active", !showAccounts);
    navLinkAccounts.classList.toggle("active", showAccounts);
    navLinkDashboard.classList.toggle("active", !showAccounts);

    accountsScreen.classList.toggle("active", showAccounts);
    dashboardScreen.classList.toggle("active", !showAccounts);

    const greeting = document.querySelector(".page-heading .page-greeting");
    if (greeting) {
      greeting.style.display = showAccounts ? "" : "none";
    }

    document.title = showAccounts
      ? "Bank of America - Accounts"
      : "Bank of America - Dashboard";
  }

  tabAccounts.addEventListener("click", () => switchScreen("accounts"));
  tabDashboard.addEventListener("click", () => switchScreen("dashboard"));
  navLinkAccounts.addEventListener("click", (e) => {
    e.preventDefault();
    switchScreen("accounts");
  });
  navLinkDashboard.addEventListener("click", (e) => {
    e.preventDefault();
    switchScreen("dashboard");
  });

  if (window.location.hash === "#dashboard") {
    switchScreen("dashboard");
  }

  // ==================== Search and Filter Accounts ====================
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search");

  function getAccountRows() {
    return document.querySelectorAll(".account-row");
  }

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    clearSearchBtn.style.display = query.length > 0 ? "flex" : "none";

    getAccountRows().forEach((row) => {
      const name = row.querySelector(".account-name").textContent.toLowerCase();
      const balance = row.querySelector(".account-balance").textContent.toLowerCase();
      const match = name.includes(query) || balance.includes(query);
      row.style.display = match ? "flex" : "none";
      if (!match) closeAccountDetails(row);
    });
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    getAccountRows().forEach((row) => (row.style.display = "flex"));
    searchInput.focus();
  });

  // ==================== Inline Account Details ====================
  function buildDetailHtml(data) {
    const liveBalance = formatMoney(getBalance(data.accountId));
    const balanceClass = getBalance(data.accountId) < 0 ? "negative" : data.balanceClass;

    const pendingRows = getPendingTransfers()
      .filter((t) => t.fromId === data.accountId || t.toId === data.accountId)
      .map((t) => {
        const isFrom = t.fromId === data.accountId;
        const desc = isFrom ? t.descFrom : t.descTo;
        const amount = isFrom ? -t.amount : t.amount;
        const amountLabel = (amount < 0 ? "-" : "+") + formatMoney(Math.abs(amount));
        return `
          <div class="tx-row tx-pending">
            <div class="tx-date">${t.date}</div>
            <div class="tx-desc">${desc}<span class="tx-status-pill">Awaiting Admin Permit</span></div>
            <div class="tx-amount ${amount < 0 ? "neg" : "pos"}">${amountLabel}</div>
            <button class="tx-confirm-btn" data-tx-id="${t.txId}">Confirm</button>
          </div>
        `;
      })
      .join("");

    const confirmedRows = getStoreTransactions()
      .filter((tx) => tx.accountId === data.accountId)
      .map(
        (tx) => `
        <div class="tx-row">
          <div class="tx-date">${tx.date}</div>
          <div class="tx-desc">${tx.desc}</div>
          <div class="tx-amount ${tx.isNegative ? "neg" : "pos"}">${tx.amount < 0 ? "-" : "+"}${formatMoney(Math.abs(tx.amount))}</div>
        </div>
      `
      )
      .join("");

    const staticRows = (!isCustomUser && data.transactions)
      ? data.transactions
          .map(
            (tx) => `
        <div class="tx-row">
          <div class="tx-date">${tx.date}</div>
          <div class="tx-desc">${tx.desc}</div>
          <div class="tx-amount ${tx.isNegative ? "neg" : "pos"}">${tx.amount}</div>
        </div>
      `
          )
          .join("")
      : "";

    const txRows =
      pendingRows + confirmedRows + staticRows ||
      '<div class="no-tx-text" style="padding: 24px 16px; text-align: center; color: var(--text-secondary); font-size: 13.5px;">No transactions recorded yet for this new account. Use <strong>Transfer</strong> or <strong>Deposit</strong> to begin activity.</div>';

    const actions = Object.keys(ACTION_ICONS)
      .map(
        (label) => `
      <button class="action-btn" data-action="${label}">
        ${ACTION_ICONS[label]}
        <span>${label}</span>
      </button>
    `
      )
      .join("");

    return `
      <div class="detail-content">
        <div class="detail-summary">
          <div>
            <h4>${data.name}</h4>
            <p>Routing: ${data.routing} &middot; Account: ${data.accountNum}</p>
          </div>
          <div class="detail-balance ${balanceClass}">${liveBalance}</div>
        </div>

        <div class="detail-actions">${actions}</div>

        <div class="transactions-section">
          <h4>Recent Transactions</h4>
          <div class="tx-table">${txRows}</div>
        </div>

        <button class="collapse-btn">Collapse details</button>
      </div>
    `;
  }

  function openAccountDetails(row) {
    const accountId = row.getAttribute("data-account-id");
    const data = mockAccountsData[accountId];
    if (!data) return;

    const list = row.parentElement;

    list.querySelectorAll(".detail-panel.open").forEach((panel) => {
      if (panel.getAttribute("data-account-id") !== accountId) {
        panel.classList.remove("open");
      }
    });

    let panel = list.querySelector(`.detail-panel[data-account-id="${accountId}"]`);

    if (panel && panel.classList.contains("open")) {
      panel.classList.remove("open");
      return;
    }

    if (!panel) {
      panel = document.createElement("div");
      panel.className = "detail-panel";
      panel.setAttribute("data-account-id", accountId);
      panel.innerHTML = `<div class="detail-panel-inner">${buildDetailHtml(data)}</div>`;
      row.insertAdjacentElement("afterend", panel);
      bindDetailActions(panel, row);
    }

    requestAnimationFrame(() => panel.classList.add("open"));
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function bindDetailActions(panel, row) {
    panel.querySelectorAll(".action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.getAttribute("data-action");
        if (action === "Transfer") {
          window.location.href = "transfer.html";
        } else if (action === "Deposit") {
          window.location.href = "deposit.html";
        } else {
          window.showFeatureAlert(action);
        }
      });
    });

    const collapseBtn = panel.querySelector(".collapse-btn");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAccountDetails(row);
      });
    }

    panel.querySelectorAll(".tx-confirm-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const txId = btn.getAttribute("data-tx-id");
        if (!confirmTransfer(txId)) return;
        btn.textContent = "Confirmed";
        btn.classList.add("confirmed");
        syncBalances();
        const accountId = row.getAttribute("data-account-id");
        const freshData = mockAccountsData[accountId];
        panel.querySelector(".detail-panel-inner").innerHTML = buildDetailHtml(freshData);
        bindDetailActions(panel, row);
      });
    });
  }

  function closeAccountDetails(row) {
    const panel = row.parentElement.querySelector(
      `.detail-panel[data-account-id="${row.getAttribute("data-account-id")}"]`
    );
    if (panel) panel.classList.remove("open");
  }

  function bindAccountRowEvents() {
    getAccountRows().forEach((row) => {
      row.style.cursor = "pointer";
      row.addEventListener("click", () => openAccountDetails(row));
    });

    document.querySelectorAll(".view-details-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const row = btn.closest(".account-row");
        if (row) openAccountDetails(row);
      });
    });
  }

  bindAccountRowEvents();

  // Sidebar Cards
  const btnLifeplan = document.getElementById("btn-lifeplan");
  if (btnLifeplan) btnLifeplan.addEventListener("click", () => (window.location.href = "lifeplan.html"));

  const btnRewards = document.getElementById("btn-rewards");
  if (btnRewards) btnRewards.addEventListener("click", () => (window.location.href = "rewards.html"));
});
