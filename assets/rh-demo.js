// Rush Hour im Browser nachgebaut: Verkaufsnacht im Zeitraffer, 1 Sekunde Simulation alle 100 ms.
(function () {
  var EN = document.documentElement.lang === 'en', LOC = EN ? 'en-GB' : 'de-DE', DEC = EN ? '.' : ',';
  function T(de, en) { return EN ? en : de; }
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
    say('', T('Kurz vor Mitternacht. Alles ruhig. Starte den Ansturm.', 'Just before midnight. All calm. Start the rush.'));
    clearInterval(timer);
    timer = setInterval(tick, 100);
    render();
  }
  // Ein großer Ergebnissatz pro Aktion.
  function say(kind, text) {
    var r = $('rhd-res'), x = $('rhd-res-t');
    r.className = 'lld-res' + (kind ? ' k-' + kind : '');
    x.textContent = text;
    x.style.animation = 'none'; void x.offsetWidth; x.style.animation = '';
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
        say('ok', T('Update zurückgenommen. Die Fehler sinken wieder.', 'Update taken back. Errors are falling again.'));
      }
    }
    if (s.breaker === 'offen') {
      s.waiting += Math.round(s.rate / 60);
      if (s.t >= s.openUntil) {
        s.breaker = 'zu'; s.paidLate += s.waiting;
        say('ok', T('Zahlung wieder schnell. ', 'Payments fast again. ') + s.waiting.toLocaleString(LOC) + T(' wartende Bestellungen wurden bezahlt.', ' waiting orders were paid.'));
        s.waiting = 0;
      }
    }
    if (s.podBack && s.t >= s.podBack) {
      s.pods = s.pods.map(function () { return 1; }); s.podBack = 0;
      say('ok', T('Ersatzserver gestartet. Wieder 6 von 6 Servern bereit.', 'Replacement server started. 6 of 6 servers ready again.'));
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
    $('rhd-v1').textContent = Math.round(s.rate).toLocaleString(LOC);
    $('rhd-v2').textContent = s.err.toFixed(1).replace('.', DEC) + ' %';
    var avail = s.ok / Math.max(1, s.ok + s.bad) * 100;
    $('rhd-v3').textContent = avail.toFixed(2).replace('.', DEC) + ' %';
    $('rhd-v3').className = avail >= 99.5 ? 'g' : 'r';
    $('rhd-v3l').textContent = avail >= 99.5 ? T('Erfolgreiche Bestellungen seit Start, Ziel 99,5 %', 'Successful orders since start, target 99.5 %')
      : s.deploy ? T('Erfolgreiche Bestellungen: unter Ziel, Update wird zurückgenommen', 'Successful orders: below target, update is taken back')
                 : T('Erfolgreiche Bestellungen: unter Ziel, erholt sich langsam', 'Successful orders: below target, slowly recovering');
    $('rhd-ver').textContent = s.deploy ? T('Update v1.5 bei ', 'Update v1.5 with ') + Math.min(50, 10 + (s.t - s.deploy) * 2) + T(' % der Kunden', ' % of customers') : s.version + T(' läuft stabil', ' running stable');
    $('rhd-ver').className = s.deploy ? 'r' : 'g';
    $('rhd-br').textContent = s.breaker === 'offen' ? T('hängt · ', 'stuck · ') + s.waiting.toLocaleString(LOC) + T(' warten', ' waiting') : T('läuft', 'working');
    $('rhd-br').className = s.breaker === 'offen' ? 'y' : 'g';
    $('rhd-pods').innerHTML = s.pods.map(function (p) { return '<i class="' + (p ? 'up' : 'down') + '"></i>'; }).join('');
    $('rhd-stock').textContent = s.stock + T(' von 10 Paar', ' of 10 pairs');
    $('rhd-sold').textContent = s.sold + T(' verkauft · 0 zu viel verkauft', ' sold · 0 oversold');
    $('rhd-c1').textContent = Math.round(s.ok + s.bad).toLocaleString(LOC);
    $('rhd-c2').textContent = s.paidLate.toLocaleString(LOC);
    root.querySelector('[data-act=rush]').disabled = s.target === PEAK;
    root.querySelector('[data-act=deploy]').disabled = !!s.deploy;
    root.querySelector('[data-act=slow]').disabled = s.breaker === 'offen';
    root.querySelector('[data-act=pod]').disabled = !!s.podBack;
    root.querySelector('[data-act=drop]').disabled = s.busy || s.stock === 0;
  }
  var acts = {
    rush: function () { s.target = PEAK; say('info', T('Ansturm läuft. Fast 6 mal so viele Bestellungen, der Shop bleibt schnell.', 'The rush is on. Almost 6 times the orders, the shop stays fast.')); },
    deploy: function () { s.deploy = s.t; s.version = 'v1.5'; say('bad', T('Fehler steigen. Das System nimmt das Update nach 45 s automatisch zurück.', 'Errors rise. The system takes the update back automatically after 45 s.')); },
    slow: function () {
      s.breaker = 'offen'; s.openUntil = s.t + BREAKER_OPEN;
      say('warn', T('Zahlung hängt. Bestellungen warten, statt abzubrechen.', 'Payment is stuck. Orders wait instead of failing.'));
    },
    pod: function () {
      s.pods[2] = 0; s.podBack = s.t + 30;
      say('bad', T('Ein Server ist ausgefallen. Andere Server übernehmen, der Shop läuft weiter.', 'One server is down. Other servers take over, the shop keeps running.'));
    },
    drop: function () {
      var g = gen, buyers = 500, done = 0;
      s.busy = true;
      say('info', T('500 Käufer wollen gleichzeitig 10 Paar Sneaker …', '500 buyers want 10 pairs of sneakers at the same time …'));
      (function step() {
        if (g !== gen) return;
        for (var i = 0; i < 20 && done < buyers; i++, done++) {
          if (s.stock > 0) { s.stock--; s.sold++; } else s.rejected++;
        }
        render();
        if (done < buyers) return setTimeout(step, 40);
        s.busy = false;
        say('ok', T('Ausverkauft. ' + s.sold + ' Paar verkauft, ' + s.rejected + ' Käufer gehen leer aus. Nichts doppelt verkauft.', 'Sold out. ' + s.sold + ' pairs sold, ' + s.rejected + ' buyers miss out. Nothing sold twice.'));
        render();
      })();
    }
  };
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    acts[b.dataset.act]();
    render();
  });
  root.addEventListener('demo:reset', init);
  // Nur rechnen, solange die Demo zu sehen ist.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!timer) timer = setInterval(tick, 100); }
      else { clearInterval(timer); timer = null; }
    }).observe(root);
  }
  init();
})();
