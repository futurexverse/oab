// Bank of America Life Plan Page — Session verification

if (localStorage.getItem("boa_authenticated") !== "true") {
  window.location.href = "login.html?redirect=true";
}
