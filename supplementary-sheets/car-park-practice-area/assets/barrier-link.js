document.addEventListener("click", (event) => {
  const link = event.target.closest(".rail-capstone");
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  event.preventDefault();
  link.classList.add("is-opening");
  window.setTimeout(() => { window.location.href = link.href; }, 1850);
});
