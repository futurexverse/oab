// Bank of America Admin Control Panel Logic

// ==================== Strict Admin Authentication Check ====================
if (localStorage.getItem("boa_is_admin") !== "true") {
  window.location.href = "login.html?redirect=true";
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("boa_is_admin");
      localStorage.removeItem("boa_authenticated");
      window.location.href = "login.html?logout=true";
    });
  }

  const checkingValEl = document.getElementById("adm-checking-val");
  const savingsValEl = document.getElementById("adm-savings-val");
  const pendingCountEl = document.getElementById("adm-pending-count");

  const depositsTbody = document.getElementById("admin-deposits-tbody");
  const transfersTbody = document.getElementById("admin-transfers-tbody");
  const usersTbody = document.getElementById("admin-users-tbody");
  const toastMsg = document.getElementById("admin-toast-msg");

  const balanceForm = document.getElementById("admin-balance-form");
  const acctSelect = document.getElementById("adm-account-select");
  const amtInput = document.getElementById("adm-amount-input");

  function showToast(msg) {
    if (!toastMsg) return;
    toastMsg.textContent = msg;
    toastMsg.classList.add("show");
    setTimeout(() => toastMsg.classList.remove("show"), 4000);
  }

  function getRegisteredUsersList() {
    try {
      const raw = localStorage.getItem("boa_registered_users");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function renderAdminOverview() {
    if (typeof loadBalances === "function") {
      const b = loadBalances();
      if (checkingValEl) checkingValEl.textContent = formatMoney(b.checking_7284 || 0);
      if (savingsValEl) savingsValEl.textContent = formatMoney(b.savings_7297 || 0);
    }

    const pendingDep = typeof getPendingDeposits === "function" ? getPendingDeposits() : [];
    const count = pendingDep.filter((d) => d.status === "Pending").length;
    if (pendingCountEl) pendingCountEl.textContent = count;
  }

  // ==================== Populate Account Selector (Multi-User) ====================
  function populateAccountSelector() {
    if (!acctSelect) return;
    const currentVal = acctSelect.value;
    const users = getRegisteredUsersList();

    let html = `
      <optgroup label="Default (Executive Empire Circle)">
        <option value="checking_7284">Adv Plus Banking (····7284) [${formatMoney(getBalance("checking_7284"))}]</option>
        <option value="savings_7297">Preferred Savings (····7297) [${formatMoney(getBalance("savings_7297"))}]</option>
        <option value="jhoshys_acc">Jhoshys Account (····5839) [${formatMoney(getBalance("jhoshys_acc"))}]</option>
        <option value="kikis_acc">Kikis Account (····9012) [${formatMoney(getBalance("kikis_acc"))}]</option>
      </optgroup>
    `;

    if (users.length > 0) {
      users.forEach((u) => {
        const chkId = `checking_${u.username}`;
        const savId = `savings_${u.username}`;
        const chkBal = getBalance(chkId);
        const savBal = getBalance(savId);
        html += `
          <optgroup label="User: ${u.fullName} (@${u.username})">
            <option value="${chkId}">${u.fullName} Checking (····${u.accountLast4 || "7284"}) [${formatMoney(chkBal)}]</option>
            <option value="${savId}">Advantage Savings (····${u.savingsLast4 || "7297"}) [${formatMoney(savBal)}]</option>
          </optgroup>
        `;
      });
    }

    acctSelect.innerHTML = html;
    if (currentVal && acctSelect.querySelector(`option[value="${currentVal}"]`)) {
      acctSelect.value = currentVal;
    }
  }

  // ==================== Pending Crypto Deposits Table ====================
  function renderDepositsTable() {
    if (!depositsTbody) return;
    const deposits = typeof getPendingDeposits === "function" ? getPendingDeposits() : [];

    if (deposits.length === 0) {
      depositsTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">No deposit transactions submitted yet.</td></tr>`;
      return;
    }

    let html = "";
    deposits.forEach((d) => {
      const statusBadge =
        d.status === "Completed"
          ? '<span class="status-badge completed">Completed</span>'
          : d.status === "Declined"
          ? '<span class="status-badge failed">Declined</span>'
          : '<span class="status-badge due">Pending</span>';

      const actions =
        d.status === "Pending"
          ? `
        <button class="permit-btn" data-permit-dep="${d.id}">Permit & Increase Balance</button>
        <button class="decline-btn" data-decline-dep="${d.id}">Decline</button>
      `
          : `<span style="font-size: 12px; color: var(--text-muted);">&mdash;</span>`;

      const userTag = d.userName || d.userId || "Executive Empire";
      const targetTag = d.targetAccount ? ` <span style="font-size: 11px; color: var(--text-muted);">(${d.targetAccount})</span>` : "";

      html += `
        <tr>
          <td>
            <strong>${d.id}</strong><br>
            <span style="font-size: 12px; font-weight: 600; color: var(--navy);">${userTag}</span>${targetTag}
          </td>
          <td>${d.cryptoAsset === "BTC" ? "Bitcoin (BTC)" : "SRP (XRP)"}</td>
          <td>${d.cryptoAmount} ${d.cryptoAsset}</td>
          <td><strong>$${d.usdAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></td>
          <td>${d.date}</td>
          <td>${statusBadge}</td>
          <td>${actions}</td>
        </tr>
      `;
    });

    depositsTbody.innerHTML = html;

    depositsTbody.querySelectorAll("[data-permit-dep]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-permit-dep");
        if (typeof permitApproveDeposit === "function") {
          const dep = getPendingDeposits().find((item) => item.id === id);
          if (permitApproveDeposit(id)) {
            const userLabel = dep ? (dep.userName || dep.userId || "account") : "account";
            showToast(
              `Deposit ${id} PERMITTED! Balance for ${userLabel} increased by +$${
                dep ? dep.usdAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""
              }`
            );
            renderAdminOverview();
            populateAccountSelector();
            renderDepositsTable();
            renderUsersTable();
          }
        }
      });
    });

    depositsTbody.querySelectorAll("[data-decline-dep]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-decline-dep");
        if (typeof rejectDeposit === "function") {
          rejectDeposit(id);
          showToast(`Deposit ${id} DECLINED.`);
          renderAdminOverview();
          renderDepositsTable();
        }
      });
    });
  }

  // ==================== Pending Transfers Table ====================
  function renderTransfersTable() {
    if (!transfersTbody) return;
    const pendingTxs = typeof getPendingTransfers === "function" ? getPendingTransfers() : [];

    if (pendingTxs.length === 0) {
      transfersTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No pending account transfers awaiting approval.</td></tr>`;
      return;
    }

    let html = "";
    pendingTxs.forEach((t) => {
      const userTag = t.userName || t.userId || "Executive Empire";
      html += `
        <tr>
          <td>
            <strong>${t.txId}</strong><br>
            <span style="font-size: 12px; font-weight: 600; color: var(--navy);">${userTag}</span>
          </td>
          <td>${t.descFrom || "Transfer"}</td>
          <td><strong>$${t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></td>
          <td>${t.date}</td>
          <td>
            <button class="permit-btn" data-permit-tx="${t.txId}">Permit Transfer</button>
          </td>
        </tr>
      `;
    });

    transfersTbody.innerHTML = html;

    transfersTbody.querySelectorAll("[data-permit-tx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-permit-tx");
        if (typeof confirmTransfer === "function") {
          const t = getPendingTransfers().find((item) => item.txId === id);
          if (confirmTransfer(id)) {
            const userLabel = t ? (t.userName || t.userId || "account") : "account";
            showToast(`Transfer ${id} for ${userLabel} PERMITTED and processed successfully.`);
            renderAdminOverview();
            populateAccountSelector();
            renderTransfersTable();
            renderUsersTable();
          }
        }
      });
    });
  }

  // ==================== Manual Balance Form ====================
  if (balanceForm) {
    balanceForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const acct = acctSelect.value;
      const amount = parseFloat(amtInput.value);

      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive dollar amount.");
        return;
      }

      if (typeof updateBalance === "function") {
        const newBal = updateBalance(acct, amount);

        // Record confirmed admin credit transaction in store history
        try {
          const txs = typeof getStoreTransactions === "function" ? getStoreTransactions() : [];
          txs.unshift({
            accountId: acct,
            desc: "Funds Credit Permitted by Admin",
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
            amount: amount,
            isNegative: false
          });
          localStorage.setItem("boa_tx_history", JSON.stringify(txs));
        } catch (err) {}

        showToast(
          `Permitted +$${amount.toLocaleString("en-US", {
            minimumFractionDigits: 2
          })} increase to ${acct}. New balance: $${newBal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
        );
        amtInput.value = "";
        renderAdminOverview();
        populateAccountSelector();
        renderUsersTable();
      }
    });
  }

  // ==================== Registered Users Table ====================
  function renderUsersTable() {
    if (!usersTbody) return;
    const users = getRegisteredUsersList();

    const allUsers = [
      {
        username: "ExecutiveEmpire",
        fullName: "Executive Empire Circle",
        email: "executive@circle.com",
        accountType: "Preferred Rewards Gold Member",
        accountNum: "5165 8482 7284",
        isDefault: true,
        liveBalance: getBalance("checking_7284")
      },
      ...users.map((u) => {
        const chk = getBalance(`checking_${u.username}`);
        const sav = getBalance(`savings_${u.username}`);
        return {
          ...u,
          isDefault: false,
          liveBalance: chk + sav
        };
      })
    ];

    let html = "";
    allUsers.forEach((u) => {
      const defaultBadge = u.isDefault
        ? ' <span style="font-size: 10px; background: #012169; color: #fff; padding: 2px 6px; border-radius: 4px; margin-left: 4px;">DEFAULT</span>'
        : "";
      const balStr = `$${u.liveBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

      const actionBtn = u.isDefault
        ? `<button class="permit-btn" data-quick-acct="checking_7284">+ Permit Funds</button>`
        : `<button class="permit-btn" data-quick-acct="checking_${u.username}" data-name="${u.fullName}">+ Permit Funds</button>`;

      html += `
        <tr>
          <td><strong>${u.username}</strong>${defaultBadge}</td>
          <td>${u.fullName || "—"}</td>
          <td>${u.email || "—"}</td>
          <td>${u.accountType || "Advantage Banking"}</td>
          <td><code>${u.accountNum || "—"}</code></td>
          <td><strong style="color: var(--positive);">${balStr}</strong></td>
          <td>${actionBtn}</td>
        </tr>
      `;
    });

    usersTbody.innerHTML = html;

    usersTbody.querySelectorAll("[data-quick-acct]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetAcct = btn.getAttribute("data-quick-acct");
        const name = btn.getAttribute("data-name") || "this account";
        const amtStr = prompt(`Enter amount in USD to permit and credit to ${name}:`, "50000");
        if (!amtStr) return;

        const amount = parseFloat(amtStr);
        if (isNaN(amount) || amount <= 0) {
          alert("Please enter a valid positive dollar amount.");
          return;
        }

        const newBal = updateBalance(targetAcct, amount);

        // Record confirmed transaction
        try {
          const txs = typeof getStoreTransactions === "function" ? getStoreTransactions() : [];
          txs.unshift({
            accountId: targetAcct,
            desc: "Funds Credit Permitted by Admin",
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
            amount: amount,
            isNegative: false
          });
          localStorage.setItem("boa_tx_history", JSON.stringify(txs));
        } catch (err) {}

        showToast(
          `Permitted +$${amount.toLocaleString("en-US", {
            minimumFractionDigits: 2
          })} credit to ${name}. New balance: $${newBal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
        );
        renderAdminOverview();
        populateAccountSelector();
        renderUsersTable();
      });
    });
  }

  // ==================== Auto-Sync Cloud Database on Load ====================
  if (window.firebaseDB && window.firebaseDB.isConfigured()) {
    window.firebaseDB.syncAll().then(() => {
      renderAdminOverview();
      populateAccountSelector();
      renderDepositsTable();
      renderTransfersTable();
      renderUsersTable();
    });
  }

  // Reset balances button
  const resetBtn = document.getElementById("btn-reset-balances");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset all account balances and clear pending transactions to original defaults?")) {
        localStorage.removeItem("boa_balances");
        localStorage.removeItem("boa_pending_deposits");
        localStorage.removeItem("boa_pending_tx");
        localStorage.removeItem("boa_tx_history");
        showToast("All balances and pending transactions reset to defaults.");
        renderAdminOverview();
        populateAccountSelector();
        renderDepositsTable();
        renderTransfersTable();
        renderUsersTable();
      }
    });
  }

  renderAdminOverview();
  populateAccountSelector();
  renderDepositsTable();
  renderTransfersTable();
  renderUsersTable();
});
