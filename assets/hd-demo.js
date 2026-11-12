// Harbor Desk im Browser nachgebaut: Kunden mit Tarifen, ein Ansturm wird auf das Tarif-Tempo gebremst, die anderen bleiben schnell.
// Werte aus dem echten Beweislauf: Flut mit 500 Anfragen pro Sekunde, ruhiger Pro Kunde p95 6,3 ms, 100 % bedient.
(function () {
  var EN = document.documentElement.lang === 'en', DEC = EN ? '.' : ',';
  function T(de, en) { return EN ? en : de; }
  var root = document.getElementById('hdd');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var PLAN = { Free: 20, Pro: 100, Enterprise: 500 };
  var BASE = [
    { k: 'nd', name: 'Norddock Freight', color: '#7AA2FF', plan: 'Pro' },
    { k: 'km', name: 'Kestrel Mutual', color: '#5FD3A0', plan: 'Enterprise' },
    { k: 'bg', name: 'Bramble Goods', color: '#FF9E7A', plan: 'Free' }];
  var NEW = { k: 'fj', name: 'Fjordlicht Reisen', color: '#C79BFF', plan: 'Enterprise' };
  var list, cur, sent, timer = 0;

  function db(c) { return c.plan === 'Enterprise' ? T('eigene Datenbank', 'own database') : T('geteilte Datenbank', 'shared database'); }
  function ms(v) { return v.toFixed(1).replace('.', DEC) + ' ms'; }
  function tabs() {
    root.querySelector('.hdd-tabs').innerHTML = list.map(function (c) {
      return '<button type="button" role="tab" class="hdd-tab" data-co="' + c.k + '" aria-selected="' + (c.k === cur) + '" tabindex="' + (c.k === cur ? 0 : -1) + '" style="--c:' + c.color + '"><i></i>' + c.name + '</button>';
    }).join('');
  }
  function rows(flood) {
    var me = find(cur);
    root.style.setProperty('--c', me.color);
    $('hdd-meta').innerHTML = T('Ansturm kommt von <b>' + me.name + '</b>. Tarif ' + me.plan + ', ' + PLAN[me.plan] + ' Anfragen pro Sekunde.',
      'The rush comes from <b>' + me.name + '</b>. Plan ' + me.plan + ', ' + PLAN[me.plan] + ' requests per second.');
    $('hdd-list').innerHTML = list.map(function (c) {
      var st = c.k === cur && flood ? T(PLAN[c.plan] + '/s nach Tarif', PLAN[c.plan] + '/s by plan') : (flood ? (c.k === 'nd' && cur === 'bg' ? ms(6.3) : T('schnell', 'fast')) : T('bereit', 'ready'));
      return '<li' + (c.k === cur && flood ? ' class="hit"' : '') + ' style="--c:' + c.color + '"><b>' + c.name + '</b><span>' + c.plan + ' · ' + db(c) + '</span><em>' + st + '</em></li>';
    }).join('');
  }
  function find(k) { for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i]; }
  function out(html) { $('hdd-out').innerHTML = html; }
  function stop() { clearInterval(timer); timer = 0; }

  function flood() {
    stop();
    var me = find(cur), t0 = Date.now();
    rows(true);
    timer = setInterval(function () {
      var s = Math.min(3, (Date.now() - t0) / 1000);
      $('hdd-n').textContent = Math.round(sent + s * 500).toLocaleString(EN ? 'en-GB' : 'de-DE');
      if (s >= 3) { sent += 1500; stop(); }
    }, 60);
    var others = list.filter(function (c) { return c.k !== cur; }).map(function (c) { return c.name; }).join(T(' und ', ' and '));
    out('<small>' + T(me.name + ' schickt 500 Anfragen pro Sekunde', me.name + ' sends 500 requests per second') + '</small>' +
      '<b class="ok">' + (me.plan === 'Enterprise'
        ? T('Enterprise schafft 500 pro Sekunde, dafür zahlt ' + me.name + '. ' + others + ' bleiben schnell.', 'Enterprise handles 500 per second, that is what ' + me.name + ' pays for. ' + others + ' stay fast.')
        : T(me.name + ' bekommt das Tempo seines Tarifs: ' + PLAN[me.plan] + ' pro Sekunde. ' + others + ' bleiben schnell.', me.name + ' gets its plan speed of ' + PLAN[me.plan] + ' per second. ' + others + ' stay fast.')) + '</b>');
  }
  function add() {
    if (find(NEW.k)) { out('<b class="ok">' + T(NEW.name + ' ist schon startklar.', NEW.name + ' is already ready.') + '</b>'); return; }
    stop();
    list.push(NEW); cur = NEW.k; tabs(); rows(false);
    out('<small>' + T('Ein Aufruf: neuer Kunde ' + NEW.name + ', Tarif Enterprise', 'One call: new customer ' + NEW.name + ', plan Enterprise') + '</small>' +
      '<b class="ok">' + T('Startklar, mit eigener Datenbank. Ohne Umbau am Code.', 'Ready, with its own database. No change to the code.') + '</b>');
  }
  function reset() {
    stop(); list = BASE.slice(); cur = 'bg'; sent = 0;
    tabs(); rows(false); $('hdd-n').textContent = '0';
    out('<b>' + T('Wähle einen Kunden und starte einen Ansturm.', 'Pick a customer and start a rush.') + '</b>');
  }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-co]');
    if (t) { stop(); cur = t.dataset.co; tabs(); rows(false); out('<b>' + T('Jetzt kommt der Ansturm von ' + find(cur).name + '.', 'Now the rush comes from ' + find(cur).name + '.') + '</b>'); return; }
    var b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'flood') flood(); else add();
  });
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var t = e.target.closest('[data-co]'); if (!t) return;
    var ks = list.map(function (c) { return c.k; }), i = ks.indexOf(t.dataset.co) + (e.key === 'ArrowRight' ? 1 : ks.length - 1);
    cur = ks[i % ks.length]; tabs(); rows(false); root.querySelector('[data-co=' + cur + ']').focus();
  });
  root.addEventListener('demo:reset', reset);
  reset();
})();
