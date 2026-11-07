// Inventory Sync im Browser nachgebaut: Zeitraffer 10 ×, 1 Sekunde Simulation alle 100 ms.
(function () {
  var root = document.getElementById('ivd');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var ITEMS = [['SNK-41', 'Sneaker Weiß 41', 12], ['SNK-42', 'Sneaker Weiß 42', 9], ['JKT-M', 'Wolljacke M', 6], ['JKT-L', 'Wolljacke L', 4],
               ['TEE-S', 'Shirt Sand S', 31], ['TEE-M', 'Shirt Sand M', 38], ['BAG-01', 'Ledertasche', 3], ['CAP-01', 'Cap Oliv', 17]];
  var INC = 5, FULL = 60, MAX_TRIES = 5;
  var s, timer, gen = 0;

  function init() {
    gen++;
    s = { t: 0, chaos: false, blocked: false, backup: null, runs: 0, writes: 0, retries: 0, changed: {},
          items: ITEMS.map(function (x) { return { sku: x[0], name: x[1], erp: x[2], shop: x[2], st: 'ok', tries: 0, next: 0 }; }) };
    $('ivd-log').innerHTML = '';
    log('info', 'ERP und Shop zeigen denselben Bestand. Abgleich alle 5 s, Vollabgleich alle 60 s.');
    clearInterval(timer); timer = setInterval(tick, 100);
    render();
  }
  function log(kind, text) {
    var li = document.createElement('li'), ol = $('ivd-log');
    li.className = 'l-' + kind; li.textContent = text;
    ol.insertBefore(li, ol.firstChild);
    while (ol.children.length > 7) ol.removeChild(ol.lastChild);
  }
  function write(it) {
    if (s.chaos && Math.random() < 0.65) {
      it.tries++; s.retries++;
      if (it.tries >= MAX_TRIES) {
        it.st = 'failed';
        log('bad', it.sku + ': 5 Versuche gescheitert. Markiert, der nächste Lauf versucht es wieder.');
      } else {
        var wait = Math.min(16, Math.pow(2, it.tries)) * (0.5 + Math.random() * 0.5);
        it.st = 'retry'; it.next = s.t + Math.ceil(wait);
        log('warn', it.sku + ': ' + (Math.random() < 0.5 ? '429 zu viele Anfragen' : '503 Shop nicht erreichbar') + '. Versuch ' + it.tries + ' von 5, warte ' + Math.ceil(wait) + ' s.');
      }
      return;
    }
    it.shop = it.erp; it.st = 'ok'; it.tries = 0; s.writes++;
    it.flash = true;
    log('ok', it.sku + ': setze Shopbestand auf ' + it.erp + '. Absoluter Wert, ein Retry kann nie doppelt zählen.');
  }
  function run(full) {
    var plan = s.items.filter(function (it) {
      return it.st !== 'retry' && it.st !== 'blocked' && (it.st === 'failed' || (full ? it.erp !== it.shop : s.changed[it.sku]));
    });
    s.changed = {};
    if (!plan.length) return;
    s.runs++;
    var zeros = plan.filter(function (it) { return it.erp === 0 && it.shop > 0; }).length;
    if (zeros > s.items.length / 2) {
      s.blocked = true;
      plan.forEach(function (it) { it.st = 'blocked'; });
      log('bad', 'Nullbestandschutz: Der Lauf würde ' + zeros + ' von ' + s.items.length + ' Artikeln auf 0 setzen. Blockiert, ein Mensch muss prüfen.');
      return;
    }
    log('info', (full ? 'Vollabgleich' : 'Abgleich') + ': ' + plan.length + (plan.length === 1 ? ' Abweichung' : ' Abweichungen') + ' gefunden.');
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
  }
  function render() {
    $('ivd-rows').innerHTML = s.items.map(function (it) {
      var label = { ok: 'synchron', retry: 'Retry ' + it.tries + '/5', failed: 'fehlgeschlagen', blocked: 'blockiert' }[it.st];
      if (it.st === 'ok' && it.erp !== it.shop) label = 'wartet';
      var cls = it.st === 'ok' ? (it.erp === it.shop ? 'ok' : 'wait') : it.st;
      var html = '<div class="iv-r' + (it.flash ? ' hit' : '') + '"><span><b>' + it.sku + '</b><small>' + it.name + '</small></span><span class="n">' + it.erp +
        '</span><span class="n' + (it.erp !== it.shop ? ' off' : '') + '">' + it.shop + '</span><span class="pill ' + cls + '">' + label + '</span></div>';
      it.flash = false;
      return html;
    }).join('');
    var nextFull = FULL - (s.t % FULL);
    $('ivd-next').textContent = s.blocked ? 'angehalten' : nextFull + ' s';
    $('ivd-c1').textContent = s.runs;
    $('ivd-c2').textContent = s.writes;
    $('ivd-c3').textContent = s.retries;
    var off = s.items.filter(function (it) { return it.erp !== it.shop; }).length;
    $('ivd-c4').textContent = off;
    var c = root.querySelector('[data-act=chaos]');
    c.setAttribute('aria-pressed', s.chaos ? 'true' : 'false');
    c.textContent = s.chaos ? 'Shop wieder gesund' : 'Shop fällt aus';
    root.querySelector('[data-act=zero]').hidden = s.blocked;
    root.querySelector('[data-act=fix]').hidden = !s.blocked;
    root.querySelector('[data-act=sell]').disabled = s.blocked;
    root.querySelector('[data-act=drift]').disabled = s.blocked;
  }
  function pick(f) { var l = s.items.filter(f); return l[Math.floor(Math.random() * l.length)]; }
  var acts = {
    sell: function () {
      var it = pick(function (x) { return x.erp > 0; }); if (!it) return;
      var n = Math.min(it.erp, 1 + Math.floor(Math.random() * 3));
      it.erp -= n; s.changed[it.sku] = true;
      log('info', 'Laden verkauft ' + n + ' × ' + it.name + '. ERP jetzt ' + it.erp + ', Shop zeigt noch ' + it.shop + '.');
    },
    chaos: function () {
      s.chaos = !s.chaos;
      log(s.chaos ? 'bad' : 'ok', s.chaos ? 'Shop API wackelt: Rate Limits und Ausfälle.' : 'Shop API wieder gesund.');
    },
    drift: function () {
      var it = pick(function (x) { return x.st === 'ok'; }); if (!it) return;
      it.shop += 5;
      log('warn', 'Jemand ändert ' + it.sku + ' direkt im Shop auf ' + it.shop + '. Das ERP weiß nichts davon, erst der Vollabgleich findet es.');
    },
    zero: function () {
      s.backup = s.items.map(function (it) { return it.erp; });
      s.items.forEach(function (it) { it.erp = 0; s.changed[it.sku] = true; });
      log('bad', 'Kaputter ERP Export: Alle Bestände plötzlich 0.');
    },
    fix: function () {
      s.items.forEach(function (it, i) { it.erp = s.backup[i]; it.st = 'ok'; });
      s.blocked = false; s.backup = null;
      log('ok', 'Export geprüft und korrigiert. Der Shop wurde nie geleert.');
    },
    reset: init
  };
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-act]');
    if (!b || b.disabled) return;
    acts[b.dataset.act](); render();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!timer) timer = setInterval(tick, 100); }
      else { clearInterval(timer); timer = null; }
    }).observe(root);
  }
  init();
})();
