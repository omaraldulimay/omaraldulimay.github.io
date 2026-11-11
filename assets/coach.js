// Geführte Hinweise in den Demos: das nächste Element pulsiert golden und trägt ein kurzes Badge.
// Nach dem Klick erscheint der nächste Schritt, am Ende kurz "Geschafft".
(function () {
  var DE = (document.documentElement.lang || 'de').slice(0, 2) !== 'en';
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // sel: Ziel, hit: Klick, der den Schritt abschließt (Standard sel), until: Schritt endet, sobald dieses Element da ist.
  var CFG = {
    hdd: [
      { sel: '[data-co=km]', hit: '[data-co]', t: ['1. Firma wählen', '1. Pick a company'] },
      { sel: '[data-act=foreign]', t: ['2. Fremdes Ticket öffnen', '2. Open foreign ticket'] },
      { sel: '[data-act=nofilter]', t: ['3. Ohne Filter abfragen', '3. Ask without filter'] }],
    lld: [
      { sel: '[data-act=pay]', t: ['1. Bezahlen', '1. Pay'] },
      { sel: '[data-act=pay]', t: ['2. Aus Versehen doppelt klicken', '2. Click twice by accident'] },
      { sel: '[data-act=kill]', t: ['3. Server abstürzen lassen', '3. Crash the server'] },
      { sel: '[data-act=pay]', t: ['4. Trotzdem bezahlen', '4. Pay anyway'] }],
    rhd: [
      { sel: '[data-act=rush]', t: ['1. Ansturm starten', '1. Start the rush'] },
      { sel: '[data-act=deploy]', t: ['2. Fehlerhaftes Update einspielen', '2. Push a faulty update'] },
      { sel: '[data-act=pod]', t: ['3. Einen Server ausfallen lassen', '3. Take one server down'] },
      { sel: '[data-act=drop]', t: ['4. Limitierten Verkauf starten', '4. Start a limited sale'] }],
    ivd: [
      { sel: '[data-act=sell]', t: ['1. Im Laden verkaufen', '1. Sell in store'] },
      { sel: '[data-act=chaos]', t: ['2. Onlineshop ausfallen lassen', '2. Take shop down'] },
      { sel: '[data-act=sell]', t: ['3. Nochmal verkaufen', '3. Sell again'] },
      { sel: '[data-act=zero]', t: ['4. Fehlerhafte Lagerliste', '4. Faulty stock list'] },
      { sel: '[data-act=fix]', t: ['5. Liste korrigieren', '5. Correct the list'] }],
    cyd: [
      { sel: '.cy-opts:not(.notes) button', until: '.cy-opts.notes', t: ['1. Antwort wählen', '1. Pick an answer'] },
      { sel: '.cy-opts.notes button', hit: '[data-n]', t: ['2. Lieblingsnote wählen', '2. Pick a note'] },
      { sel: '[data-go]', t: ['3. Ergebnis zeigen', '3. Show result'] }],
    ksd: [
      { sel: '.ks-chip:not(.on):not(:has(em))', hit: '[data-q]', t: ['1. Weitere Frage anklicken', '1. Click another question'] },
      { sel: '.ks-chip:has(em):not(.on)', hit: '[data-q]', t: ['2. Schwierige Frage testen', '2. Try a tricky one'] },
      { sel: '#ksd-users button:not([aria-pressed=true])', hit: '[data-u]', t: ['3. Andere Person wählen', '3. Pick another person'] }],
    pld: [
      { sel: '[data-act=flaky]', t: ['1. Verbindung stören', '1. Disturb connection'] },
      { sel: '[data-act=run]', t: ['2. Nochmal starten', '2. Run again'] }]
  };
  var DONE = ['Geschafft. Probier frei weiter.', 'Done. Keep exploring freely.'];
  var AGAIN = ['Hinweise nochmal zeigen', 'Show hints again'];
  function tx(a) { return a[DE ? 0 : 1]; }

  function init(root, steps) {
    var i = 0, cur = null, fin = false, raf = 0, finTimer = 0;
    var layer = document.createElement('div'), badge = document.createElement('span'), sr = document.createElement('span');
    layer.className = 'cm-layer'; badge.className = 'cm-badge'; badge.setAttribute('aria-hidden', 'true');
    sr.className = 'cm-sr'; sr.setAttribute('role', 'status'); sr.setAttribute('aria-live', 'polite');
    layer.appendChild(badge); layer.appendChild(sr); root.appendChild(layer);
    var again = document.createElement('button');
    again.type = 'button'; again.className = 'cm-again'; again.textContent = tx(AGAIN);
    root.parentNode.insertBefore(again, root.nextSibling);

    function target() {
      var s = steps[i]; if (!s) return null;
      var el = root.querySelector(s.sel);
      return el && !el.disabled && !el.hidden ? el : null;
    }
    function say(txt) { if (sr.textContent !== txt) sr.textContent = txt; }
    function place(el) {
      var rr = root.getBoundingClientRect(), tr = el.getBoundingClientRect(), bw = badge.offsetWidth, bh = badge.offsetHeight;
      var x = tr.left - rr.left, left = tr.width > 240 ? x + 14 : x + tr.width / 2 - bw / 2;
      left = Math.max(6, Math.min(rr.width - bw - 6, left));
      var top = Math.max(4, tr.top - rr.top - bh + 9);  // sitzt wie ein Etikett auf der oberen Kante
      badge.style.left = left + 'px'; badge.style.top = top + 'px';
    }
    function setCur(el) {
      if (cur === el) return;
      if (cur) cur.classList.remove('cm-target');
      cur = el; if (el) el.classList.add('cm-target');
    }
    function refresh() {
      raf = 0;
      if (fin) return;
      var s = steps[i];
      while (s && s.until && root.querySelector(s.until)) s = steps[++i];
      if (!s) return finish();
      var el = target();
      setCur(el);
      if (!el) { badge.classList.remove('on'); return; }
      var txt = tx(s.t);
      if (badge.textContent !== txt) badge.textContent = txt;
      say(txt); place(el); badge.classList.add('on');
    }
    function queue() { if (!raf) raf = requestAnimationFrame(refresh); }
    function finish() {
      fin = true; setCur(null);
      badge.textContent = tx(DONE); say(tx(DONE));
      badge.classList.add('on', 'fin');
      var rr = root.getBoundingClientRect();
      badge.style.left = '16px'; badge.style.top = (rr.height - badge.offsetHeight - 14) + 'px';
      clearTimeout(finTimer);
      finTimer = setTimeout(function () { badge.classList.remove('on'); }, 4500);
    }
    function restart() {
      clearTimeout(finTimer); root.dispatchEvent(new CustomEvent('demo:reset')); fin = false; i = 0; badge.classList.remove('fin', 'on'); queue();
    }
    root.addEventListener('click', function (e) {
      if (fin) return;
      var s = steps[i]; if (!s || (s.until && !s.hit)) return;
      var h = e.target.closest(s.hit || s.sel);
      if (h && root.contains(h)) { i++; queue(); }
    }, true);
    again.addEventListener('click', restart);
    new MutationObserver(function (ms) {
      for (var k = 0; k < ms.length; k++) if (!layer.contains(ms[k].target)) return queue();
    }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'hidden', 'class', 'aria-pressed'] });
    if ('ResizeObserver' in window) new ResizeObserver(queue).observe(root);
    addEventListener('resize', queue); addEventListener('load', queue);
    queue();
  }
  Object.keys(CFG).forEach(function (id) {
    var root = document.getElementById(id);
    if (root) init(root, CFG[id]);
  });
})();
