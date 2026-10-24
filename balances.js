// Shared balance store — authoritative balances persisted in localStorage

const DEFAULT_BALANCES = {
  checking_7284: 919965.06,
  jhoshys_acc: 950348.93,
  kikis_acc: 50000.19,
  savings_7297: 1920000.00
};

function loadBalances() {
  try {
    const raw = localStorage.getItem("boa_balances");
    if (raw) return Object.assign({}, DEFAULT_BALANCES, JSON.parse(raw));
  } catch (e) {}
  return Object.assign({}, DEFAULT_BALANCES);
}

function getBalance(accountId) {
  const b = loadBalances();
  return b[accountId] != null ? b[accountId] : 0;
}

function updateBalance(accountId, delta) {
  const b = loadBalances();
  b[accountId] = Math.round((b[accountId] + delta) * 100) / 100;
  localStorage.setItem("boa_balances", JSON.stringify(b));
  if (window.firebaseDB) {
    window.firebaseDB.setBalance(accountId, b[accountId]);
  }
  return b[accountId];
}

function setExactBalance(accountId, amount) {
  const b = loadBalances();
  b[accountId] = Math.round(Number(amount) * 100) / 100;
  localStorage.setItem("boa_balances", JSON.stringify(b));
  if (window.firebaseDB) {
    window.firebaseDB.setBalance(accountId, b[accountId]);
  }
  return b[accountId];
}

function formatMoney(value) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// ==================== Transaction store ====================

const PENDING_KEY = "boa_pending_tx";
const TX_KEY = "boa_tx_history";

