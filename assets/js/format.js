// Pagina format — porting 1:1 dei componenti FormatHero, TopNav e PhotoGallery del sito live.

// ── FormatHero: cornice col titolo centrata, poi fade-out ──
(function () {
  var frame = document.querySelector('.FormatHero__heroFrame');
  if (!frame) return;
  function measure() {
    var h = 1.1 * frame.querySelector('span').getBoundingClientRect().height;
    frame.style.height = h + 'px';
    frame.style.top = (window.innerHeight - h) / 2 + 'px';
  }
  document.fonts.ready.then(function () {
    measure();
    frame.classList.add('FormatHero__measured');
    setTimeout(function () { frame.classList.add('FormatHero__fadeOut'); }, 1200);
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

// ── PhotoGallery: griglia album + lightbox ──
(function () {
  var data = window.PAGE_DATA || {};
  var albums = data.albums || [];
  var t = data.t || {};
  var cards = document.querySelectorAll('.PhotoGallery__cardBtn');
  if (!cards.length) return;

  var album = null, photos = [], idx = 0, lastWheel = 0, touchX = 0, skipScroll = false;
  var overlay, nums, img, download, closeBtn;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function go(i) {
    var n = photos.length;
    idx = n ? ((i % n) + n) % n : 0;
    render();
  }

  function render() {
    var p = photos[idx];
    img.src = p.full;
    download.href = p.download || p.full;
    Array.prototype.forEach.call(nums.children, function (s, i) {
      s.classList.toggle('PhotoGallery__current', i === idx);
    });
    // centra il numero corrente nella colonna (salvo quando arriva da hover)
    if (skipScroll) { skipScroll = false; }
    else {
      var cur = nums.children[idx];
      var top = cur.offsetTop - nums.offsetTop - (nums.clientHeight - cur.offsetHeight) / 2;
      nums.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
    // precarica precedente e successiva
    if (photos.length >= 2) {
      [idx + 1, idx - 1].forEach(function (j) {
        new Image().src = photos[((j % photos.length) + photos.length) % photos.length].full;
      });
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(idx + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(idx - 1);
  }

  function onWheel(e) {
    if (nums.contains(e.target) && nums.scrollHeight > nums.clientHeight) return;
    e.preventDefault();
    var now = performance.now();
    if (now - lastWheel < 400) return;
    lastWheel = now;
    go(idx + (e.deltaY > 0 ? 1 : -1));
  }

  function preventTouch(e) { e.preventDefault(); }

  function open(i) {
    album = albums[i];
    photos = (album && album.photos) || [];
    if (!photos.length) return;
    idx = 0;

    overlay = el('div', 'PhotoGallery__overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var left = el('div', 'PhotoGallery__left');
    left.title = t.closeGallery || '';
    left.addEventListener('click', function (e) { if (!nums.contains(e.target)) close(); });
    left.appendChild(el('span', 'PhotoGallery__eventInfo', album.caption));
    nums = el('span', 'PhotoGallery__nums');
    photos.forEach(function (_, j) {
      var s = el('span', 'PhotoGallery__num', String(j + 1).padStart(2, '0'));
      s.addEventListener('mouseenter', function () { skipScroll = true; go(j); });
      s.addEventListener('click', function (e) { e.stopPropagation(); go(j); });
      nums.appendChild(s);
    });
    left.appendChild(nums);

    var main = el('div', 'PhotoGallery__main');
    main.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; });
    main.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1));
    });
    img = el('img', 'PhotoGallery__mainImg');
    img.alt = album.caption || '';
    img.addEventListener('click', function () { go(idx + 1); });
    download = el('a', 'PhotoGallery__download', t.download);
    download.setAttribute('download', '');
    main.appendChild(img);
    main.appendChild(download);

    var mobileNav = el('div', 'PhotoGallery__mobileNav');
    var prev = el('button', null, t.previous);
    var next = el('button', null, t.next);
    prev.addEventListener('click', function () { go(idx - 1); });
    next.addEventListener('click', function () { go(idx + 1); });
    mobileNav.appendChild(prev);
    mobileNav.appendChild(next);

    overlay.appendChild(left);
    overlay.appendChild(main);
    overlay.appendChild(mobileNav);

    closeBtn = el('button', 'PhotoGallery__close');
    closeBtn.setAttribute('aria-label', t.close || '');
    closeBtn.innerHTML = '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round"><line x1="3" y1="3" x2="33" y2="33"></line><line x1="33" y1="3" x2="3" y2="33"></line></svg>';
    closeBtn.addEventListener('click', close);

    document.body.appendChild(overlay);
    document.body.appendChild(closeBtn);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('wheel', onWheel, { passive: false });
    overlay.addEventListener('touchmove', preventTouch, { passive: false });
    render();
  }

  function close() {
    if (!overlay) return;
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    closeBtn.remove();
    overlay = null;
    document.body.style.overflow = '';
  }

  cards.forEach(function (c, i) { c.addEventListener('click', function () { open(i); }); });
})();
