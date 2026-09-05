/* Independent effects share a normalized 1000 × 340 stage.
 * Add an effect to effects, then enable it in _data/neighborhood.yml.
 * Each draw(ctx, time, season) must also produce a useful still at time = 0.
 */
(() => {
  'use strict';
  const root = document.querySelector('[data-neighborhood]');
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const config = JSON.parse(root.querySelector('[data-scene-config]').textContent);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const automaticSeason = () => ['winter', 'spring', 'summer', 'autumn'][Math.floor(((new Date().getMonth() + 1) % 12) / 3)];
  let season = config.season === 'auto' ? automaticSeason() : config.season;
  let paused = reducedMotion.matches;
  let visible = true;
  let frame = null;
  let time = 0;
  let previous = null;
  const enabled = { ...config.animations };
  const dot = (x, y, size, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
  };
  const effects = {
    packets(context, t) {
      // Quiet messages following the street in front of the shops.
      const routes = [[225, 281, 842, 281], [842, 293, 225, 293]];
      routes.forEach(([x1, y1, x2, y2], i) => {
        for (let n = 0; n < 3; n++) {
          const progress = (t / 18000 + n / 3 + i * .17) % 1;
          dot(x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress, 3, i ? '#ffb02e' : '#41e8ff');
        }
      });
    },
    signals(context, t) {
      [[401, 17], [575, 11], [594, 12]].forEach(([x, y], i) => {
        dot(x, y, 3, Math.floor(t / 1400 + i) % 3 === 0 ? '#b6ff2e' : '#43505a');
      });
    },
    weather(context, t, currentSeason) {
      if (currentSeason === 'summer') return;
      const colors = { winter: '#d9edff', autumn: '#ffb02e', spring: '#ff9eb7' };
      const count = currentSeason === 'winter' ? 36 : 14;
      for (let i = 0; i < count; i++) {
        const x = ((i * 79 + Math.sin(t / 2800 + i) * 12 + t / 160) % 1000 + 1000) % 1000;
        const y = (i * 47 + t / (currentSeason === 'winter' ? 75 : 110)) % 330;
        dot(x, y, currentSeason === 'winter' ? 2 : 3, colors[currentSeason]);
      }
    }
  };
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Object.entries(effects).forEach(([name, effect]) => {
      if (enabled[name]) effect(ctx, time, season);
    });
  }
  function tick(now) {
    frame = null;
    if (previous !== null) time += Math.min(now - previous, 100);
    previous = now;
    draw();
    if (!paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function synchronize() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previous = null;
    root.dataset.season = season;
    draw();
    if (!paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  reducedMotion.addEventListener('change', event => { paused = event.matches; synchronize(); });
  document.addEventListener('visibilitychange', synchronize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      synchronize();
    }).observe(root);
  }
  synchronize();
})();