// Savings account recent transactions, shared across pages
const SAVINGS_HISTORY = [
  { desc: "Regular Interest Paid Payment", date: "Jul 29, 2026", amount: "+$12.54", isNegative: false },
  { desc: "Transfer to Mr Jason Statham", date: "Jul 24, 2026", amount: "-$5,000.00", isNegative: true },
  { desc: "Zelle Transfer to S. Stallone", date: "Jul 21, 2026", amount: "-$2,400.00", isNegative: true },
  { desc: "ATM Withdrawal Cash NYC", date: "Jul 17, 2026", amount: "-$300.00", isNegative: true },
  { desc: "Mobile Check Deposit from Jason Statham", date: "Jul 15, 2026", amount: "+$250,000.00", isNegative: false },
  { desc: "Wire Transfer IN Merrill", date: "Jul 14, 2026", amount: "+$15,000.00", isNegative: false },
  { desc: "Transfer to Mr Timothy Terk P", date: "Jul 11, 2026", amount: "-$1,200.00", isNegative: true },
  { desc: "Stock Dividend Transfer BoA", date: "Jul 09, 2026", amount: "+$3,450.00", isNegative: false },
  { desc: "Mobile Check Deposit from Timothy Terk P", date: "Jul 07, 2026", amount: "+$50,000.00", isNegative: false },
  { desc: "Bill Payment Con Edison", date: "Jul 05, 2026", amount: "-$420.50", isNegative: true },
  { desc: "Internal Transfer from Mr Jason Statham", date: "Jul 03, 2026", amount: "+$10,000.00", isNegative: false },
  { desc: "Transfer to Savings Reserve", date: "Jun 22, 2026", amount: "-$7,500.00", isNegative: true },
  { desc: "Regular Interest Paid Payment", date: "Jun 12, 2026", amount: "+$61.80", isNegative: false },
  { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Jun 09, 2026", amount: "+$250,000.00", isNegative: false },
  { desc: "Mobile Check Deposit from Jason Statham", date: "Jun 01, 2026", amount: "+$250,000.00", isNegative: false },
  { desc: "ATM Withdrawal Cash Miami FL", date: "May 28, 2026", amount: "-$500.00", isNegative: true },
  { desc: "Mobile Check Deposit from Sylvester Stallone", date: "May 15, 2026", amount: "+$250,000.00", isNegative: false },
  { desc: "Wire Transfer IN Estate Settlement", date: "Apr 25, 2026", amount: "+$25,000.00", isNegative: false },
  { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Apr 18, 2026", amount: "+$200,000.00", isNegative: false },
  { desc: "Mobile Check Deposit from Jason Statham", date: "Apr 15, 2026", amount: "+$200,000.00", isNegative: false },
  { desc: "Transfer to Mr Sylvester Stallone", date: "Mar 30, 2026", amount: "-$3,300.00", isNegative: true },
  { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Mar 22, 2026", amount: "+$100,000.00", isNegative: false },
  { desc: "Mobile Check Deposit from Jason Statham", date: "Mar 01, 2026", amount: "+$150,000.00", isNegative: false },
  { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Feb 24, 2026", amount: "+$75,000.00", isNegative: false },
  { desc: "Regular Interest Paid Payment", date: "Feb 20, 2026", amount: "+$40.00", isNegative: false },
  { desc: "Bill Payment Verizon Wireless", date: "Feb 05, 2026", amount: "-$180.00", isNegative: true },
  { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Jan 28, 2026", amount: "+$50,000.00", isNegative: false },
  { desc: "Transfer to Emergency Fund", date: "Jan 20, 2026", amount: "-$2,000.00", isNegative: true },
  { desc: "Mobile Check Deposit from Jason Statham", date: "Jan 15, 2026", amount: "+$70,000.00", isNegative: false },
  { desc: "Mobile Check Deposit from Sylvester Stallone", date: "Jan 02, 2026", amount: "+$25,000.00", isNegative: false }
];

function cleanStoredEntry(entry) {
  const fields = [entry.desc, entry.title, entry.descFrom, entry.descTo, entry.toName, entry.fromName];
  return !fields.some(f => typeof f === "string" && f.toLowerCase().includes("soloabuh2@gmail.com"));
}

function getPendingTransfers() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.filter(cleanStoredEntry);
  } catch (e) { return []; }
}

function savePendingTransfers(pending) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

function addPendingTransfer(tx) {
  const pending = getPendingTransfers();
  pending.unshift(tx);
  savePendingTransfers(pending);
  if (window.firebaseDB) {
    window.firebaseDB.saveTransfer(tx);
  }
}

function getStoreTransactions() {
  try {
    const raw = localStorage.getItem(TX_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.filter(cleanStoredEntry);
  } catch (e) { return []; }
}

function confirmTransfer(txId) {
  const pending = getPendingTransfers();
  const idx = pending.findIndex(t => t.txId === txId);
  if (idx === -1) return false;
  const tx = pending[idx];
  pending.splice(idx, 1);
  savePendingTransfers(pending);
  if (window.firebaseDB) {
    window.firebaseDB.removeTransfer(txId);
  }

  updateBalance(tx.fromId, -tx.amount);
  if (tx.toId) updateBalance(tx.toId, tx.amount);

  const txs = getStoreTransactions();
  txs.unshift({ accountId: tx.fromId, desc: tx.descFrom, date: tx.date, amount: -tx.amount, isNegative: true });
  if (tx.toId) {
    txs.unshift({ accountId: tx.toId, desc: tx.descTo, date: tx.date, amount: tx.amount, isNegative: false });
  }
  localStorage.setItem(TX_KEY, JSON.stringify(txs));
  return true;
}

// ==================== Deposit Store & Admin Permit Helpers ====================
const DEPOSITS_KEY = "boa_pending_deposits";

function getPendingDeposits() {
  try {
    const raw = localStorage.getItem(DEPOSITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function savePendingDeposits(deposits) {
  localStorage.setItem(DEPOSITS_KEY, JSON.stringify(deposits));
}

function addPendingDeposit(dep) {
  const list = getPendingDeposits();
  list.unshift(dep);
  savePendingDeposits(list);
  if (window.firebaseDB) {
    window.firebaseDB.saveDeposit(dep);
  }
}

function permitApproveDeposit(depId) {
  const list = getPendingDeposits();
  const dep = list.find(d => d.id === depId);
  if (!dep || dep.status === "Completed") return false;

  dep.status = "Completed";
  savePendingDeposits(list);
  if (window.firebaseDB) {
    window.firebaseDB.saveDeposit(dep);
  }

  // Increase dashboard main checking account balance by the exact USD amount
  const targetAcc = dep.targetAccount || "checking_7284";
  updateBalance(targetAcc, dep.usdAmount);

  // Add to store transactions history
  const txs = getStoreTransactions();
  txs.unshift({
    accountId: targetAcc,
    desc: `Crypto Deposit (${dep.cryptoAsset}) &middot; ${dep.cryptoAmount} ${dep.cryptoAsset}`,
    date: dep.date || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    amount: dep.usdAmount,
    isNegative: false
  });
  localStorage.setItem(TX_KEY, JSON.stringify(txs));
  return true;
}

function rejectDeposit(depId) {
  const list = getPendingDeposits();
  const dep = list.find(d => d.id === depId);
  if (!dep) return false;

  dep.status = "Declined";
  savePendingDeposits(list);
  if (window.firebaseDB) {
    window.firebaseDB.saveDeposit(dep);
  }
  return true;
}

