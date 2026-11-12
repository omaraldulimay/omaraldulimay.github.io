// Firmenwissensuche: echte, vorberechnete Antworten abspielen, mit Rechtefilter je Person.
(function () {
  var EN = document.documentElement.lang === 'en', LOC = EN ? 'en-GB' : 'de-DE';
  function T(de, en) { return EN ? en : de; }
  var DEPT = { Personal: 'HR', Vertrieb: 'Sales', Logistik: 'Logistics', IT: 'IT' };
  function dept(u) { return u.dept.map(function (d) { return EN ? (DEPT[d] || d) : d; }).join(', '); }
  var root = document.getElementById('ksd');
  if (!root || !window.KS_DATA) return;
  var $ = function (id) { return document.getElementById(id); };
  var data = window.KS_DATA, user = data[2], gen = 0;
  data.forEach(function (u) { u.qs = u.qs.filter(function (q) { return q.f; }); }); // nur beantwortete Fragen zeigen
  var START = Math.max(0, data[2].qs.findIndex(function (q) { return /Nordhafen/.test(q.q); })); // Start: Katja (Vertrieb) mit firmeninterner Vertragsstrafe-Frage
  var TAG = { not_found: T('Steht in keinem Dokument', 'Not in any document'), permission: T('Andere Abteilung, kein Zugriff', 'Other department, no access'), multi: T('Zwei Fragen in einer', 'Two questions in one') };
  function say(kind, text) {
    var r = $('ksd-res'), t = $('ksd-res-t');
    r.className = 'lld-res' + (kind ? ' k-' + kind : '');
    t.textContent = text;
    t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  }
  function first() { return user.name.split(' ')[0]; }

  function esc(t) { return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderUsers() {
    $('ksd-users').innerHTML = data.map(function (u, i) {
      return '<button type="button" class="lb' + (u === user ? ' pay' : '') + '" data-u="' + i + '" aria-pressed="' + (u === user) + '">' +
        esc(u.name.split(' ')[0]) + ' <small>' + esc(dept(u)) + '</small></button>';
    }).join('');
    $('ksd-qs').innerHTML = user.qs.map(function (q, i) {
      return '<button type="button" class="ks-chip" data-q="' + i + '">' + esc(q.q) + (TAG[q.k] ? '<em>' + TAG[q.k] + '</em>' : '') + '</button>';
    }).join('');
    $('ksd-who').textContent = user.name + T(' darf nur lesen: Allgemein, ', ' may only read: General, ') + dept(user);
  }
  function ask(q) {
    var g = ++gen, steps = $('ksd-steps'), ans = $('ksd-ans');
    root.querySelectorAll('.ks-chip').forEach(function (c) { c.classList.toggle('on', c.textContent.indexOf(q.q) === 0); });
    $('ksd-q').textContent = q.q;
    ans.innerHTML = ''; $('ksd-cites').innerHTML = '';
    say('info', T('Die Suche läuft …', 'Searching …'));
    var list = [
      [T('Passende Stellen in den Dokumenten suchen', 'Find matching passages in the documents'), q.n.match(/\d+/)[0] + T(' gefunden', ' found')],
      [T('Nur Dokumente behalten, die ' + first() + ' lesen darf', 'Keep only documents ' + first() + ' may read'), T('Allgemein, ', 'General, ') + dept(user)],
      q.f ? [q.r === 'agentic' ? T('Antwort in mehreren Schritten zusammensetzen', 'Build the answer in several steps') : T('Antwort mit Quellen schreiben', 'Write the answer with sources'), '']
          : [T('Nichts Passendes gefunden', 'Nothing suitable found'), T('ehrliche Antwort statt einer erfundenen', 'an honest answer instead of a made up one')]
    ];
    steps.innerHTML = list.map(function (s) { return '<li><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></li>'; }).join('');
    var lis = steps.children, i = 0;
    (function next() {
      if (g !== gen) return;
      if (i < lis.length) { lis[i].classList.add('done'); i++; return setTimeout(next, 380); }
      type(q, g);
      if (q.f) say('ok', T('Antwort gefunden. Mit Quelle, nur aus Dokumenten, die ' + first() + ' lesen darf.', 'Answer found. With a source, only from documents ' + first() + ' may read.'));
      else if (q.k === 'permission') say('warn', T('Kein Zugriff. Das steht nur in Dokumenten einer anderen Abteilung.', 'No access. This is only in documents of another department.'));
      else say('warn', T('Nichts gefunden. Das System erfindet keine Antwort.', 'Nothing found. The system does not make up an answer.'));
    })();
  }
  function type(q, g) {
    var ans = $('ksd-ans'), text = q.a, n = 0;
    ans.classList.toggle('none', !q.f);
    (function step() {
      if (g !== gen) return;
      n = Math.min(text.length, n + 4);
      ans.innerHTML = esc(text.slice(0, n)).replace(/\[(\d+)\]/g, '<sup>$1</sup>');
      if (n < text.length) return requestAnimationFrame(step);
      $('ksd-cites').innerHTML = q.c.map(function (c, i) {
        return '<span><sup>' + (i + 1) + '</sup>' + esc(c[0]) + ' · ' + esc(c[1]) + '</span>';
      }).join('');
    })();
  }
  root.addEventListener('click', function (e) {
    var u = e.target.closest('[data-u]'), q = e.target.closest('[data-q]');
    if (u) { user = data[+u.dataset.u]; renderUsers(); ask(user.qs[user === data[2] ? START : 0]); }
    else if (q) ask(user.qs[+q.dataset.q]);
  });
  function start() { gen++; user = data[2]; renderUsers(); ask(user.qs[START]); }
  root.addEventListener('demo:reset', start);
  renderUsers();
  say('', T('Wähle eine Person und klicke eine Frage an.', 'Pick a person and click a question.'));
  // Erste Frage starten, sobald die Demo ins Bild kommt.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { ask(user.qs[START]); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(root);
  } else ask(user.qs[START]);
})();
