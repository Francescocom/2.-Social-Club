// Pagina format — FormatHero e TopNav (porting dal sito live).

// ── FormatHero: cornice col titolo centrata, poi fade-out e al suo posto i link Tickets / Gallery ──
(function () {
  var frame = document.querySelector('.FormatHero__heroFrame');
  var explore = document.querySelector('.FormatHero__heroExplore');
  if (!frame) return;
  function measure() {
    var h = 1.1 * frame.querySelector('span').getBoundingClientRect().height;
    frame.style.height = h + 'px';
    frame.style.top = (window.innerHeight - h) / 2 + 'px';
  }
  document.fonts.ready.then(function () {
    measure();
    frame.classList.add('FormatHero__measured');
    setTimeout(function () {
      frame.classList.add('FormatHero__fadeOut');
      if (explore) explore.classList.add('FormatHero__exploreVisible');
    }, 1200);
  });
  window.addEventListener('resize', measure);
})();

// ── TopNav: su mobile il nome del format apre la lista degli altri format ──
(function () {
  var wrap = document.querySelector('.TopNav__wrap');
  if (!wrap) return;
  var right = wrap.querySelector('.TopNav__topRight');
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) right.classList.remove('TopNav__expanded');
  });
  right.addEventListener('click', function (e) {
    if (window.innerWidth > 767 || e.target.closest('a')) return;
    e.preventDefault();
    e.stopPropagation();
    right.classList.toggle('TopNav__expanded');
  });
})();

// Gli album aprono la pagina album.html (lightbox in assets/js/album.js).
