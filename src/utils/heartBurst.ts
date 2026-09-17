const HEART_COLORS = ['#ff5c8a', '#ff7eb6', '#ffd166', '#7ee8fa', '#b8f28b', '#c7a6ff'];

export function triggerHeartBurst(button: HTMLElement) {
  const burst = document.createElement('span');
  burst.className = 'heart-burst';
  burst.setAttribute('aria-hidden', 'true');

  const icon = button.querySelector('.fav-icon');
  if (icon) {
    const buttonBounds = button.getBoundingClientRect();
    const iconBounds = icon.getBoundingClientRect();
    burst.style.left = `${iconBounds.left - buttonBounds.left + iconBounds.width / 2}px`;
    burst.style.top = `${iconBounds.top - buttonBounds.top + iconBounds.height / 2}px`;
  }

  const core = document.createElement('span');
  core.className = 'heart-burst-core';
  core.textContent = '♥';
  core.setAttribute('aria-hidden', 'true');
  burst.appendChild(core);

  for (let index = 0; index < 12; index += 1) {
    const particle = document.createElement('span');
    const angle = (Math.PI * 2 * index) / 12 + (Math.random() - 0.5) * 0.28;
    const distance = 36 + Math.random() * 34;
    const size = 11 + Math.random() * 7;
    particle.className = 'heart-particle';
    particle.textContent = '♥';
    particle.style.setProperty('--heart-x', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--heart-y', `${Math.sin(angle) * distance}px`);
    particle.style.setProperty('--heart-size', `${size}px`);
    particle.style.setProperty('--heart-color', HEART_COLORS[index % HEART_COLORS.length]);
    particle.style.setProperty('--heart-delay', `${index * 14}ms`);
    burst.appendChild(particle);
  }

  for (let index = 0; index < 4; index += 1) {
    const spark = document.createElement('span');
    spark.className = 'heart-spark';
    spark.textContent = '✦';
    spark.style.setProperty('--spark-angle', `${index * 90 + 45}deg`);
    spark.style.setProperty('--spark-distance', `${32 + Math.random() * 18}px`);
    spark.style.setProperty('--spark-delay', `${index * 28}ms`);
    spark.style.setProperty('--heart-color', HEART_COLORS[(index + 2) % HEART_COLORS.length]);
    burst.appendChild(spark);
  }

  button.appendChild(burst);
  window.setTimeout(() => burst.remove(), 860);
}
