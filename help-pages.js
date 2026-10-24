// Bank of America Help Detail Pages — Session Verification

if (localStorage.getItem("boa_authenticated") !== "true") {
  window.location.href = "login.html?redirect=true";
}
