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
    $('hdd-meta').innerHTML = T('Angemeldet als <b>' + c.name + '</b>. Das sind die Tickets dieser Firma.', 'Signed in as <b>' + c.name + '</b>. These are this company\'s tickets.');
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
  var HINT = [T('Wähle eine Firma und versuche dann, fremde Tickets zu sehen.', 'Pick a company, then try to see foreign tickets.'), ''];
  function foreign() {
    var others = KEYS.filter(function (k) { return k !== cur; });
    var o = CO[others[pick % others.length]], t = o.tickets[(pick >> 1) % o.tickets.length];
    pick++; tries++;
    out('<small>' + T('Versuch: Ticket ' + t[0] + ' von ' + o.name + ' öffnen', 'Attempt: open ticket ' + t[0] + ' of ' + o.name) + '</small>' +
      '<b class="no">' + T('Nicht gefunden. Fremde Tickets bleiben unsichtbar.', 'Not found. Foreign tickets stay invisible.') + '</b>').classList.add('shake');
    $('hdd-n').textContent = tries;
  }
  function nofilter() {
    out('<small>' + T('Versuch: alle Tickets der Datenbank abfragen, ohne Filter', 'Attempt: ask for all tickets in the database, no filter') + '</small>' +
      '<b class="ok">' + T('Nur die ' + CO[cur].tickets.length + ' Tickets von ' + CO[cur].name + ' kommen zurück. ' + (TOTAL - CO[cur].tickets.length) + ' fremde bleiben unsichtbar.', 'Only the ' + CO[cur].tickets.length + ' tickets of ' + CO[cur].name + ' come back. ' + (TOTAL - CO[cur].tickets.length) + ' foreign ones stay invisible.') + '</b>');
  }
  function reset() { cur = 'nd'; tries = 0; pick = 0; render(); out('<b>' + HINT[0] + '</b>'); }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-co]');
    if (t) { cur = t.dataset.co; render(); out('<b>' + T('Jetzt als ' + CO[cur].name + '. Versuche, fremde Tickets zu sehen.', 'Now as ' + CO[cur].name + '. Try to see foreign tickets.') + '</b>'); return; }
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
  root.addEventListener('demo:reset', reset);
  reset();
})();
