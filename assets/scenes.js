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
  if (!calm && 'IntersectionObserver' in window) {
    // Projektseite: Kapitel wechselt mit dem Scrollen, auch rückwärts.
    [].forEach.call(doc.querySelectorAll('.hq-flow'), function (fl) {
      var sc = fl.querySelector('.hq'), steps = fl.querySelectorAll('.hq-step');
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
    [].forEach.call(doc.querySelectorAll('.hq-auto'), function (sc) {
      var names = sc.getAttribute('data-labels').split('|'), dots = sc.querySelectorAll('.hq-dots i'), cap = sc.querySelector('.hq-cap b'), n = 0, t = 0;
      function show(i) {
        sc.setAttribute('data-step', i); cap.textContent = names[i - 1];
        [].forEach.call(dots, function (d, k) { d.classList.toggle('on', k === i - 1); });
      }
      function tick() { n = n % 4 + 1; show(n); t = setTimeout(tick, n === 4 ? 4200 : 2500); }
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
