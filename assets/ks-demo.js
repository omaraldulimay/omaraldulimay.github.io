// Firmenwissensuche: echte, vorberechnete Antworten abspielen, mit Rechtefilter je Person.
(function () {
  var root = document.getElementById('ksd');
  if (!root || !window.KS_DATA) return;
  var $ = function (id) { return document.getElementById(id); };
  var data = window.KS_DATA, user = data[0], gen = 0;
  var TAG = { not_found: 'Fangfrage: steht nirgends', permission: 'Fangfrage: fremde Abteilung', multi: 'zweiteilig' };

  function esc(t) { return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function renderUsers() {
    $('ksd-users').innerHTML = data.map(function (u, i) {
      return '<button type="button" class="lb' + (u === user ? ' pay' : '') + '" data-u="' + i + '" aria-pressed="' + (u === user) + '">' +
        esc(u.name.split(' ')[0]) + ' <small>' + esc(u.dept.join(', ')) + '</small></button>';
    }).join('');
    $('ksd-qs').innerHTML = user.qs.map(function (q, i) {
      return '<button type="button" class="ks-chip" data-q="' + i + '">' + esc(q.q) + (TAG[q.k] ? '<em>' + TAG[q.k] + '</em>' : '') + '</button>';
    }).join('');
    $('ksd-who').textContent = user.name + ' darf lesen: Allgemein, ' + user.dept.join(', ');
  }
  function ask(q) {
    var g = ++gen, steps = $('ksd-steps'), ans = $('ksd-ans');
    root.querySelectorAll('.ks-chip').forEach(function (c) { c.classList.toggle('on', c.textContent.indexOf(q.q) === 0); });
    $('ksd-q').textContent = q.q;
    ans.innerHTML = ''; $('ksd-cites').innerHTML = ''; $('ksd-meta').textContent = '';
    var list = [
      ['Suche nach Bedeutung und Stichwort', q.n],
      ['Lokal nachsortiert', 'beste Abschnitte zuerst'],
      ['Rechtefilter in der Datenbank', 'nur Allgemein, ' + user.dept.join(', ')],
      q.f ? [q.r === 'agentic' ? 'Claude als Agent, Frage braucht mehrere Schritte' : 'Claude antwortet mit Quellen', ''] : ['Nichts Passendes, das diese Person lesen darf', 'feste Antwort statt einer erfundenen']
    ];
    steps.innerHTML = list.map(function (s) { return '<li><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></li>'; }).join('');
    var lis = steps.children, i = 0;
    (function next() {
      if (g !== gen) return;
      if (i < lis.length) { lis[i].classList.add('done'); i++; return setTimeout(next, 380); }
      type(q, g);
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
      var cent = (q.usd * 100).toLocaleString('de-DE', { maximumFractionDigits: 3 });
      $('ksd-meta').textContent = (q.ms / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' s · ' + cent + ' Cent';
    })();
  }
  root.addEventListener('click', function (e) {
    var u = e.target.closest('[data-u]'), q = e.target.closest('[data-q]');
    if (u) { user = data[+u.dataset.u]; renderUsers(); ask(user.qs[0]); }
    else if (q) ask(user.qs[+q.dataset.q]);
  });
  renderUsers();
  // Erste Frage starten, sobald die Demo ins Bild kommt.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { ask(user.qs[0]); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(root);
  } else ask(user.qs[0]);
})();
