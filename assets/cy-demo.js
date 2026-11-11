// Courtyard Duftfinder: derselbe Empfehlungsalgorithmus wie in der App (src/lib/scent/finder.ts),
// hier mit einem kleinen Beispielsortiment statt des echten Shopify Katalogs.
(function () {
  var EN = document.documentElement.lang === 'en';
  function T(de, en) { return EN ? en : de; }
  var root = document.getElementById('cyd');
  if (!root) return;
  var $ = function (id) { return document.getElementById(id); };

  var FAM = { woody: [T('Holzig', 'Woody'), '#7A5A3A'], floral: [T('Blumig', 'Floral'), '#B5657A'], resinous: [T('Amber & Harz', 'Amber & resin'), '#B07A2E'],
              spiced: [T('Würzig', 'Spicy'), '#A2472F'], citrus: [T('Frisch', 'Fresh'), '#B8901A'], musky: [T('Moschus', 'Musky'), '#857A9C'] };
  var ORDER = ['woody', 'floral', 'resinous', 'spiced', 'citrus', 'musky'];
  var TAG = { woody: 'woody', oud: 'woody', sandalwood: 'woody', vetiver: 'woody', floral: 'floral', rose: 'floral', jasmine: 'floral',
              resinous: 'resinous', amber: 'resinous', vanilla: 'resinous', myrrh: 'resinous', spiced: 'spiced', saffron: 'spiced',
              cardamom: 'spiced', citrus: 'citrus', neroli: 'citrus', 'orange-blossom': 'citrus', musk: 'musky', musky: 'musky', 'white-musk': 'musky' };
  var Q = [
    { id: 'mood', title: T('Wie soll sich dein Duft anfühlen?', 'How should your scent feel?'), o: [
      ['warm', T('Warm & umhüllend', 'Warm & enveloping'), { resinous: 3, spiced: 2 }], ['fresh', T('Frisch & leicht', 'Fresh & light'), { citrus: 3, floral: 1 }],
      ['deep', T('Tief & geheimnisvoll', 'Deep & mysterious'), { woody: 3, resinous: 1 }], ['soft', T('Weich & sinnlich', 'Soft & sensual'), { musky: 3, floral: 2 }]] },
    { id: 'occasion', title: T('Wann trägst du ihn am liebsten?', 'When do you like to wear it?'), o: [
      ['daily', T('Im Alltag', 'Every day'), { citrus: 1, musky: 2 }], ['evening', T('Abends & beim Date', 'Evenings & dates'), { woody: 2, spiced: 1, resinous: 1 }],
      ['special', T('Zu besonderen Anlässen', 'Special occasions'), { woody: 2, floral: 1 }], ['home', T('Für mich, zu Hause', 'For me, at home'), { musky: 1, floral: 1, resinous: 1 }]] },
    { id: 'season', title: T('Welche Jahreszeit passt zu dir?', 'Which season suits you?'), o: [
      ['warm', T('Frühling & Sommer', 'Spring & summer'), { citrus: 2, floral: 2 }], ['cold', T('Herbst & Winter', 'Autumn & winter'), { resinous: 2, spiced: 2, woody: 1 }],
      ['all', T('Das ganze Jahr', 'All year'), { woody: 1, musky: 1 }]] },
    { id: 'intensity', title: T('Wie präsent soll er sein?', 'How present should it be?'), o: [
      ['subtle', T('Dezent', 'Subtle'), {}, 'attar'], ['balanced', T('Ausgewogen', 'Balanced'), {}], ['strong', T('Kräftig', 'Strong'), {}, 'perfume']] }
  ];
  var NOTES = [['oud', 'Oud', ['oud']], ['rose', 'Rose', ['rose']], ['vanilla', T('Vanille', 'Vanilla'), ['vanilla']], ['jasmine', T('Jasmin', 'Jasmine'), ['jasmine']],
               ['sandalwood', T('Sandelholz', 'Sandalwood'), ['sandalwood']], ['saffron', T('Safran', 'Saffron'), ['saffron']], ['amber', 'Amber', ['amber']],
               ['musk', T('Moschus', 'Musk'), ['musk', 'white-musk']], ['citrus', T('Zitrus & Neroli', 'Citrus & neroli'), ['citrus', 'neroli', 'orange-blossom']],
               ['incense', T('Weihrauch & Myrrhe', 'Incense & myrrh'), ['incense', 'frankincense', 'myrrh']]];
  var NOTE_POINTS = 3, FORMAT_POINTS = 2, SCORED_FAMILIES = 2, SCORED_NOTES = 2, PENALTY = 2, MAX_NOTES = 3;
  var P = [
    ['Amber & Saffron', 'perfume', 145, ['amber', 'saffron']],
    ['Amber Saffron Attar', 'attar', 36, ['amber', 'saffron']],
    ['Oud Royale', 'perfume', 180, ['oud', 'sandalwood', 'myrrh']],
    [T('Damaszener Rose Attar', 'Damask Rose Attar'), 'attar', 42, ['rose', 'white-musk']],
    ['Neroli Blanc', 'perfume', 120, ['neroli', 'orange-blossom', 'white-musk']],
    ['White Musk Attar', 'attar', 28, ['white-musk']],
    ['Jasmin Nuit', 'perfume', 135, ['jasmine', 'vanilla']],
    [T('Zeder & Weihrauch', 'Cedar & Incense'), 'perfume', 150, ['vetiver', 'frankincense', 'myrrh']]
  ].map(function (p) {
    var fam = []; p[3].forEach(function (t) { var f = TAG[t]; if (f && fam.indexOf(f) < 0) fam.push(f); });
    return { title: p[0], format: p[1], price: p[2], tags: p[3], families: ORDER.filter(function (f) { return fam.indexOf(f) >= 0; }) };
  });

  var a, step, tm = 0;
  function selected() { return Q.map(function (q) { return q.o.filter(function (o) { return o[0] === a[q.id]; })[0]; }).filter(Boolean); }
  function weights() {
    var w = {}; ORDER.forEach(function (f) { w[f] = 0; });
    selected().forEach(function (o) { for (var f in o[2]) w[f] += o[2][f]; });
    return w;
  }
  function prefFormat() { var o = selected().filter(function (x) { return x[3]; })[0]; return o && o[3]; }
  function best() {
    var w = weights(), fam = ORDER.map(function (f) { return w[f]; }).sort(function (x, y) { return y - x; }).slice(0, SCORED_FAMILIES)
      .reduce(function (s, x) { return s + x; }, 0);
    return fam + Math.min(a.notes.length, SCORED_NOTES) * NOTE_POINTS + (prefFormat() ? FORMAT_POINTS : 0);
  }
  function score(p, w) {
    var fs = p.families.reduce(function (s, f) { return s + w[f]; }, 0);
    var notes = NOTES.filter(function (n) { return a.notes.indexOf(n[0]) >= 0 && n[2].some(function (t) { return p.tags.indexOf(t) >= 0; }); });
    var pf = prefFormat(), fm = pf && pf === p.format;
    var reasons = [], liked = p.families.filter(function (f) { return w[f] > 0; }).sort(function (x, y) { return w[y] - w[x]; }).slice(0, 2)
      .map(function (f) { return FAM[f][0]; });
    if (liked.length) reasons.push(liked.join(' & ') + T(', so wie du es magst', ', just how you like it'));
    if (notes.length) reasons.push(T('Enthält deine Lieblingsnote ', 'Contains your favourite note ') + notes.map(function (n) { return n[1]; }).join(T(' und ', ' and ')));
    if (fm) reasons.push(p.format === 'attar' ? T('Als Duftöl dezent und nah an der Haut', 'As an oil, subtle and close to the skin') : T('Als Parfum mit spürbarer Ausstrahlung', 'As a perfume with noticeable presence'));
    return { p: p, score: fs + notes.length * NOTE_POINTS + (fm ? FORMAT_POINTS : 0), reasons: reasons };
  }
  function recommend() {
    var w = weights(), rest = P.map(function (p) { return score(p, w); }).filter(function (e) { return e.score > 0; }), picked = [];
    var same = function (x, y) { return x.families.join() === y.families.join(); };
    while (picked.length < 3 && rest.length) {
      var adj = function (e) { return e.score - PENALTY * picked.filter(function (c) { return same(c.p, e.p); }).length; };
      rest.sort(function (x, y) { return adj(y) - adj(x) || x.p.title.localeCompare(y.p.title); });
      picked.push(rest.shift());
    }
    var b = best();
    return picked.map(function (e) { e.match = Math.min(100, Math.round(100 * e.score / b)); return e; });
  }

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function render() {
    var total = Q.length + 1;
    $('cyd-steps').innerHTML = Array.apply(null, Array(total)).map(function (_, i) { return '<i class="' + (i < step ? 'on' : '') + '"></i>'; }).join('');
    var body = $('cyd-body');
    if (step < Q.length) {
      var q = Q[step];
      body.innerHTML = '<small>' + T('Frage ', 'Question ') + (step + 1) + T(' von ', ' of ') + total + '</small><b>' + esc(q.title) + '</b><div class="cy-opts">' +
        q.o.map(function (o) { return '<button type="button" data-o="' + o[0] + '" class="' + (a[q.id] === o[0] ? 'on' : '') + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>';
    } else if (step === Q.length) {
      body.innerHTML = '<small>' + T('Frage ', 'Question ') + total + T(' von ', ' of ') + total + '</small><b>' + T('Welche Noten liebst du? Bis zu drei.', 'Which notes do you love? Up to three.') + '</b><div class="cy-opts notes">' +
        NOTES.map(function (n) { return '<button type="button" data-n="' + n[0] + '" class="' + (a.notes.indexOf(n[0]) >= 0 ? 'on' : '') + '">' + esc(n[1]) + '</button>'; }).join('') +
        '</div><button type="button" class="cy-go" data-go="1">' + T('Ergebnis zeigen', 'Show result') + '</button>';
    } else {
      body.innerHTML = '<small>' + T('Dein Ergebnis', 'Your result') + '</small><b>' + T('Diese Düfte passen zu dir.', 'These scents suit you.') + '</b><div class="cy-res">' + recommend().map(function (e, i) {
        var fam = e.p.families[0] ? FAM[e.p.families[0]][1] : '#B07A2E';
        return '<article style="--fam:' + fam + ';--i:' + i + '"><i class="cy-btl"><i></i></i><div><small>#' + (i + 1) + ' · ' + e.match + ' % Match</small><b>' + esc(e.p.title) +
          '</b><span>' + (e.p.format === 'attar' ? T('Attar Öl', 'Attar oil') : 'Eau de Parfum') + T(' · ab ', ' · from $') + e.p.price + T(',00 $', '.00') + '</span>' +
          e.reasons.map(function (r) { return '<em>✓ ' + esc(r) + '</em>'; }).join('') + '</div></article>';
      }).join('') + '</div><button type="button" class="cy-again" data-again="1">' + T('Nochmal von vorn', 'Start over') + '</button>';
    }
    var w = weights(), max = Math.max(6, Math.max.apply(null, ORDER.map(function (f) { return w[f]; })));
    $('cyd-w').innerHTML = ORDER.map(function (f) {
      return '<div class="cy-w"><span>' + FAM[f][0] + '</span><i style="--c:' + FAM[f][1] + ';width:' + (w[f] / max * 100) + '%"></i><b>' + w[f] + '</b></div>';
    }).join('');
    var pf = prefFormat();
    $('cyd-f').textContent = pf ? (pf === 'attar' ? T('Duftöl bevorzugt, +2 Punkte', 'Oil preferred, +2 points') : T('Parfum bevorzugt, +2 Punkte', 'Perfume preferred, +2 points')) : T('noch offen', 'not yet');
    $('cyd-n').textContent = a.notes.length ? a.notes.map(function (id) { return NOTES.filter(function (n) { return n[0] === id; })[0][1]; }).join(', ') + T(', je +3 Punkte', ', +3 points each') : T('noch keine', 'none yet');
    $('cyd-b').textContent = best() + T(' Punkte = 100 %', ' points = 100 %');
  }
  root.addEventListener('click', function (e) {
    var o = e.target.closest('[data-o]'), n = e.target.closest('[data-n]');
    if (o) { a[Q[step].id] = o.dataset.o; render(); var at = step; clearTimeout(tm); tm = setTimeout(function () { if (step === at) { step++; render(); } }, 260); return; }
    if (n) {
      var i = a.notes.indexOf(n.dataset.n);
      if (i >= 0) a.notes.splice(i, 1); else if (a.notes.length < MAX_NOTES) a.notes.push(n.dataset.n);
      return render();
    }
    if (e.target.closest('[data-go]')) { step++; return render(); }
    if (e.target.closest('[data-again]')) { a = { notes: [] }; step = 0; return render(); }
    if (e.target.closest('[data-back]') && step > 0) { step--; render(); }
  });
  root.addEventListener('demo:reset', function () { clearTimeout(tm); a = { notes: [] }; step = 0; render(); });
  a = { notes: [] }; step = 0; render();
})();
