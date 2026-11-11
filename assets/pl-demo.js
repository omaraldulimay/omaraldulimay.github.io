// Retail Data Pipeline: den Lauf um 06:00 abspielen, mit den echten Zahlen aus dem Warehouse.
(function () {
  var EN = document.documentElement.lang === 'en', LOC = EN ? 'en-GB' : 'de-DE';
  function T(de, en) { return EN ? en : de; }
  var root = document.getElementById('pld');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var SOURCES = [[T('Onlineshop', 'Online shop'), T('Bestellungen', 'orders'), 25995], [T('Lager', 'Warehouse'), T('Bestandsmeldungen', 'stock reports'), 12775], [T('Versanddienst', 'Shipping carrier'), T('Versandmeldungen', 'shipping updates'), 53193]];
  var RULES = [[T('Doppelte Zeile', 'Duplicate row'), T('Versand', 'Shipping'), 379], [T('Menge 0 oder weniger', 'Quantity 0 or less'), T('Onlineshop', 'Online shop'), 64], [T('Unbekannte Bestellung', 'Unknown order'), T('Versand', 'Shipping'), 60],
               [T('Unbekannter Artikel', 'Unknown product'), T('Onlineshop', 'Online shop'), 43], [T('Negativer Preis', 'Negative price'), T('Onlineshop', 'Online shop'), 28], [T('Negativer Bestand', 'Negative stock'), T('Lager', 'Warehouse'), 4]];
  var MODELS = [T('Bestellungen bereinigt', 'Orders cleaned'), T('Bestellpositionen', 'Order lines'), T('Bestellübersicht', 'Order overview'), T('Tagesumsatz', 'Daily revenue'), T('Nachbestell-Empfehlung', 'Reorder advice'), T('Umsatz-Warnungen', 'Revenue alerts')];
  var BTN = [T('Tagesauswertung starten', 'Start the daily run'), T('Nochmal starten', 'Run it again')];
  function say(kind, text) {
    var r = $('pld-res'), t = $('pld-res-t');
    r.className = 'lld-res' + (kind ? ' k-' + kind : '');
    t.textContent = text;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  }
  var gen = 0, flaky = false, ran = false;
  var fmt = function (n) { return Math.round(n).toLocaleString(LOC); };

  function wait(ms, g) { return new Promise(function (r) { setTimeout(function () { if (g === gen) r(); }, ms); }); }
  function count(el, to, ms, g) {
    var t0 = performance.now();
    return new Promise(function (r) {
      (function f(t) {
        if (g !== gen) return;
        var p = Math.min(1, (t - t0) / ms);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(f); else r();
      })(t0);
    });
  }
  function stage(i, st) {
    var li = root.querySelectorAll('.pl-stage')[i];
    li.classList.remove('run', 'done'); if (st) li.classList.add(st);
  }
  function reset() {
    gen++;
    root.querySelectorAll('.pl-stage').forEach(function (li) { li.classList.remove('run', 'done'); });
    $('pld-src').innerHTML = SOURCES.map(function (s, i) {
      return '<div class="pl-src"><span>' + s[0] + '<small>' + s[1] + '</small></span><b id="pld-s' + i + '">0</b></div>';
    }).join('') + '<p class="pl-retry" id="pld-retry"></p>';
    $('pld-q').innerHTML = RULES.map(function (r, i) {
      return '<div class="pl-rule"><span>' + r[0] + '<small>' + r[1] + '</small></span><i style="--w:' + (r[2] / 379 * 100) + '%" id="pld-r' + i + '"></i><b id="pld-rn' + i + '">0</b></div>';
    }).join('');
    $('pld-qt').textContent = '0';
    $('pld-m').innerHTML = MODELS.map(function (m) { return '<li>' + m + '</li>'; }).join('');
    $('pld-out').classList.remove('show');
    $('pld-clock').textContent = '05:59';
    var rb = root.querySelector('[data-act=run]');
    rb.disabled = false; rb.textContent = BTN[ran ? 1 : 0];
  }
  async function run() {
    ran = true; reset();
    var g = gen;
    say('info', T('Daten werden aus drei Systemen geholt …', 'Fetching data from three systems …'));
    root.querySelector('[data-act=run]').disabled = true;
    $('pld-clock').textContent = '06:00';
    stage(0, 'run');
    await Promise.all(SOURCES.map(function (s, i) { return count($('pld-s' + i), s[2], 1600 + i * 300, g); }));
    if (g !== gen) return;
    $('pld-retry').textContent = flaky
      ? T('Die Verbindung wackelte: jede 5. Anfrage scheiterte. Das System probierte es erneut, nichts ging verloren.', 'The connection was shaky: every 5th request failed. The system tried again, nothing was lost.')
      : T('Alles geladen. Ein zweiter Lauf würde nichts doppelt laden.', 'Everything loaded. A second run would not load anything twice.');
    if (flaky) say('warn', T('Verbindung wackelt. Das System probiert es wieder, bis alles da ist.', 'Connection is shaky. The system keeps trying until everything is there.'));
    stage(0, 'done'); stage(1, 'run');
    await wait(300, g);
    for (var i = 0; i < RULES.length; i++) {
      $('pld-r' + i).classList.add('grow');
      count($('pld-rn' + i), RULES[i][2], 700, g);
      await wait(220, g);
    }
    await count($('pld-qt'), 578, 600, g);
    say('info', T('578 fehlerhafte Zeilen aussortiert, nichts gelöscht. Jetzt wird gerechnet …', '578 faulty rows set aside, nothing deleted. Now calculating …'));
    stage(1, 'done'); stage(2, 'run');
    var lis = $('pld-m').children;
    for (var k = 0; k < lis.length; k++) { await wait(260, g); lis[k].classList.add('ok'); }
    stage(2, 'done'); stage(3, 'run');
    await wait(300, g);
    $('pld-clock').textContent = '06:01';
    $('pld-out').classList.add('show');
    stage(3, 'done');
    say('ok', (flaky ? T('Trotz wackliger Verbindung fertig. ', 'Done despite the shaky connection. ') : T('Fertig um 06:01. ', 'Done at 06:01. ')) + T('91.963 Zeilen geprüft, 578 fehlerhafte aussortiert, Übersicht steht.', '91,963 rows checked, 578 faulty ones set aside, overview is ready.'));
    root.querySelector('[data-act=run]').disabled = false;
    root.querySelector('[data-act=run]').textContent = BTN[1];
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    if (b.dataset.act === 'run') run();
    if (b.dataset.act === 'flaky') {
      flaky = !flaky;
      b.setAttribute('aria-pressed', flaky ? 'true' : 'false');
      b.textContent = flaky ? T('Verbindung stören: an', 'Disturb connection: on') : T('Verbindung stören', 'Disturb connection');
      if (!root.querySelector('[data-act=run]').disabled) say(flaky ? 'warn' : '', flaky ? T('Verbindung gestört. Beim nächsten Lauf scheitern einzelne Anfragen.', 'Connection disturbed. In the next run some requests will fail.') : T('Verbindung wieder normal.', 'Connection back to normal.'));
    }
  });
  root.addEventListener('demo:reset', function () {
    reset(); ran = false; flaky = false;
    var f = root.querySelector('[data-act=flaky]');
    f.setAttribute('aria-pressed', 'false'); f.textContent = T('Verbindung stören', 'Disturb connection');
    run();
  });
  say('', T('Starte die Tagesauswertung.', 'Start the daily run.'));
  reset();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(root);
  }
})();
