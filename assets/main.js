(function () {
  var doc = document, EN = doc.documentElement.lang === 'en';

  // ---- Projekte dropdown (desktop) and menu sheet (phones) ----
  var dd = doc.querySelector('.dd');
  var btn = doc.querySelector('.dd-btn');
  var menu = doc.querySelector('.dd-menu');
  var burger = doc.querySelector('.burger');
  var nav = doc.getElementById('nav');
  var mqHover = window.matchMedia('(hover:hover) and (min-width:760px)');
  var mqPhone = window.matchMedia('(max-width:759px)');
  var pinned = false, timer = null;

  function items() { return Array.prototype.slice.call(menu.querySelectorAll('.dd-pane.on a')); }
  // Zweistufig: Kategorie wählen (Maus oder Tastatur), rechts erscheinen ihre Projekte.
  function pick(c) {
    Array.prototype.forEach.call(menu.querySelectorAll('.dd-cat'), function (b) { var on = b.dataset.c === c; b.classList.toggle('on', on); b.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    Array.prototype.forEach.call(menu.querySelectorAll('.dd-pane'), function (p) { p.classList.toggle('on', p.dataset.c === c); });
  }
  if (menu) Array.prototype.forEach.call(menu.querySelectorAll('.dd-cat'), function (b) {
    b.addEventListener('mouseenter', function () { pick(b.dataset.c); });
    b.addEventListener('focus', function () { pick(b.dataset.c); });
    b.addEventListener('click', function () { pick(b.dataset.c); var a = menu.querySelector('.dd-pane.on a'); if (a) a.focus(); });
  });
  function setOpen(o) {
    dd.classList.toggle('open', o);
    btn.setAttribute('aria-expanded', o ? 'true' : 'false');
    if (!o) pinned = false;
  }
  if (dd && btn && menu) {
    btn.addEventListener('click', function () {
      if (dd.classList.contains('open') && !pinned && mqHover.matches) { pinned = true; return; }
      var o = !dd.classList.contains('open');
      setOpen(o); pinned = o;
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); pinned = true; items()[0].focus(); }
      if (e.key === 'Escape') setOpen(false);
    });
    menu.addEventListener('keydown', function (e) {
      var l = items(), i = l.indexOf(doc.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); l[(i + 1) % l.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); l[(i - 1 + l.length) % l.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); l[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); l[l.length - 1].focus(); }
      else if (e.key === 'Escape') { setOpen(false); btn.focus(); }
    });
    dd.addEventListener('focusout', function (e) {
      if (!dd.contains(e.relatedTarget)) setOpen(false);
    });
    dd.addEventListener('mouseenter', function () {
      if (!mqHover.matches) return;
      clearTimeout(timer); setOpen(true);
    });
    dd.addEventListener('mouseleave', function () {
      if (!mqHover.matches || pinned) return;
      timer = setTimeout(function () { setOpen(false); }, 160);
    });
    doc.addEventListener('click', function (e) { if (!dd.contains(e.target)) setOpen(false); });
  }
  if (burger && nav) {
    function sheet(o) {
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      nav.classList.toggle('open', o);
      doc.body.classList.toggle('lock', o);
    }
    burger.addEventListener('click', function () { sheet(burger.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) sheet(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { sheet(false); burger.focus(); } });
    mqPhone.addEventListener && mqPhone.addEventListener('change', function () { sheet(false); });
  }

  // ---- Header: beim Runterscrollen weg, beim Hochscrollen wieder da ----
  var top = doc.querySelector('.top'), lastY = window.scrollY;
  if (top) window.addEventListener('scroll', function () {
    var y = window.scrollY, open = (dd && dd.classList.contains('open')) || doc.body.classList.contains('lock');
    if (!open && Math.abs(y - lastY) > 6) top.classList.toggle('hide', y > lastY && y > 120);
    lastY = y;
  }, { passive: true });

  // ---- scroll-in reveals ----
  var rv = doc.querySelectorAll('.rv');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || reduce.matches) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  }

  // ---- live CI status from the GitHub API (one call, no key; hidden if it fails) ----
  Array.prototype.forEach.call(doc.querySelectorAll('.live-ci'), function (el) {
    var repo = el.getAttribute('data-repo');
    fetch('https://api.github.com/repos/omaraldulimay/' + repo + '/actions/runs?branch=main&per_page=10')
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (d) {
        var run = (d.workflow_runs || []).filter(function (x) { return /^ci$/i.test(x.name) && x.status === 'completed'; })[0];
        if (!run) return;
        var ok = run.conclusion === 'success';
        var days = Math.round((new Date(run.updated_at) - Date.now()) / 864e5);
        var when = new Intl.RelativeTimeFormat(EN ? 'en' : 'de', { numeric: 'auto' }).format(days, 'day');
        el.innerHTML = '<i class="' + (ok ? 'ok' : 'bad') + '"></i>' + (ok ? (EN ? 'Tests passing' : 'Tests grün') : (EN ? 'Tests failing' : 'Tests rot')) + (EN ? ', last checked ' : ', zuletzt geprüft ') + when;
        el.hidden = false;
      })
      .catch(function () {});
  });
})();
