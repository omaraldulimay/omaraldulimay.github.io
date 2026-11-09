// Harbor Desk im Browser nachgebaut: jede Firma sieht nur ihre Tickets, fremde Zeilen liefert die Datenbank gar nicht erst aus.
(function () {
  var EN = document.documentElement.lang === 'en';
  function T(de, en) { return EN ? en : de; }
  var root = document.getElementById('hdd');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  var CO = {
    nd: { name: 'Norddock Freight', color: '#7AA2FF', plan: T('Pro, geteilte Datenbank', 'Pro, shared database'), tickets: [
      ['NF-1041', T('Container 4471 hängt im Zoll', 'Container 4471 stuck in customs'), T('offen', 'open')],
      ['NF-1042', T('Lieferfenster Hamburg verschieben', 'Move Hamburg delivery window'), T('in Arbeit', 'in progress')],
      ['NF-1043', T('Frachtbrief fehlt Stempel', 'Waybill missing a stamp'), T('offen', 'open')],
      ['NF-1044', T('Spedition meldet Schaden an Palette', 'Carrier reports damaged pallet'), T('gelöst', 'resolved')]] },
    km: { name: 'Kestrel Mutual', color: '#5FD3A0', plan: T('Enterprise, eigene Datenbank', 'Enterprise, own database'), tickets: [
      ['KM-2207', T('Schadenmeldung Wasserschaden', 'Water damage claim'), T('offen', 'open')],
      ['KM-2208', T('Police: Adresse ändern', 'Policy: change address'), T('in Arbeit', 'in progress')],
      ['KM-2209', T('Beitragsrechnung doppelt erhalten', 'Premium invoice received twice'), T('gelöst', 'resolved')],
      ['KM-2210', T('Kündigung zum Jahresende', 'Cancellation at year end'), T('offen', 'open')]] },
    bg: { name: 'Bramble Goods', color: '#FF9E7A', plan: T('Free, geteilte Datenbank', 'Free, shared database'), tickets: [
      ['BG-3310', T('Retoure ohne Etikett', 'Return without label'), T('offen', 'open')],
      ['BG-3311', T('Gutscheincode funktioniert nicht', 'Voucher code does not work'), T('in Arbeit', 'in progress')],
      ['BG-3312', T('Größe falsch geliefert', 'Wrong size delivered'), T('offen', 'open')],
      ['BG-3313', T('Wann kommt der Mantel wieder?', 'When is the coat back in stock?'), T('gelöst', 'resolved')]] }
  };
  var KEYS = ['nd', 'km', 'bg'], cur = 'nd', tries = 0, pick = 0, TOTAL = 12;

  function render() {
    var c = CO[cur];
    root.style.setProperty('--c', c.color);
    KEYS.forEach(function (k) {
      var b = root.querySelector('[data-co=' + k + ']');
      b.setAttribute('aria-selected', k === cur ? 'true' : 'false');
      b.tabIndex = k === cur ? 0 : -1;
    });
    $('hdd-meta').innerHTML = T('Angemeldet als <b>' + c.name + '</b> · ' + c.plan, 'Signed in as <b>' + c.name + '</b> · ' + c.plan);
    $('hdd-list').innerHTML = c.tickets.map(function (t) {
      return '<li><b>' + t[0] + '</b><span>' + t[1] + '</span><em>' + t[2] + '</em></li>';
    }).join('');
    $('hdd-n').textContent = tries;
  }
  function out(html) {
    var o = $('hdd-out');
    o.innerHTML = html;
    o.classList.remove('shake'); void o.offsetWidth;
    return o;
  }
  function foreign() {
    var others = KEYS.filter(function (k) { return k !== cur; });
    var o = CO[others[pick % others.length]], t = o.tickets[(pick >> 1) % o.tickets.length];
    pick++; tries++;
    out('<code>GET /api/tickets/' + t[0] + '</code> ' + T('als ', 'as ') + CO[cur].name +
      '<span class="no">' + T('404 · nicht gefunden. Postgres liefert fremde Zeilen gar nicht erst aus.', '404 · not found. Postgres never returns foreign rows in the first place.') + '</span>').classList.add('shake');
    $('hdd-n').textContent = tries;
  }
  function nofilter() {
    out('<code>select * from tickets</code> ' + T('(ohne WHERE)', '(no WHERE)') +
      '<span class="ok">' + T(CO[cur].tickets.length + ' Zeilen, alle von ' + CO[cur].name + '. In der Tabelle liegen ' + TOTAL + '.', CO[cur].tickets.length + ' rows, all from ' + CO[cur].name + '. The table holds ' + TOTAL + '.') + '</span>');
  }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-co]');
    if (t) { cur = t.dataset.co; render(); out(T('Wähle ein Ticket oder probiere einen Zugriff auf fremde Daten.', 'Pick a ticket or try to reach foreign data.')); return; }
    var b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'foreign') foreign(); else nofilter();
  });
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var t = e.target.closest('[data-co]'); if (!t) return;
    var i = KEYS.indexOf(t.dataset.co) + (e.key === 'ArrowRight' ? 1 : 2);
    cur = KEYS[i % 3]; render(); root.querySelector('[data-co=' + cur + ']').focus();
  });
  render();
  out(T('Wähle ein Ticket oder probiere einen Zugriff auf fremde Daten.', 'Pick a ticket or try to reach foreign data.'));
})();
