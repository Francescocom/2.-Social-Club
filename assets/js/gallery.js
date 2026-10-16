// Pagina Gallery di un format: elenco album con due viste (indice / copertine).
(function () {
  var slug = document.body.getAttribute('data-format');
  var albums = (window.PAGE_DATA && window.PAGE_DATA.albums) || [];

  // URL immagine Sanity ridimensionata
  function img(url, params) { return url.split('?')[0] + '?' + params + '&auto=format&q=70'; }
  // proporzioni dal nome file Sanity: ...-1867x2800.jpg
  function ratio(url) {
    var m = url.split('?')[0].match(/-(\d+)x(\d+)\.\w+$/);
    return m ? m[1] / m[2] : 2 / 3;
  }
  function albumUrl(a, photo) {
    return 'album.html?g=' + slug + '&a=' + encodeURIComponent(a.key) + (photo ? '&p=' + photo : '');
  }
  function lines(a) { return a.caption.split('\n'); }
  function count(a) { return a.photos.length + ' foto'; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // ── Vista indice (10 album alla volta, poi "Show more") ──
  var PAGE = 10;
  var index = document.querySelector('.Gallery__index');
  var more = document.querySelector('.Gallery__showMore');
  var shown = 0;
  function showNext() {
    albums.slice(shown, shown + PAGE).forEach(addRow);
    shown = Math.min(albums.length, shown + PAGE);
    more.hidden = shown >= albums.length;
  }
  more.querySelector('button').addEventListener('click', showNext);

  function addRow(a) {
    var row = el('div', 'Gallery__row');
    var text = el('a', 'Gallery__rowText');
    text.href = albumUrl(a);
    var info = el('span', 'Gallery__rowInfo');
    info.appendChild(el('span', 'Gallery__rowVenue', lines(a)[0]));
    var meta = el('span', 'Gallery__rowMeta');
    if (lines(a).length > 1) meta.appendChild(el('span', 'Gallery__rowDate', lines(a).slice(1).join(' ')));
    meta.appendChild(el('span', 'Gallery__rowCount', count(a)));
    info.appendChild(meta);
    text.appendChild(info);
    text.appendChild(el('span', 'Gallery__rowSee', 'See Album'));
    row.appendChild(text);

    var strip = el('div', 'Gallery__strip');
    a.photos.forEach(function (p, i) {
      var link = el('a');
      link.href = albumUrl(a, i + 1);
      var im = el('img');
      im.loading = 'lazy';
      im.decoding = 'async';
      im.alt = '';
      im.src = img(p.download || p.full, 'h=440');
      im.style.aspectRatio = ratio(p.download || p.full);
      link.appendChild(im);
      strip.appendChild(link);
    });
    row.appendChild(strip);
    index.appendChild(row);
    dragScroll(strip);
  }
  showNext();

  // trascinamento col mouse sulle strisce (su touch scorrono già da sole)
  function dragScroll(strip) {
    var startX = 0, startLeft = 0, moved = false, down = false;
    strip.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false;
      startX = e.clientX; startLeft = strip.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; strip.classList.add('Gallery__dragging'); }
      strip.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      down = false;
      strip.classList.remove('Gallery__dragging');
    });
    strip.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
  }

  // ── Vista copertine ──
  var covers = document.querySelector('[data-view="covers"]');
  albums.forEach(function (a) {
    var card = el('div', 'PhotoGallery__card');
    card.appendChild(el('div', 'PhotoGallery__caption', a.caption));
    var link = el('a', 'PhotoGallery__cardBtn');
    link.href = albumUrl(a);
    var box = el('span', 'PhotoGallery__cardImg');
    var im = el('img');
    im.loading = 'lazy';
    im.alt = a.caption;
    im.src = img(a.cover, 'w=700&h=875&fit=crop');
    box.appendChild(im);
    link.appendChild(box);
    card.appendChild(link);
    covers.appendChild(card);
    loopOnHover(card, im, a);
  });

  // desktop: in hover la copertina scorre le foto dell'album come una gif
  function loopOnHover(card, im, a) {
    if (a.photos.length < 2) return;
    var cover = im.src, timer = null, frames = null, i = 0;
    card.addEventListener('mouseenter', function () {
      if (!window.matchMedia('(hover: hover)').matches) return;
      if (!frames) {
        frames = a.photos.slice(0, 12).map(function (p) {
          var f = new Image();
          f.src = img(p.download || p.full, 'w=700&h=875&fit=crop');
          return f;
        });
      }
      i = 0;
      timer = setInterval(function () {
        // salta i fotogrammi non ancora caricati
        for (var k = 0; k < frames.length; k++) {
          i = (i + 1) % frames.length;
          if (frames[i].complete && frames[i].naturalWidth) { im.src = frames[i].src; break; }
        }
      }, 220);
    });
    card.addEventListener('mouseleave', function () {
      clearInterval(timer);
      im.src = cover;
    });
  }

  // ── Switch tra le viste (ricordata per le prossime visite) ──
  var buttons = document.querySelectorAll('.Gallery__viewBtn');
  function show(view) {
    document.querySelectorAll('.Gallery__view').forEach(function (v) {
      v.hidden = v.getAttribute('data-view') !== view;
    });
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-show') === view ? 'true' : 'false');
    });
    try { localStorage.setItem('galleryView', view); } catch (e) {}
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-show')); });
  });
  var saved = 'index';
  try { saved = localStorage.getItem('galleryView') || 'index'; } catch (e) {}
  show(saved);

  // ── Menu gallery su mobile: tap per aprire la lista ──
  var sw = document.querySelector('.Gallery__switch');
  document.addEventListener('click', function (e) {
    if (!sw.contains(e.target)) sw.classList.remove('Gallery__expanded');
  });
  sw.addEventListener('click', function (e) {
    if (window.innerWidth > 767 || e.target.closest('a')) return;
    e.preventDefault();
    sw.classList.toggle('Gallery__expanded');
  });
})();
