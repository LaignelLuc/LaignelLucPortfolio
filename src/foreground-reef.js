function smoothstep(x, min, max) {
  if (min === max) return x < min ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

export function createForegroundReef() {
  const root = document.querySelector(".foreground-reef");
  if (!root) return { update() {} };

  function update(progress) {
    const amount = 1 - smoothstep(progress, 0.04, 0.26);
    root.style.opacity = amount;
    root.classList.toggle("is-hidden", amount <= 0.002);
  }

  return { update };
}
