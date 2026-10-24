// Bank of America Transfers Page — Logic

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

// Populate user-specific accounts
let ACCOUNTS = [];
if (isCustomUser) {
  const chkId = `checking_${currentUser.username}`;
  const savId = `savings_${currentUser.username}`;
  ACCOUNTS = [
    { id: chkId, name: `${currentUser.fullName} Checking (···${currentUser.accountLast4 || '7284'})` },
    { id: savId, name: `Advantage Savings (···${currentUser.savingsLast4 || '7297'})` }
  ];
} else {
  ACCOUNTS = [
    { id: "checking_7284", name: "Mr Jason Statham" },
    { id: "jhoshys_acc", name: "Mr Sylvester Stallone" },
    { id: "kikis_acc", name: "Mr Timothy Terk P" },
    { id: "savings_7297", name: "Savings Account 7297" }
  ];
}

const TYPE_LABELS = {
  own: "My BoA Accounts",
  customer: "Another BoA Customer",
  wire: "Wire Transfer",
  zelle: "Zelle"
};

// No preset caps — transfers of any amount are allowed (still validated against available balance)
const TYPE_LIMITS = {
  own: Infinity,
  customer: Infinity,
  zelle: Infinity,
  wire: Infinity
};

const TYPE_HINTS = {
  own: "Transfers between your accounts post immediately. No transfer limit applies.",
  customer: "Recipient must have a Bank of America account. No transfer limit applies.",
  zelle: "Money typically arrives in minutes with Zelle. No transfer limit applies.",
  wire: "Domestic wires post same-day; international wires arrive in 1-3 business days. No transfer limit applies."
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("transfer-form");
  const fromSelect = document.getElementById("transfer-from");
  const toSelect = document.getElementById("transfer-to");
  const dateSelect = document.getElementById("transfer-date");
  const amountInput = document.getElementById("transfer-amount");
  const successBanner = document.getElementById("transfer-success");
  const errorBanner = document.getElementById("transfer-error");
  const recentList = document.getElementById("recent-transfers");
  const hintEl = document.querySelector("#transfer-form .form-hint");
  const typeRadios = document.querySelectorAll('input[name="transfer-type"]');
  const segBtns = document.querySelectorAll(".seg-btn");
  const wireCodeLabel = document.getElementById("wire-code-label");
  const wireCodeInput = document.getElementById("wire-code");
  let wireScope = "domestic";

  function getType() {
    return document.querySelector('input[name="transfer-type"]:checked').value;
  }

  function setPanel(activeId) {
    document.querySelectorAll(".type-panel").forEach((p) => p.classList.remove("active"));
    const target = document.getElementById(activeId);
    if (target) target.classList.add("active");
  }

  function updateHint() {
    if (hintEl) hintEl.textContent = TYPE_HINTS[getType()];
  }

  // Populate account selects
  if (fromSelect && toSelect) {
    fromSelect.innerHTML = "";
    toSelect.innerHTML = "";
    ACCOUNTS.forEach((acc) => {
      const label = `${acc.name} (${formatMoney(getBalance(acc.id))})`;
      fromSelect.insertAdjacentHTML("beforeend", `<option value="${acc.id}">${label}</option>`);
      toSelect.insertAdjacentHTML("beforeend", `<option value="${acc.id}">${label}</option>`);
    });

    fromSelect.value = ACCOUNTS[0].id;
    toSelect.value = ACCOUNTS[1] ? ACCOUNTS[1].id : ACCOUNTS[0].id;
  }

  // Default the calendar to today
  const todayISO = new Date().toISOString().slice(0, 10);
  if (dateSelect) dateSelect.value = todayISO;

  // Transfer type switching
  typeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      setPanel(`panel-${radio.value}`);
      updateHint();
      clearError();
    });
  });

  // Sidebar shortcuts
  function selectTransferType(value) {
    const radio = document.querySelector(`input[name="transfer-type"][value="${value}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change"));
    }
    const transferFormEl = document.getElementById("transfer-form");
    if (transferFormEl) {
      transferFormEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const goCustomerBtn = document.getElementById("go-customer");
  if (goCustomerBtn) goCustomerBtn.addEventListener("click", () => selectTransferType("customer"));

  const goWireBtn = document.getElementById("go-wire");
  if (goWireBtn) goWireBtn.addEventListener("click", () => selectTransferType("wire"));

  // Wire scope switching (domestic / international)
  segBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      segBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      wireScope = btn.getAttribute("data-scope");
      if (wireScope === "domestic") {
        if (wireCodeLabel) wireCodeLabel.textContent = "ABA routing number";
        if (wireCodeInput) wireCodeInput.placeholder = "9-digit routing";
      } else {
        if (wireCodeLabel) wireCodeLabel.textContent = "SWIFT / BIC code";
        if (wireCodeInput) wireCodeInput.placeholder = "e.g. BOFAUS3N";
      }
    });
  });

  // Prevent same account on both selects
  [fromSelect, toSelect].forEach((select) => {
    if (!select) return;
    select.addEventListener("change", () => {
      if (fromSelect.value === toSelect.value) {
        const other = select === fromSelect ? toSelect : fromSelect;
        const fallback = ACCOUNTS.find((acc) => acc.id !== select.value);
        if (fallback) other.value = fallback.id;
      }
    });
  });

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearError();
      if (successBanner) successBanner.classList.remove("show");

      const type = getType();
      const amount = parseFloat(amountInput.value);
      const fromName = fromSelect.options[fromSelect.selectedIndex].text.split(" (")[0];

      if (!amount || amount <= 0) {
        showError("Please enter a valid transfer amount.");
        return;
      }

      // Transfer amount limit removed — any amount is allowed (funds are still checked below)
      let title = "";
      let detail = "";
      let fromLabel = fromName;
      let toLabel = "External";
      let transferToId = null;

      if (type === "own") {
        if (fromSelect.value === toSelect.value) {
          showError("Please choose two different accounts for the transfer.");
          return;
        }
        transferToId = toSelect.value;
        toLabel = toSelect.options[toSelect.selectedIndex].text.split(" (")[0];
        title = `${fromName} to ${toLabel}`;
        detail = `$${amount.toFixed(2)} transferred from ${fromName} to ${toLabel}.`;
      }

      if (type === "customer") {
        const name = val("rec-name");
        const account = val("rec-account");
        const routing = val("rec-routing");
        if (!name || !account || !routing) {
          showError("Please complete all recipient details.");
          return;
        }
        if (!/^\d{8,17}$/.test(account.replace(/\s/g, ""))) {
          showError("Please enter a valid recipient account number.");
          return;
        }
        toLabel = name;
        title = `To ${name} — BoA Customer`;
        detail = `$${amount.toFixed(2)} sent to ${name} at Bank of America.`;
      }

      if (type === "wire") {
        const name = val("wire-name");
        const bank = val("wire-bank");
        const account = val("wire-acct");
        const code = val("wire-code");
        if (!name || !bank || !account || !code) {
          showError("Please complete all wire details.");
          return;
        }
        if (wireScope === "domestic" && !/^\d{9}$/.test(code.trim())) {
          showError("Please enter a valid 9-digit ABA routing number.");
          return;
        }
        if (wireScope === "international" && !/^[A-Za-z0-9]{8,11}$/.test(code.trim())) {
          showError("Please enter a valid 8-11 character SWIFT / BIC code.");
          return;
        }
        toLabel = name;
        title =
          wireScope === "domestic"
            ? `Wire to ${name} — ${bank}`
            : `International Wire to ${name} — ${bank}`;
        detail = `$${amount.toFixed(2)} wired to ${name} at ${bank}.`;
      }

      if (type === "zelle") {
        const contact = val("zelle-contact");
        const name = val("zelle-name");
        if (!name) {
          showError("Please enter the recipient's name.");
          return;
        }
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
        const isPhone = /^[+]?[\d\s().-]{7,}$/.test(contact);
        if (!isEmail && !isPhone) {
          showError("Please enter a valid email address or phone number.");
          return;
        }
        toLabel = name;
        title = `Zelle to ${contact} (${name})`;
        detail = `$${amount.toFixed(2)} sent via Zelle to ${contact}.`;
      }

      const fromBalance = getBalance(fromSelect.value);
      if (amount > fromBalance) {
        showError(`Insufficient funds in ${fromName}. Available balance: ${formatMoney(fromBalance)}.`);
        return;
      }

      // Create a pending transfer awaiting admin permit
      const pickedDate = dateSelect.value ? new Date(dateSelect.value + "T00:00:00") : new Date();
      const transfer = {
        txId: "TX" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10),
        type: TYPE_LABELS[type],
        userId: currentUser ? currentUser.username : "ExecutiveEmpire",
        userName: currentUser ? currentUser.fullName : "Executive Empire Circle",
        fromId: fromSelect.value,
        fromName: fromName,
        toId: transferToId,
        toName: toLabel,
        amount: amount,
        date: pickedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        descFrom: type === "own" ? `Transfer to ${toLabel}` : title,
        descTo: `Transfer from ${fromName}`
      };
      addPendingTransfer(transfer);

      const isScheduled = pickedDate.toDateString() !== new Date().toDateString();
      const dateLabel = transfer.date;

      if (recentList) {
        // If there was an empty notice, clear it
        const emptyNotice = recentList.querySelector(".empty-notice");
        if (emptyNotice) emptyNotice.remove();

        const item = document.createElement("div");
        item.className = "list-item";
        item.innerHTML = `
          <div>
            <div class="list-item-title">${title}</div>
            <div class="list-item-sub">${dateLabel} · ${TYPE_LABELS[type]}</div>
          </div>
          <div class="list-item-right">
            <span class="list-item-amt loss">-$${amount.toFixed(2)}</span>
            <span class="status-badge ${isScheduled ? "scheduled" : "pending"}">${isScheduled ? "Scheduled" : "Awaiting Admin Permit"}</span>
          </div>
        `;
        recentList.prepend(item);
      }

      if (successBanner) {
        successBanner.textContent = `Transfer submitted! ${detail}`;
        successBanner.classList.add("show");
      }
      amountInput.value = "";

      if (typeof window.showSuccessModal === "function") {
        window.showSuccessModal({
          title: "Transfer Submitted",
          subtitle: `${detail} This transfer is awaiting confirmation in the Admin Control Panel.`,
          from: fromLabel,
          to: toLabel,
          amount: formatMoney(amount)
        });
      }
    });
  }

  // ==================== Pending transfers from store ====================
  function renderPendingTransfers() {
    if (!recentList) return;
    const allPending = getPendingTransfers();
    const userPending = allPending.filter((t) => {
      if (isCustomUser) {
        return (
          t.userId === currentUser.username ||
          (t.fromId && t.fromId.includes(currentUser.username)) ||
          (t.toId && t.toId.includes(currentUser.username))
        );
      }
      return !t.userId || t.userId === "ExecutiveEmpire";
    });

    userPending.forEach((tx) => {
      const title = tx.type === "My BoA Accounts" ? `${tx.fromName} to ${tx.toName}` : tx.descFrom;
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div>
          <div class="list-item-title">${title}</div>
          <div class="list-item-sub">${tx.date} · ${tx.type || 'Transfer'}</div>
        </div>
        <div class="list-item-right">
          <span class="list-item-amt loss">-$${tx.amount.toFixed(2)}</span>
          <span class="status-badge pending">Awaiting Admin Permit</span>
        </div>
      `;
      recentList.prepend(item);
    });

    // If custom user and no pending transfers yet, show clean empty state
    if (isCustomUser && userPending.length === 0) {
      recentList.innerHTML = `<div class="empty-notice" style="padding: 24px 16px; text-align: center; color: var(--text-secondary); font-size: 13.5px;">No transfer transactions yet. Transfers you submit will appear here.</div>`;
    }
  }

  renderPendingTransfers();

  // ==================== Savings account recent transactions (Only for Executive Empire) ====================
  if (!isCustomUser && recentList) {
    SAVINGS_HISTORY.forEach((tx) => {
      const item = document.createElement("div");
      item.className = "list-item";
      item.innerHTML = `
        <div>
          <div class="list-item-title">${tx.desc}</div>
          <div class="list-item-sub">${tx.date} · Savings Account 7297</div>
        </div>
        <div class="list-item-right">
          <span class="list-item-amt ${tx.isNegative ? "loss" : "gain"}">${tx.amount}</span>
          <span class="status-badge completed">${tx.isNegative ? "Payment" : "Deposit"}</span>
        </div>
      `;
      recentList.append(item);
    });
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function clearError() {
    if (errorBanner) errorBanner.classList.remove("show");
  }

  function showError(message) {
    if (!errorBanner) return;
    errorBanner.textContent = message;
    errorBanner.classList.add("show");
    errorBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});
