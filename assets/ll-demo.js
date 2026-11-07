// Ledger Lane im Browser nachgebaut: doppelte Buchführung, Idempotenz-Schlüssel, Absturz mit Rollback.
(function () {
  var root = document.getElementById('lld');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var AMOUNTS = [5000, 2990, 8900, 12000, 4550, 1999, 6400];
  var FEE = 0.15;
  var s, gen = 0;

  function eur(c, sign) {
    var t = (Math.abs(c) / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
    if (!sign || c === 0) return t;
    return (c > 0 ? '+' : '−') + t;
  }
  function init() {
    gen++;
    s = { bank: 0, brand: 0, fee: 0, keys: {}, booked: 0, dup: 0, rolled: 0, armed: false, busy: false, n: 1001, amt: 5000 };
    $('lld-log').innerHTML = '';
    log('info', 'Bereit. Bestellung order-1001 über 50,00 € wartet auf Zahlung.');
    render();
  }
  function render() {
    $('lld-ord').textContent = 'order-' + s.n;
    $('lld-amt').textContent = eur(s.amt);
    $('lld-bank').textContent = eur(s.bank, true);
    $('lld-brand').textContent = eur(s.brand, true);
    $('lld-fee').textContent = eur(s.fee, true);
    $('lld-sum').textContent = eur(s.bank + s.brand + s.fee);
    $('lld-c1').textContent = s.booked.toLocaleString('de-DE');
    $('lld-c2').textContent = s.dup.toLocaleString('de-DE');
    $('lld-c3').textContent = s.rolled.toLocaleString('de-DE');
    var k = root.querySelector('[data-act=kill]');
    k.setAttribute('aria-pressed', s.armed ? 'true' : 'false');
    k.textContent = s.armed ? 'Absturz scharf ✕' : 'Server abschießen';
    root.querySelectorAll('button').forEach(function (b) { b.disabled = s.busy && b.dataset.act !== 'reset'; });
  }
  function log(kind, text) {
    var li = document.createElement('li');
    li.className = 'l-' + kind;
    li.textContent = text;
    var ol = $('lld-log');
    ol.insertBefore(li, ol.firstChild);
    while (ol.children.length > 7) ol.removeChild(ol.lastChild);
  }
  function flash(ids) {
    ids.forEach(function (id) {
      var el = $(id).parentNode;
      el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
    });
  }
  function book(key, amt, quiet) {
    var fee = Math.round(amt * FEE), brand = amt - fee;
    s.bank += amt; s.brand -= brand; s.fee -= fee;
    s.keys[key] = true; s.booked++;
    if (!quiet) {
      log('ok', 'Gebucht ' + key + ': Bank ' + eur(amt, true) + ', Marke ' + eur(-brand, true) + ', Provision ' + eur(-fee, true) + '. Summe 0.');
      flash(['lld-bank', 'lld-brand', 'lld-fee']);
    }
  }
  function pay() {
    var key = 'order-' + s.n;
    if (s.keys[key]) {
      s.dup++;
      log('warn', 'Gleicher Schlüssel ' + key + ' erkannt. Alte Antwort zurück, nichts neu gebucht.');
      return render();
    }
    if (!s.armed) { book(key, s.amt); return render(); }
    s.armed = false; s.busy = true; render();
    var g = gen, later = function (ms, fn) { setTimeout(function () { if (g === gen) fn(); }, ms); };
    log('info', 'Buchung ' + key + ' läuft: Konten gesperrt, Zeilen geschrieben …');
    later(700, function () {
      root.classList.add('crashed');
      log('bad', 'kill -9. Server weg, mitten in der Transaktion.');
    });
    later(1900, function () {
      root.classList.remove('crashed');
      s.rolled++;
      log('info', 'Neustart. PostgreSQL rollt die halbe Transaktion zurück: nichts halb gebucht.');
      render();
    });
    later(3100, function () {
      log('info', 'Shop wiederholt die Zahlung mit demselben Schlüssel ' + key + '.');
      book(key, s.amt);
      s.busy = false; render();
    });
  }
  function next() {
    s.n++;
    s.amt = AMOUNTS[s.n % AMOUNTS.length];
    log('info', 'Neue Bestellung order-' + s.n + ' über ' + eur(s.amt) + '.');
    render();
  }
  function rush() {
    s.busy = true; render();
    var g = gen, total = 1000, done = 0, b0 = s.booked, d0 = s.dup, last = null;
    log('info', 'Ansturm: 1.000 Zahlungen gleichzeitig, viele davon doppelt geklickt …');
    (function step() {
      if (g !== gen) return;
      for (var i = 0; i < 25 && done < total; i++, done++) {
        var key;
        if (last && Math.random() < 0.1) key = last;
        else { s.n++; key = 'order-' + s.n; last = key; }
        if (s.keys[key]) s.dup++;
        else book(key, AMOUNTS[s.n % AMOUNTS.length], true);
      }
      render();
      if (done < total) return requestAnimationFrame(step);
      s.amt = AMOUNTS[s.n % AMOUNTS.length];
      s.busy = false;
      log('ok', '1.000 Anfragen: ' + (s.booked - b0) + ' gebucht, ' + (s.dup - d0) + ' Doppelte abgefangen. Summe weiter 0,00 €.');
      flash(['lld-bank', 'lld-brand', 'lld-fee']);
      render();
    })();
  }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    var a = b.dataset.act;
    if (a === 'pay') pay();
    else if (a === 'new') next();
    else if (a === 'kill') {
      s.armed = !s.armed;
      log(s.armed ? 'bad' : 'info', s.armed ? 'Absturz scharf: Der Server stirbt bei der nächsten Zahlung.' : 'Absturz abgebrochen.');
      render();
    }
    else if (a === 'rush') rush();
    else if (a === 'reset') { root.classList.remove('crashed'); init(); }
  });
  init();
})();
