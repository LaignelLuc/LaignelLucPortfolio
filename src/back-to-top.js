export function initBackToTop() {
  const button = document.querySelector(".to-top");
  if (!button) return;

  function updateVisibility() {
    button.classList.toggle(
      "is-visible",
      window.scrollY > window.innerHeight * 0.55
    );
  }

  addEventListener("scroll", updateVisibility, { passive: true });
  addEventListener("resize", updateVisibility);
  updateVisibility();

  button.addEventListener("click", () => {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });
}
