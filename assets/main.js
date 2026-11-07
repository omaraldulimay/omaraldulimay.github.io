(function () {
  var doc = document;

  // ---- Projekte dropdown (desktop) and menu sheet (phones) ----
  var dd = doc.querySelector('.dd');
  var btn = doc.querySelector('.dd-btn');
  var menu = doc.querySelector('.dd-menu');
  var burger = doc.querySelector('.burger');
  var nav = doc.getElementById('nav');
  var mqHover = window.matchMedia('(hover:hover) and (min-width:760px)');
  var mqPhone = window.matchMedia('(max-width:759px)');
  var pinned = false, timer = null;

  function items() { return Array.prototype.slice.call(menu.querySelectorAll('a')); }
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

  // ---- pipeline demo: animated WebP unless reduced motion ----
  var img = doc.getElementById('pipeline-media');
  if (img) {
    var a = img.getAttribute('data-animated');
    if (a && !reduce.matches) img.src = a;
  }

  // ---- teaser preview: plays muted while the pointer is on a project card ----
  if (window.matchMedia('(hover:hover)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.prototype.forEach.call(doc.querySelectorAll('.pj-preview'), function (v) {
      var card = v.closest('.pj'), fig = v.parentNode;
      card.addEventListener('mouseenter', function () {
        if (!v.src) v.src = v.getAttribute('data-src');
        var p = v.play(); if (p && p.catch) p.catch(function () {});
        fig.classList.add('playing');
      });
      card.addEventListener('mouseleave', function () { fig.classList.remove('playing'); v.pause(); });
    });
  }
})();
