// Inventory Sync im Browser nachgebaut: Zeitraffer 2 ×, 1 Sekunde Simulation alle 500 ms.
// Laden = Warenwirtschaft (Quelle), Onlineshop = Ziel. Ein großer Ergebnissatz pro Aktion.
(function () {
  var EN = document.documentElement.lang === 'en';
  function T(de, en) { return EN ? en : de; }
  var root = document.getElementById('ivd');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var ITEMS = [[T('Sneaker Weiß 41', 'Sneaker white 41'), 12], [T('Sneaker Weiß 42', 'Sneaker white 42'), 9], [T('Wolljacke M', 'Wool jacket M'), 6], [T('Wolljacke L', 'Wool jacket L'), 4],
               [T('Shirt Sand S', 'Shirt sand S'), 31], [T('Shirt Sand M', 'Shirt sand M'), 38], [T('Ledertasche', 'Leather bag'), 3], [T('Cap Oliv', 'Cap olive'), 17]];
  var INC = 5, FULL = 60, MAX_TRIES = 5;
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var s, timer, gen = 0;

  function init() {
    gen++;
    s = { t: 0, chaos: false, blocked: false, backup: null, writes: 0, retries: 0, changed: {}, expect: false, hadFail: false,
          items: ITEMS.map(function (x) { return { name: x[0], erp: x[1], shop: x[1], st: 'ok', tries: 0, next: 0 }; }) };
    $('ivd-log').innerHTML = '';
    ['ivd-ts', 'ivd-to'].forEach(function (id) { var e = $(id); e._v = null; e._raf && cancelAnimationFrame(e._raf); });
    say('', T('Laden und Onlineshop zeigen denselben Bestand. Verkaufe etwas.', 'Store and online shop show the same stock. Sell something.'));
    log('info', T('Beide Bestände sind gleich', 'Both stock counts are equal'));
    clearInterval(timer); timer = setInterval(tick, 500);
    render();
  }
  function say(kind, text) {
    var r = $('ivd-res'), t = $('ivd-res-t');
    r.className = 'lld-res' + (kind ? ' k-' + kind : '');
    t.textContent = text;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  }
  function log(kind, text) {
    var li = document.createElement('li'), ol = $('ivd-log');
    li.className = 'l-' + kind; li.textContent = text;
    ol.insertBefore(li, ol.firstChild);
    while (ol.children.length > 5) ol.removeChild(ol.lastChild);
  }
  function write(it) {
    if (s.chaos && Math.random() < 0.65) {
      it.tries++; s.retries++; s.hadFail = true;
      if (it.tries >= MAX_TRIES) {
        it.st = 'failed';
        log('bad', it.name + T(': 5 Versuche gescheitert, die nächste Runde probiert es wieder', ': 5 tries failed, the next round tries again'));
      } else {
        var wait = Math.ceil(Math.min(8, Math.pow(2, it.tries)) * (0.5 + Math.random() * 0.5));
        it.st = 'retry'; it.next = s.t + wait;
        log('warn', it.name + T(': Shop antwortet nicht, neuer Versuch in ', ': shop does not answer, new try in ') + wait + ' s');
      }
      return;
    }
    it.shop = it.erp; it.st = 'ok'; it.tries = 0; s.writes++; it.flash = true;
    log('ok', it.name + T(': Onlineshop zeigt jetzt ', ': online shop now shows ') + it.erp);
  }
  function run(full) {
    var plan = s.items.filter(function (it) {
      return it.st !== 'retry' && it.st !== 'blocked' && (it.st === 'failed' || (full ? it.erp !== it.shop : s.changed[it.name]));
    });
    s.changed = {};
    if (!plan.length) return;
    var zeros = plan.filter(function (it) { return it.erp === 0 && it.shop > 0; }).length;
    if (zeros > s.items.length / 2) {
      s.blocked = true; s.expect = false;
      plan.forEach(function (it) { it.st = 'blocked'; });
      log('bad', T('Gestoppt: ' + zeros + ' von ' + s.items.length + ' Artikeln würden auf 0 gesetzt', 'Stopped: ' + zeros + ' of ' + s.items.length + ' items would be set to 0'));
      return;
    }
    plan.forEach(function (it) { it.tries = 0; write(it); });
  }
  function tick() {
    s.t++;
    s.items.forEach(function (it) { if (it.st === 'retry' && s.t >= it.next) write(it); });
    if (!s.blocked) {
      if (s.t % FULL === 0) run(true);
      else if (s.t % INC === 0) run(false);
    }
    render();
    if (s.expect && !s.blocked && !s.items.some(function (it) { return it.erp !== it.shop; })) {
      s.expect = false;
      say('ok', s.hadFail ? T('Alles nachgeholt. Laden und Onlineshop stimmen wieder überein.', 'All caught up. Store and online shop match again.')
                          : T('Onlineshop aktualisiert. Beide zeigen denselben Bestand.', 'Online shop updated. Both show the same stock.'));
      s.hadFail = false;
    }
  }
  // Summe zählt animiert zum neuen Wert.
  function count(id, v) {
    var e = $(id), from = e._v;
    e._v = v;
    if (e._raf) cancelAnimationFrame(e._raf);
    if (calm || from === null || from === undefined || from === v) { e.textContent = v; return; }
    var t0 = performance.now(), D = 600;
    (function f(t) {
      var k = Math.min(1, (t - t0) / D);
      e.textContent = Math.round(from + (v - from) * (1 - Math.pow(1 - k, 3)));
      e._raf = k < 1 ? requestAnimationFrame(f) : 0;
    })(t0);
  }
  function render() {
    var ts = 0, to = 0, off = 0;
    $('ivd-rows').innerHTML = s.items.map(function (it) {
      ts += it.erp; to += it.shop; if (it.erp !== it.shop) off++;
      var label = { ok: T('gleich', 'equal'), retry: T('Versuch ', 'Try ') + it.tries + '/5', failed: T('gescheitert', 'failed'), blocked: T('gestoppt', 'stopped') }[it.st];
      if (it.st === 'ok' && it.erp !== it.shop) label = T('wartet', 'waiting');
      var cls = it.st === 'ok' ? (it.erp === it.shop ? 'ok' : 'wait') : it.st;
      var html = '<div class="iv-r' + (it.flash || it.flashS ? ' hit' : '') + '"><span><b>' + it.name + '</b></span><span class="n' + (it.flashS ? ' bump' : '') + '">' + it.erp +
        '</span><span class="n' + (it.erp !== it.shop ? ' off' : '') + (it.flash ? ' bump' : '') + '">' + it.shop + '</span><span class="pill ' + cls + '">' + label + '</span></div>';
      it.flash = false; it.flashS = false;
      return html;
    }).join('');
    count('ivd-ts', ts); count('ivd-to', to);
    $('ivd-tbox').classList.toggle('off', ts !== to);
    $('ivd-next').textContent = s.blocked ? T('angehalten', 'paused') : (INC - (s.t % INC)) + ' s';
    $('ivd-c2').textContent = s.writes;
    $('ivd-c3').textContent = s.retries;
    $('ivd-c4').textContent = off;
    var c = root.querySelector('[data-act=chaos]');
    c.setAttribute('aria-pressed', s.chaos ? 'true' : 'false');
    c.textContent = s.chaos ? T('Onlineshop wieder da', 'Online shop is back') : T('Onlineshop fällt aus', 'Online shop goes down');
    root.querySelector('[data-act=zero]').hidden = s.blocked;
    root.querySelector('[data-act=fix]').hidden = !s.blocked;
    root.querySelector('[data-act=sell]').disabled = s.blocked;
  }
  function pick(f) { var l = s.items.filter(f); return l[Math.floor(Math.random() * l.length)]; }
  var acts = {
    sell: function () {
      var it = pick(function (x) { return x.erp > 0; }); if (!it) return;
      var n = Math.min(it.erp, 1 + Math.floor(Math.random() * 3));
      it.erp -= n; it.flashS = true; s.changed[it.name] = true; s.expect = true; s.hadFail = s.hadFail && s.chaos;
      log('info', it.name + ': ' + n + T(' verkauft, Laden zeigt ', ' sold, store shows ') + it.erp);
      say(s.chaos ? 'warn' : 'info', s.chaos ? T('Im Laden verkauft. Der Onlineshop ist offline, das System versucht es weiter.', 'Sold in store. The online shop is offline, the system keeps trying.')
                                              : T('Im Laden verkauft. Der Onlineshop zeigt in 5 s den neuen Bestand.', 'Sold in store. The online shop shows the new stock in 5 s.'));
    },
    chaos: function () {
      s.chaos = !s.chaos;
      if (s.chaos) { s.expect = false; say('bad', T('Shop offline. Das System versucht es weiter, bis es klappt.', 'Shop offline. The system keeps trying until it works.')); log('bad', T('Onlineshop antwortet nicht mehr', 'Online shop stops answering')); }
      else {
        s.expect = true; log('ok', T('Onlineshop ist wieder erreichbar', 'Online shop is reachable again'));
        say('ok', T('Shop wieder da. Verpasste Änderungen werden nachgeholt.', 'Shop is back. Missed changes are caught up.'));
      }
    },
    zero: function () {
      s.backup = s.items.map(function (it) { return it.erp; });
      s.items.forEach(function (it) { it.erp = 0; s.changed[it.name] = true; });
      say('bad', T('Lagerliste fehlerhaft: alles auf 0. Das System stoppt, statt den Shop leerzuräumen.', 'Faulty stock list: everything at 0. The system stops instead of emptying the shop.'));
      log('bad', T('Lagerliste meldet überall 0', 'Stock list reports 0 everywhere'));
    },
    fix: function () {
      s.items.forEach(function (it, i) { it.erp = s.backup[i]; it.st = 'ok'; });
      s.blocked = false; s.backup = null; s.expect = false;
      say('ok', T('Liste korrigiert. Der Onlineshop wurde nie leergeräumt.', 'List corrected. The online shop was never emptied.'));
      log('ok', T('Richtige Lagerliste eingespielt', 'Correct stock list loaded'));
    }
  };
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    acts[b.dataset.act](); render();
  });
  root.addEventListener('demo:reset', init);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!timer) timer = setInterval(tick, 500); }
      else { clearInterval(timer); timer = null; }
    }).observe(root);
  }
  init();
})();
