// Bank of America Invest Page — Logic

// Session Verification Check
if (localStorage.getItem("boa_authenticated") !== "true") {
  window.location.href = "login.html?redirect=true";
}

document.addEventListener("DOMContentLoaded", () => {
  const rows = document.querySelectorAll(".holdings-table tbody tr");

  rows.forEach(row => {
    row.addEventListener("click", () => {
      rows.forEach(r => r.classList.remove("selected"));
      row.classList.add("selected");
    });
  });
});
