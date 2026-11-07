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

  // Kartenstapel: wird eine Karte überdeckt, tritt sie leicht nach hinten.
  var cards = [].slice.call(doc.querySelectorAll('.stack .card'));
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
