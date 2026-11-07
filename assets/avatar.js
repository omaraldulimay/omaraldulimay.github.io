// Großer Avatar im Hero: folgt der Maus, schaut sich ohne Maus selbst um, redet per Sprechblase.
(function () {
  var el = document.querySelector('.avatar');
  if (!el) return;
  var img = el.querySelector('img');   // Grundgesicht, die Mimik liegt als .fx darüber
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show() {
    el.classList.add('in');
    // Erst grüßen, wenn der Kopf wirklich da ist und die Seite steht.
    var hi = function () { setTimeout(function () { say(lines[0], 4200); }, 900); };
    if (document.readyState === 'complete') hi(); else addEventListener('load', hi);
  }
  img.addEventListener('error', function () { el.remove(); });

  var tx = 0, ty = 0, x = 0, y = 0, lastMove = -1e9, visible = true, sy = 0;
  addEventListener('scroll', function () { sy = Math.min(scrollY, 900) * 0.25; el.style.setProperty('--sy', sy.toFixed(1) + 'px'); }, { passive: true });
  if (matchMedia('(hover:hover)').matches) {
    addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      // Blickrichtung relativ zum Kopf, nicht zum Fenster: so schaut er wirklich auf den Zeiger.
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.4)) / (innerHeight / 2)));
      lastMove = performance.now();
    }, { passive: true });
  }

  function start() {
    show();
    if (still) return;
    // Ganzer Kopf bewegt sich, das Gesicht selbst wird nie verzerrt.
    (function loop(t) {
      requestAnimationFrame(loop);
      if (!visible) return;
      t = t || 0;
      if (t - lastMove > 2500) { tx = Math.sin(t / 1900) * 0.7; ty = Math.sin(t / 2700) * 0.35; }
      x += (tx - x) * 0.07; y += (ty - y) * 0.07;
      el.style.setProperty('--rx', (y * -6).toFixed(2) + 'deg');
      el.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (x * 16).toFixed(1) + 'px');
    })();
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(el);
  }
  if (img.complete && img.naturalWidth) start(); else img.addEventListener('load', start);

  // Sprechblase und Klick: kleine Reaktionen, damit der Kopf lebendig wirkt.
  var bubble = el.querySelector('.av-bubble'), lines = [
    'Hi, ich bin Omar 👋', 'Scroll runter, alles hier kannst du ausprobieren.', 'Klick ruhig doppelt auf Bezahlen. Passiert nix.',
    'Lieblingsprojekt? Ledger Lane.', 'Kaffee an der Alster? Schreib mir.'
  ], n = 0, hideT;
  function say(t, ms) {
    if (!bubble) return;
    bubble.textContent = t; bubble.classList.add('on');
    clearTimeout(hideT); hideT = setTimeout(function () { bubble.classList.remove('on'); }, ms || 3200);
  }
  // Mimik: nur Blinzeln, danach zurück zum Grundgesicht.
  var faceT, held = null;
  function face(f, ms) {
    if (still) return;
    clearTimeout(faceT); el.dataset.face = f;
    if (ms) faceT = setTimeout(function () { el.dataset.face = held || ''; }, ms);
  }
  (function blink() {
    setTimeout(function () { if (!el.dataset.face) face('blink', 140); blink(); }, 2500 + Math.random() * 3500);
  })();
  el.style.pointerEvents = 'auto'; el.style.cursor = 'pointer';
  el.addEventListener('click', function () {
    n = (n + 1) % lines.length; say(lines[n]);
    el.classList.remove('nod'); void el.offsetWidth; el.classList.add('nod');
  });
  [].forEach.call(document.querySelectorAll('.btn-k, .icons a'), function (a) {
    a.addEventListener('mouseenter', function () { say('Ja, schreib mir! 🙂', 2000); });
  });
})();
