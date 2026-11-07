// Retail Data Pipeline: den Lauf um 06:00 abspielen, mit den echten Zahlen aus dem Warehouse.
(function () {
  var root = document.getElementById('pld');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var SOURCES = [['Shop API', 'Bestellungen', 25995], ['Lager API', 'Bestandsmeldungen', 12775], ['Logistik CSV', 'Versandereignisse', 53193]];
  var RULES = [['Doppelte Zeile', 'Logistik', 379], ['Menge kleiner oder gleich 0', 'Shop', 64], ['Unbekannte Bestellung', 'Logistik', 60],
               ['Unbekannter Artikel', 'Shop', 43], ['Negativer Preis', 'Shop', 28], ['Negativer Bestand', 'Lager', 4]];
  var MODELS = ['stg_orders', 'stg_order_lines', 'fct_orders', 'agg_daily_sales', 'rec_reorder', 'alert_sales_anomalies'];
  var gen = 0, flaky = false;
  var fmt = function (n) { return Math.round(n).toLocaleString('de-DE'); };

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
    root.querySelector('[data-act=run]').disabled = false;
  }
  async function run() {
    reset();
    var g = gen;
    root.querySelector('[data-act=run]').disabled = true;
    $('pld-clock').textContent = '06:00';
    stage(0, 'run');
    await Promise.all(SOURCES.map(function (s, i) { return count($('pld-s' + i), s[2], 1600 + i * 300, g); }));
    if (g !== gen) return;
    $('pld-retry').textContent = flaky
      ? 'API wackelte: 20 % der Anfragen scheiterten und wurden mit Backoff wiederholt. Trotzdem alles angekommen.'
      : 'Alles inkrementell geladen, sicher wiederholbar.';
    stage(0, 'done'); stage(1, 'run');
    await wait(300, g);
    for (var i = 0; i < RULES.length; i++) {
      $('pld-r' + i).classList.add('grow');
      count($('pld-rn' + i), RULES[i][2], 700, g);
      await wait(220, g);
    }
    await count($('pld-qt'), 578, 600, g);
    stage(1, 'done'); stage(2, 'run');
    var lis = $('pld-m').children;
    for (var k = 0; k < lis.length; k++) { await wait(260, g); lis[k].classList.add('ok'); }
    stage(2, 'done'); stage(3, 'run');
    await wait(300, g);
    $('pld-clock').textContent = '06:01';
    $('pld-out').classList.add('show');
    stage(3, 'done');
    root.querySelector('[data-act=run]').disabled = false;
    root.querySelector('[data-act=run]').textContent = 'Nochmal laufen lassen';
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    if (b.dataset.act === 'run') run();
    if (b.dataset.act === 'flaky') {
      flaky = !flaky;
      b.setAttribute('aria-pressed', flaky ? 'true' : 'false');
      b.textContent = flaky ? 'API wackelt: 20 % Fehler ✕' : 'API wackeln lassen';
    }
  });
  reset();
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(root);
  }
})();
