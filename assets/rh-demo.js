// Rush Hour im Browser nachgebaut: Verkaufsnacht im Zeitraffer, 1 Sekunde Simulation alle 100 ms.
(function () {
  var root = document.getElementById('rhd');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var N = 120, BASE = 120, PEAK = 696, ROLLBACK_AFTER = 45, BREAKER_OPEN = 65;
  var s, timer, gen = 0;

  function init() {
    gen++;
    s = {
      t: 0, target: BASE, rate: BASE, err: 0.1, hist: [], ok: 0, bad: 0,
      deploy: null, version: 'v1.4', breaker: 'zu', openUntil: 0, waiting: 0, paidLate: 0,
      pods: [1, 1, 1, 1, 1, 1], podBack: 0, stock: 10, sold: 0, rejected: 0, busy: false
    };
    for (var i = 0; i < N; i++) s.hist.push([BASE, 0.1]);
    $('rhd-log').innerHTML = '';
    log('info', 'Kurz vor Mitternacht. Normaler Betrieb, 120 Bestellungen pro Minute.');
    clearInterval(timer);
    timer = setInterval(tick, 100);
    render();
  }
  function log(kind, text) {
    var li = document.createElement('li'), ol = $('rhd-log');
    li.className = 'l-' + kind;
    li.textContent = clock() + '  ' + text;
    ol.insertBefore(li, ol.firstChild);
    while (ol.children.length > 7) ol.removeChild(ol.lastChild);
  }
  function clock() {
    var sec = (23 * 3600 + 58 * 60 + s.t) % 86400;
    var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, x = sec % 60;
    return [h, m, x].map(function (v) { return String(v).padStart(2, '0'); }).join(':');
  }
  function tick() {
    s.t++;
    s.rate += (s.target - s.rate) * 0.08 + (Math.random() - 0.5) * 12;
    s.rate = Math.min(PEAK, Math.max(40, s.rate));
    var err = 0.1 + Math.random() * 0.1;

    if (s.deploy) {
      var age = s.t - s.deploy;
      err += Math.min(7, age * 0.25);   // nur der Canary-Anteil bekommt v1.5
      if (age === ROLLBACK_AFTER) {
        s.deploy = null; s.version = 'v1.4';
        log('ok', 'Analyse sagt nein: Rollback auf v1.4, automatisch nach 45 s.');
      }
    }
    if (s.breaker === 'offen') {
      s.waiting += Math.round(s.rate / 60);
      if (s.t >= s.openUntil) {
        s.breaker = 'zu'; s.paidLate += s.waiting;
        log('ok', 'Zahlung wieder schnell, Breaker zu. ' + s.waiting.toLocaleString('de-DE') + ' wartende Bestellungen bezahlt.');
        s.waiting = 0;
      }
    }
    if (s.podBack && s.t >= s.podBack) {
      s.pods = s.pods.map(function () { return 1; }); s.podBack = 0;
      log('ok', 'Kubernetes hat den Pod ersetzt. Wieder 6 von 6 bereit.');
    }
    s.err = err;
    var perSec = s.rate / 60;
    s.bad += perSec * err / 100; s.ok += perSec * (1 - err / 100);
    s.hist.push([s.rate, err]); if (s.hist.length > N) s.hist.shift();
    render();
  }
  function path(i, max, h) {
    return s.hist.map(function (p, k) {
      return (k ? 'L' : 'M') + (k * 600 / (N - 1)).toFixed(1) + ' ' + (h - Math.min(1, p[i] / max) * (h - 10)).toFixed(1);
    }).join('');
  }
  function render() {
    $('rhd-clock').textContent = clock();
    $('rhd-rate').setAttribute('d', path(0, 800, 200));
    $('rhd-err').setAttribute('d', path(1, 10, 200));
    $('rhd-v1').textContent = Math.round(s.rate).toLocaleString('de-DE');
    $('rhd-v2').textContent = s.err.toFixed(1).replace('.', ',') + ' %';
    var avail = s.ok / Math.max(1, s.ok + s.bad) * 100;
    $('rhd-v3').textContent = avail.toFixed(2).replace('.', ',') + ' %';
    $('rhd-v3').className = avail >= 99.5 ? 'g' : 'r';
    $('rhd-ver').textContent = s.deploy ? 'v1.5 Canary · ' + Math.min(50, 10 + (s.t - s.deploy) * 2) + ' % Verkehr' : s.version + ' stabil';
    $('rhd-ver').className = s.deploy ? 'r' : 'g';
    $('rhd-br').textContent = s.breaker === 'offen' ? 'offen · ' + s.waiting.toLocaleString('de-DE') + ' warten' : 'zu';
    $('rhd-br').className = s.breaker === 'offen' ? 'y' : 'g';
    $('rhd-pods').innerHTML = s.pods.map(function (p) { return '<i class="' + (p ? 'up' : 'down') + '"></i>'; }).join('');
    $('rhd-stock').textContent = s.stock + ' von 10';
    $('rhd-sold').textContent = s.sold + ' Bestellungen · 0 überverkauft';
    $('rhd-c1').textContent = Math.round(s.ok + s.bad).toLocaleString('de-DE');
    $('rhd-c2').textContent = s.paidLate.toLocaleString('de-DE');
    root.querySelector('[data-act=rush]').disabled = s.target === PEAK;
    root.querySelector('[data-act=deploy]').disabled = !!s.deploy;
    root.querySelector('[data-act=slow]').disabled = s.breaker === 'offen';
    root.querySelector('[data-act=pod]').disabled = !!s.podBack;
    root.querySelector('[data-act=drop]').disabled = s.busy || s.stock === 0;
  }
  var acts = {
    rush: function () { s.target = PEAK; log('info', 'Mitternacht: Ansturm auf den Shop, bis zu 696 Bestellungen pro Minute.'); },
    deploy: function () { s.deploy = s.t; s.version = 'v1.5'; log('bad', 'Kaputtes Update v1.5 wird ausgerollt. Fehler steigen.'); },
    slow: function () {
      s.breaker = 'offen'; s.openUntil = s.t + BREAKER_OPEN;
      log('warn', 'Zahlungsdienst hängt. Circuit Breaker offen: Bestellungen warten statt zu scheitern.');
    },
    pod: function () {
      s.pods[2] = 0; s.podBack = s.t + 8;
      log('bad', 'Catalog Pod abgeschossen. Die anderen 5 übernehmen, 0 Fehler.');
    },
    drop: function () {
      var g = gen, buyers = 500, done = 0;
      s.busy = true;
      log('info', 'Limited Drop: 500 Käufer wollen gleichzeitig 10 Sneaker.');
      (function step() {
        if (g !== gen) return;
        for (var i = 0; i < 20 && done < buyers; i++, done++) {
          if (s.stock > 0) { s.stock--; s.sold++; } else s.rejected++;
        }
        render();
        if (done < buyers) return setTimeout(step, 40);
        s.busy = false;
        log('ok', 'Ausverkauft: ' + s.sold + ' Bestellungen, ' + s.rejected + ' Käufer bekamen „ausverkauft“. 0 überverkauft.');
        render();
      })();
    },
    reset: init
  };
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    acts[b.dataset.act]();
    render();
  });
  // Nur rechnen, solange die Demo zu sehen ist.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!timer) timer = setInterval(tick, 100); }
      else { clearInterval(timer); timer = null; }
    }).observe(root);
  }
  init();
})();
