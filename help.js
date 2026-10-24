// Bank of America Help Page — Logic

document.addEventListener("DOMContentLoaded", () => {
  const faqItems = document.querySelectorAll(".faq-item");
  const searchInput = document.getElementById("faq-search");

  // Accordion toggle (one open at a time)
  faqItems.forEach(item => {
    item.querySelector(".faq-question").addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      faqItems.forEach(i => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });

  // Live FAQ filter
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    faqItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? "block" : "none";
    });
  });
});
