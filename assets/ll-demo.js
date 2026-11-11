// Ledger Lane im Browser nachgebaut: jede Zahlung hat eine Nummer und wird nur einmal gebucht, Abstürze buchen nichts halb.
(function () {
  var EN = document.documentElement.lang === 'en', LOC = EN ? 'en-GB' : 'de-DE';
  function T(de, en) { return EN ? en : de; }
  var root = document.getElementById('lld');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var AMOUNTS = [5000, 2990, 8900, 12000, 4550, 1999, 6400];
  var FEE = 0.15;
  var s, gen = 0, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function eur(c, sign) {
    var t = (Math.abs(c) / 100).toLocaleString(LOC, { style: 'currency', currency: 'EUR' });
    if (!sign || c === 0) return t;
    return (c > 0 ? '+' : '−') + t;
  }
  function init() {
    gen++;
    s = { bank: 0, brand: 0, fee: 0, keys: {}, booked: 0, dup: 0, rolled: 0, crashed: false, busy: false, n: 1001, amt: 5000 };
    root.classList.remove('crashed');
    $('lld-log').innerHTML = '';
    ['lld-bank', 'lld-brand', 'lld-fee'].forEach(function (id) { var e = $(id); e._v = 0; e._raf && cancelAnimationFrame(e._raf); e.parentNode.classList.remove('gld'); });
    $('lld-nope').classList.remove('on');
    say('', T('Klick auf Bezahlen.', 'Click Pay.'));
    render();
  }
  // Ein großer Ergebnissatz pro Schritt.
  function say(kind, text) {
    var r = $('lld-res'), t = $('lld-res-t');
    r.className = 'lld-res' + (kind ? ' k-' + kind : '');
    t.textContent = text;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  }
  // Kurze Notizen, höchstens drei, bei jedem Schritt neu.
  function notes(list) {
    var ol = $('lld-log'); ol.innerHTML = '';
    list.slice(0, 3).forEach(function (x) {
      var li = document.createElement('li'); li.className = 'l-' + x[0]; li.textContent = x[1]; ol.appendChild(li);
    });
  }
  // Betrag zählt animiert zum neuen Wert.
  function setAmt(id, v, quick) {
    var e = $(id), from = e._v || 0;
    e._v = v;
    if (e._raf) cancelAnimationFrame(e._raf);
    if (calm || quick || from === v) { e.textContent = eur(v, true); return; }
    var t0 = performance.now(), D = 700;
    (function f(t) {
      var k = Math.min(1, (t - t0) / D), q = 1 - Math.pow(1 - k, 3);
      e.textContent = eur(Math.round(from + (v - from) * q), true);
      e._raf = k < 1 ? requestAnimationFrame(f) : 0;
    })(t0);
  }
  function render(quick) {
    $('lld-ord').textContent = '#' + s.n;
    $('lld-amt').textContent = eur(s.amt);
    setAmt('lld-bank', s.bank, quick); setAmt('lld-brand', s.brand, quick); setAmt('lld-fee', s.fee, quick);
    $('lld-sum').textContent = eur(s.bank + s.brand + s.fee);
    $('lld-c1').textContent = s.booked.toLocaleString(LOC);
    $('lld-c2').textContent = s.dup.toLocaleString(LOC);
    $('lld-c3').textContent = s.rolled.toLocaleString(LOC);
    var p = root.querySelector('[data-act=pay]');
    p.textContent = s.crashed ? T('Trotzdem bezahlen', 'Pay anyway') : T('Bezahlen', 'Pay');
    root.querySelectorAll('button').forEach(function (b) {
      b.disabled = s.busy || (s.crashed && b.dataset.act === 'kill');
    });
  }
  function flash(ids) {
    ids.forEach(function (id) {
      var el = $(id).parentNode;
      el.classList.remove('gld'); void el.offsetWidth; el.classList.add('gld');
    });
  }
  function book(key, amt) {
    var fee = Math.round(amt * FEE), brand = amt - fee;
    s.bank += amt; s.brand -= brand; s.fee -= fee;
    s.keys[key] = true; s.booked++;
    return { fee: fee, brand: brand };
  }
  function pay() {
    var key = '#' + s.n;
    if (s.keys[key]) {
      s.dup++;
      var n = $('lld-nope'); n.classList.remove('on'); void n.offsetWidth; n.classList.add('on');
      say('warn', T('Doppelklick erkannt. Nicht doppelt abgebucht.', 'Double click spotted. Not charged twice.'));
      notes([['warn', T('Bestellung ' + key + ' war schon bezahlt', 'Order ' + key + ' was already paid')], ['info', T('Die Konten bleiben unverändert', 'The accounts stay as they are')]]);
      return render();
    }
    var wasCrashed = s.crashed, r = book(key, s.amt);
    s.crashed = false;
    say('ok', wasCrashed ? T('Wieder da. Alles genau einmal gebucht.', 'Back again. Everything booked exactly once.') : T('Bezahlt. ' + eur(s.amt).replace(',00', '') + ' korrekt verteilt.', 'Paid. ' + eur(s.amt).replace('.00', '') + ' split correctly.'));
    notes([['ok', T('Bankkonto ', 'Bank account ') + eur(s.amt, true)], ['ok', T('Marke bekommt ', 'Brand receives ') + eur(r.brand)], ['ok', T('Plattform behält ', 'Platform keeps ') + eur(r.fee)]]);
    flash(['lld-bank', 'lld-brand', 'lld-fee']);
    render();
  }
  function crash() {
    if (s.keys['#' + s.n]) next(true);
    var key = '#' + s.n, g = gen, later = function (ms, fn) { setTimeout(function () { if (g === gen) fn(); }, ms); };
    s.busy = true; render();
    say('info', T('Zahlung ' + key + ' läuft …', 'Payment ' + key + ' is running …'));
    notes([['info', T('Bestellung ' + key + ' über ' + eur(s.amt), 'Order ' + key + ' for ' + eur(s.amt))]]);
    later(900, function () {
      root.classList.add('crashed');
      say('bad', T('Server abgestürzt. Zahlung wird nicht halb gebucht.', 'Server crashed. A payment is never booked halfway.'));
      notes([['info', T('Bestellung ' + key + ' über ' + eur(s.amt), 'Order ' + key + ' for ' + eur(s.amt))], ['bad', T('Server fällt mitten in der Buchung aus', 'Server drops out in the middle of booking')]]);
    });
    later(2300, function () {
      root.classList.remove('crashed');
      s.rolled++; s.crashed = true; s.busy = false;
      notes([['info', T('Bestellung ' + key + ' über ' + eur(s.amt), 'Order ' + key + ' for ' + eur(s.amt))], ['bad', T('Server fällt mitten in der Buchung aus', 'Server drops out in the middle of booking')], ['ok', T('Neustart: nichts wurde halb gebucht', 'Restart: nothing was booked halfway')]]);
      render();
    });
  }
  function next(silent) {
    s.n++;
    s.amt = AMOUNTS[s.n % AMOUNTS.length];
    s.crashed = false;
    if (!silent) {
      say('info', T('Neue Bestellung #' + s.n + ' über ' + eur(s.amt) + '.', 'New order #' + s.n + ' for ' + eur(s.amt) + '.'));
      notes([]);
    }
    render();
  }
  function rush() {
    s.busy = true; render();
    var g = gen, total = 1000, done = 0, b0 = s.booked, d0 = s.dup, last = null;
    say('info', T('1.000 Zahlungen gleichzeitig, viele doppelt geklickt …', '1,000 payments at once, many double clicked …'));
    notes([]);
    (function step() {
      if (g !== gen) return;
      for (var i = 0; i < 25 && done < total; i++, done++) {
        var key;
        if (last && Math.random() < 0.1) key = last;
        else { s.n++; key = '#' + s.n; last = key; }
        if (s.keys[key]) s.dup++;
        else book(key, AMOUNTS[s.n % AMOUNTS.length]);
      }
      render(true);
      if (done < total) return requestAnimationFrame(step);
      s.amt = AMOUNTS[s.n % AMOUNTS.length];
      s.busy = false;
      var nb = s.booked - b0, nd = s.dup - d0, diff = eur(s.bank + s.brand + s.fee);
      say('ok', T(total.toLocaleString(LOC) + ' Klicks, davon ' + nd.toLocaleString(LOC) + ' doppelt. ' + nb.toLocaleString(LOC) + ' Zahlungen gebucht, keine doppelt, ' + diff + ' Differenz.',
                  total.toLocaleString(LOC) + ' clicks, ' + nd.toLocaleString(LOC) + ' of them doubles. ' + nb.toLocaleString(LOC) + ' payments booked, none twice, ' + diff + ' difference.'));
      notes([['info', T(total.toLocaleString(LOC) + ' Klicks insgesamt', total.toLocaleString(LOC) + ' clicks in total')], ['warn', T(nd + ' Doppelklicks abgefangen', nd + ' double clicks caught')], ['ok', T(nb + ' Zahlungen genau einmal gebucht', nb + ' payments booked exactly once')]]);
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
    else if (a === 'kill') crash();
    else if (a === 'rush') rush();
  });
  root.addEventListener('demo:reset', init);
  init();
})();
