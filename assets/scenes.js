// Projektszenen abspielen, sobald sie ins Bild kommen, und den Kartenstapel der Startseite steuern.
(function () {
  var doc = document;
  function play(el) { el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }

  var scenes = doc.querySelectorAll('.scene');
  if (!('IntersectionObserver' in window)) {
    [].forEach.call(scenes, function (s) { s.classList.add('on'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var sc = e.target.querySelector('.scene');
        if (e.isIntersecting) { if (!sc.classList.contains('on')) play(sc); }
        else sc.classList.remove('on');
      });
    }, { threshold: 0.35 });
    // Den Rahmen beobachten: die Szene selbst ist vor dem Start weggeschnitten und zählt sonst als unsichtbar.
    [].forEach.call(scenes, function (s) { io.observe(s.parentNode); });
  }

  // Weg einer Anfrage: ohne JS oder bei reduzierter Bewegung bleibt der Endzustand stehen.
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Label Lab Hero: Vorher/Nachher Regler. Fährt einmal langsam von Vorher zu Nachher, danach gehört er dem Besucher.
  [].forEach.call(doc.querySelectorAll('.ba'), function (ba) {
    var h = ba.querySelector('.ba-h'), card = ba.querySelector('.ba-card'), pb = ba.querySelector('.ba-pb').textContent,
      pa = ba.querySelector('.ba-pa').textContent, p = 50, raf = 0, drag = false;
    function set(v) {
      p = Math.max(0, Math.min(100, v));
      ba.style.setProperty('--p', p.toFixed(2));
      ba.setAttribute('data-side', p >= 50 ? 'before' : 'after');
      h.setAttribute('aria-valuenow', Math.round(p));
      h.setAttribute('aria-valuetext', pb + ' ' + Math.round(p) + ' %, ' + pa + ' ' + Math.round(100 - p) + ' %');
    }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    function at(e) { var r = card.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    ba.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      stop(); drag = true; try { ba.setPointerCapture(e.pointerId); } catch (x) {}
      at(e); h.focus({ preventScroll: true });
    });
    ba.addEventListener('pointermove', function (e) { if (drag) at(e); });
    ['pointerup', 'pointercancel'].forEach(function (n) { ba.addEventListener(n, function () { drag = false; }); });
    h.addEventListener('keydown', function (e) {
      var k = e.key, step = e.shiftKey ? 20 : 5;
      if (k === 'ArrowLeft' || k === 'ArrowDown') set(p - step);
      else if (k === 'ArrowRight' || k === 'ArrowUp') set(p + step);
      else if (k === 'PageDown') set(p - 20);
      else if (k === 'PageUp') set(p + 20);
      else if (k === 'Home') set(0);
      else if (k === 'End') set(100);
      else return;
      stop(); e.preventDefault();
    });
    set(50);
    if (calm || !('IntersectionObserver' in window)) return;
    set(94);
    var from = 94, to = 8, ms = 6500;
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return;
      o.disconnect();
      setTimeout(function () {
        if (drag || p !== from) return;  // schon angefasst
        var t0 = 0;
        (function step(t) {
          if (!t0) t0 = t;
          var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          set(from + (to - from) * e);
          raf = k < 1 ? requestAnimationFrame(step) : 0;
        })(performance.now());
      }, 900);
    }, { threshold: 0.4 }).observe(ba);
  });

  if (!calm && 'IntersectionObserver' in window) {
    // Projektseite: Kapitel wechselt mit dem Scrollen, auch rückwärts.
    [].forEach.call(doc.querySelectorAll('.hq-flow'), function (fl) {
      var sc = fl.querySelector('.hq,.fx'), steps = fl.querySelectorAll('.hq-step');
      function set(n) {
        sc.setAttribute('data-step', n);
        [].forEach.call(steps, function (s) { s.classList.toggle('on', s.getAttribute('data-s') === String(n)); });
      }
      fl.classList.add('live'); set(1);
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) set(e.target.getAttribute('data-s')); });
      }, { rootMargin: '-50% 0px -50% 0px' });
      [].forEach.call(steps, function (s) { so.observe(s); });
    });
    // Startseite: Kapitel laufen von selbst, solange die Karte im Bild ist.
    [].forEach.call(doc.querySelectorAll('.hq-auto,.fx-auto'), function (sc) {
      var names = sc.getAttribute('data-labels').split('|'), dots = sc.querySelectorAll('.hq-dots i,.fx-dots i'), cap = sc.querySelector('.hq-cap b,.fx-cap b'), n = 0, t = 0;
      function show(i) {
        sc.setAttribute('data-step', i); cap.textContent = names[i - 1];
        [].forEach.call(dots, function (d, k) { d.classList.toggle('on', k === i - 1); });
      }
      function tick() { n = n % names.length + 1; show(n); t = setTimeout(tick, n === names.length ? 4200 : 2500); }
      show(1);
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { if (!t) { n = 0; tick(); } }
        else { clearTimeout(t); t = 0; show(1); }
      }, { threshold: 0.5 }).observe(sc);
    });
  }

  // Kartenstapel: wird eine Karte überdeckt, tritt sie leicht nach hinten.
  var all = [].slice.call(doc.querySelectorAll('.stack .card')), cards = all.slice();

  // Filter nach Kategorie: ausgeblendete Karten raus, der Stapel schließt sich ohne Lücke.
  var bar = doc.querySelector('.pj-filter');
  if (bar) bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]'); if (!b) return;
    var f = b.dataset.f;
    [].forEach.call(bar.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    cards = all.filter(function (c) { var on = f === 'alle' || c.dataset.cat === f; c.hidden = !on; return on; });
    cards.forEach(function (c, i) { c.style.setProperty('--i', i); });
    var cnt = doc.querySelector('.pj-count'); if (cnt) cnt.textContent = String(cards.length).padStart(2, '0');
    var top = doc.getElementById('projekte').getBoundingClientRect().top + scrollY - 70;
    if (scrollY > top) scrollTo({ top: top, behavior: 'smooth' });
    if (typeof update === 'function') update();
  });
  if (!cards.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var mq = matchMedia('(min-width:900px)'), ticking = false;
  function update() {
    ticking = false;
    cards.forEach(function (c, i) {
      var inner = c.firstElementChild, next = cards[i + 1];
      if (!mq.matches || !next) { inner.style.transform = ''; inner.style.filter = ''; return; }
      var top = c.getBoundingClientRect().top, h = c.offsetHeight;
      var p = Math.min(1, Math.max(0, 1 - (next.getBoundingClientRect().top - top) / h));
      inner.style.transform = 'scale(' + (1 - p * 0.06) + ')';
      inner.style.filter = 'brightness(' + (1 - p * 0.45) + ')';
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
