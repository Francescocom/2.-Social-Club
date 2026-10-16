// Pagina album: tutte le foto in griglia + lightbox a tutta pagina con scorrimento laterale.
// URL: album.html?g=<format>&a=<album>[&p=<n. foto da aprire>]
(function () {
  var FORMATS = {
    'bunny-club': 'Bunny Club', 'brat-party': 'Brat Party',
    'after-hours': 'After Hours', 'only-rihanna': 'Only Rihanna'
  };
  var params = new URLSearchParams(location.search);
  var slug = FORMATS[params.get('g')] ? params.get('g') : 'bunny-club';

  // carica i dati del format, poi costruisce la pagina
  var s = document.createElement('script');
  s.src = 'assets/data/' + slug + '.js';
  s.onload = init;
  document.head.appendChild(s);

  function img(url, p) { return url.split('?')[0] + '?' + p + '&auto=format&q=70'; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function init() {
    var albums = window.PAGE_DATA.albums;
    var album = albums.filter(function (a) { return a.key === params.get('a'); })[0] || albums[0];
    var photos = album.photos;
    var title = album.caption.split('\n');

    document.title = title[0] + ' — Gallery ' + FORMATS[slug] + ' — Social Club';
    var back = document.querySelector('.Album__back');
    back.href = slug + '-gallery.html';
    document.querySelector('.Album__tickets').href = slug + '.html#tickets';
    var event = document.querySelector('.Album__event');
    event.href = slug + '.html';
    event.textContent = FORMATS[slug];
    document.querySelector('.Album__head').textContent =
      album.caption + '\n' + photos.length + ' foto';

    // griglia
    var grid = document.querySelector('.Album__grid');
    photos.forEach(function (p, i) {
      var b = el('button', 'Album__thumb');
      b.setAttribute('aria-label', 'Foto ' + (i + 1));
      var im = el('img');
      im.loading = 'lazy';
      im.decoding = 'async';
      im.alt = '';
      im.src = img(p.download || p.full, 'w=500&h=750&fit=crop');
      b.appendChild(im);
      b.addEventListener('click', function () { open(i, true); });
      grid.appendChild(b);
    });

    // ── Lightbox ──
    var box, track, info, prevBtn, nextBtn, download, closeBtn, slides = [];
    var idx = 0, pushed = false, lastWheel = 0;
    var drag = null;

    function build() {
      box = el('div', 'Lightbox');
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      track = el('div', 'Lightbox__track');
      photos.forEach(function () {
        var sl = el('div', 'Lightbox__slide');
        sl.appendChild(el('img'));
        slides.push(sl);
        track.appendChild(sl);
      });
      info = el('div', 'Lightbox__info');
      var bar = el('div', 'Lightbox__bar');
      prevBtn = el('button', null, window.PAGE_DATA.t.previous);
      download = el('a', null, window.PAGE_DATA.t.download);
      download.setAttribute('download', '');
      nextBtn = el('button', null, window.PAGE_DATA.t.next);
      bar.appendChild(prevBtn);
      bar.appendChild(download);
      bar.appendChild(nextBtn);
      box.appendChild(track);
      box.appendChild(info);
      box.appendChild(bar);

      closeBtn = el('button', 'PhotoGallery__close');
      closeBtn.setAttribute('aria-label', window.PAGE_DATA.t.close);
      closeBtn.innerHTML = '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round"><line x1="3" y1="3" x2="33" y2="33"></line><line x1="33" y1="3" x2="3" y2="33"></line></svg>';

      prevBtn.addEventListener('click', function () { go(idx - 1); });
      nextBtn.addEventListener('click', function () { go(idx + 1); });
      closeBtn.addEventListener('click', close);
      box.addEventListener('wheel', onWheel, { passive: false });
      track.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      window.addEventListener('resize', function () { if (box.isConnected) place(false); });
    }

    // carica in alta risoluzione la foto corrente e le vicine
    function load(i) {
      for (var j = i - 2; j <= i + 2; j++) {
        if (j < 0 || j >= photos.length) continue;
        var im = slides[j].firstChild;
        if (!im.getAttribute('src')) { im.src = photos[j].full; im.alt = album.caption; }
      }
    }

    function place(animate) {
      track.classList.toggle('Lightbox__dragging', !animate);
      track.style.transform = 'translateX(' + (-idx * window.innerWidth) + 'px)';
    }

    function update() {
      var n = String(idx + 1).padStart(2, '0') + ' / ' + String(photos.length).padStart(2, '0');
      info.textContent = title.join('      ') + '      ' + n;
      download.href = photos[idx].download || photos[idx].full;
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === photos.length - 1;
      load(idx);
      var url = new URL(location.href);
      url.searchParams.set('p', idx + 1);
      history.replaceState(history.state, '', url);
    }

    function go(i, animate) {
      idx = Math.max(0, Math.min(photos.length - 1, i));
      place(animate !== false);
      update();
    }

    function open(i, push) {
      if (!box) build();
      document.body.appendChild(box);
      document.body.appendChild(closeBtn);
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKey);
      if (push) {
        var url = new URL(location.href);
        url.searchParams.set('p', i + 1);
        history.pushState({ lightbox: true }, '', url);
        pushed = true;
      }
      go(i, false);
    }

    function hide() {
      if (!box || !box.isConnected) return;
      box.remove();
      closeBtn.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      // riporta in vista la miniatura della foto che si stava guardando
      grid.children[idx].scrollIntoView({ block: 'center' });
    }

    function close() {
      if (pushed) { pushed = false; history.back(); return; } // popstate chiude
      var url = new URL(location.href);
      url.searchParams.delete('p');
      history.replaceState(null, '', url);
      hide();
    }

    window.addEventListener('popstate', function () {
      pushed = false;
      if (new URLSearchParams(location.search).get('p')) return;
      hide();
    });

    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(idx + 1);
      else if (e.key === 'ArrowLeft') go(idx - 1);
    }

    function onWheel(e) {
      e.preventDefault();
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      var now = performance.now();
      if (Math.abs(d) < 4 || now - lastWheel < 450) return;
      lastWheel = now;
      go(idx + (d > 0 ? 1 : -1));
    }

    // trascinamento (dito o mouse): la foto segue il movimento, al rilascio scatta alla successiva
    function onDown(e) {
      if (e.button > 0) return;
      drag = { x: e.clientX, dx: 0, t: performance.now() };
    }
    function onMove(e) {
      if (!drag) return;
      drag.dx = e.clientX - drag.x;
      if (Math.abs(drag.dx) < 5) return;
      var edge = (idx === 0 && drag.dx > 0) || (idx === photos.length - 1 && drag.dx < 0);
      var dx = edge ? drag.dx / 3 : drag.dx;
      track.classList.add('Lightbox__dragging');
      track.style.transform = 'translateX(' + (-idx * window.innerWidth + dx) + 'px)';
    }
    function onUp(e) {
      if (!drag) return;
      var dx = drag.dx, fast = Math.abs(dx) / (performance.now() - drag.t) > 0.4;
      drag = null;
      if (Math.abs(dx) < 5) {
        // click semplice: metà sinistra indietro, metà destra avanti
        if (e.target.tagName === 'IMG' || e.target.classList.contains('Lightbox__slide')) {
          go(idx + (e.clientX < window.innerWidth / 2 ? -1 : 1));
        }
        return;
      }
      if (Math.abs(dx) > window.innerWidth * 0.18 || fast) go(idx + (dx < 0 ? 1 : -1));
      else go(idx);
    }

    // apertura diretta da link (es. miniatura nella vista indice)
    var p = parseInt(params.get('p'), 10);
    if (p >= 1 && p <= photos.length) open(p - 1, false);
  }
})();
