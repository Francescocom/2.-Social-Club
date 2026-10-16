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

  // ── Vista indice ──
  var index = document.querySelector('[data-view="index"]');
  albums.forEach(function (a) {
    var row = el('div', 'Gallery__row');
    var text = el('a', 'Gallery__rowText');
    text.href = albumUrl(a);
    text.appendChild(el('span', 'Gallery__rowVenue', lines(a)[0]));
    text.appendChild(el('span', 'Gallery__rowDate', lines(a).slice(1).join(' ')));
    text.appendChild(el('span', 'Gallery__rowCount', count(a)));
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
  });

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
    card.appendChild(el('div', 'PhotoGallery__caption', a.caption + (a.photos.length > 1 ? '\n' + count(a) : '')));
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
  });

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
