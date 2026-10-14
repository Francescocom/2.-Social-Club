// Home carousel — porting 1:1 del componente HomeCarousel del sito live.
(function () {
  var formats = window.PAGE_DATA.formats;
  var statsData = window.PAGE_DATA.stats || [];

  var root = document.querySelector('.HomeCarousel__root');
  var frame = root.querySelector('.HomeCarousel__frame');
  var track = root.querySelector('.HomeCarousel__track');
  var btn = root.querySelector('.HomeCarousel__overlayBtn');
  var bgs = Array.from(root.querySelectorAll('.HomeCarousel__bgImg'));
  var infoSpans = root.querySelectorAll('.HomeCarousel__infoHover span');
  var nextDate = infoSpans[0];
  var nextLocation = infoSpans[1];
  var statNums = Array.from(root.querySelectorAll('.HomeCarousel__statItem > span'));

  var pills = Array.from(track.querySelectorAll('a'));
  var labels = pills.map(function (a) { return a.querySelector('span'); });
  var n = formats.length;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var statValues = statsData.map(function (s) { return s.value; });

  var st = {
    pillH: 1, setH: n, target: 4 * n, displayY: 0, activeIdx: -1,
    hovered: false, expanded: false, idle: true, loader: true, statsShown: false,
    acc: 0, lastWheelT: 0, lastStepT: 0, idleTimer: null, idleMoveOrigin: null,
    touchY: 0, touchMoved: false, raf: 0, prevTs: 0
  };

  function setFlag(name, on) { root.setAttribute('data-' + name, on ? '1' : '0'); }
  function mod(i) { return ((i % n) + n) % n; }

  function showStats() {
    if (st.statsShown) return;
    st.statsShown = true;
    setFlag('stats', true);
    statNums.forEach(function (el, i) {
      var target = statValues[i];
      var start = performance.now();
      (function tick(now) {
        var p = Math.min((now - start) / 400, 1);
        el.textContent = Math.round(p * target);
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    });
  }

  function hideStats() {
    if (!st.statsShown) return;
    st.statsShown = false;
    setFlag('stats', false);
    statNums.forEach(function (el) { el.textContent = '0'; });
  }

  function goIdle() {
    if (st.expanded || st.idle) return;
    st.idle = true;
    st.idleMoveOrigin = null;
    setHovered(false);
    setFlag('idle', true);
  }

  function enter(opts) {
    if (!st.idle) return;
    st.idle = false;
    st.loader = false;
    setFlag('idle', false);
    setFlag('loader', false);
    setFlag('auto-enter', false);
    hideStats();
    if (opts && opts.spin) {
      var cur = Math.round(st.displayY / st.pillH);
      st.target = cur + 2 * n + Math.floor(Math.random() * n);
    }
    resetIdleTimer();
  }

  function resetIdleTimer() {
    clearTimeout(st.idleTimer);
    if (window.innerWidth <= 767) return;
    st.idleTimer = setTimeout(goIdle, 45000);
  }

  function measure() {
    pills.forEach(function (p) { p.style.height = ''; });
    var h = 1.1 * pills[0].getBoundingClientRect().height;
    frame.style.height = h + 'px';
    frame.style.top = (root.clientHeight - h) / 2 + 'px';
    btn.style.width = h + 'px';
    btn.style.height = h + 'px';
    var inner = h - 2 * parseFloat(getComputedStyle(frame).borderTopWidth);
    pills.forEach(function (p) { p.style.height = inner + 'px'; });
    st.pillH = inner;
    st.setH = inner * n;
  }

  function step(dir) { st.target += dir; resetIdleTimer(); }

  function setHovered(on) {
    if (st.hovered === on) return;
    st.hovered = on;
    setFlag('hovered', on);
    if (!on) labels.forEach(function (l) { l.style.backgroundSize = ''; l.style.backgroundPosition = ''; });
  }

  function frameLoop(ts) {
    st.raf = requestAnimationFrame(frameLoop);
    var dt = Math.min(ts - (st.prevTs || ts), 50) / 1000;
    st.prevTs = ts;
    var goal = st.target * st.pillH;
    var diff = goal - st.displayY;
    if (Math.abs(diff) < 0.3) st.displayY = goal;
    else st.displayY += diff * (reduced ? 1 : 1 - Math.exp(-10 * dt));

    track.style.transform = 'translateY(' + (-(st.displayY % st.setH) - st.setH) + 'px)';

    var idx = mod(Math.round(st.displayY / st.pillH));
    if (idx !== st.activeIdx) {
      st.activeIdx = idx;
      bgs.forEach(function (b, i) { b.setAttribute('data-visible', i === idx ? '1' : '0'); });
      root.style.setProperty('--frame-bg-img', "url('" + formats[idx].hero + "')");
      nextDate.textContent = formats[idx].nextEvent.date;
      nextLocation.textContent = formats[idx].nextEvent.location;
      pills.forEach(function (p, i) { p.setAttribute('data-inframe', i % n === idx ? '1' : '0'); });
    }
    setFlag('scrolling', Math.abs(diff) > 2);

    if (st.hovered && !st.expanded) {
      var vw = window.innerWidth, vh = root.clientHeight;
      pills.forEach(function (p, i) {
        if (i % n !== st.activeIdx) return;
        var l = labels[i], r = l.getBoundingClientRect();
        l.style.backgroundSize = vw + 'px ' + vh + 'px';
        l.style.backgroundPosition = -r.left + 'px ' + -r.top + 'px';
      });
    }
  }

  function onWheel(e) {
    if (e.target instanceof Node && btn.contains(e.target)) return;
    e.preventDefault();
    var now = performance.now();
    if (st.idle) { enter({ spin: st.loader }); return; }
    if (now - st.lastWheelT > 200) st.acc = 0;
    st.lastWheelT = now;
    if (now - st.lastStepT < 250) return;
    if (st.acc !== 0 && Math.sign(e.deltaY) !== Math.sign(st.acc)) st.acc = 0;
    st.acc += e.deltaY;
    if (Math.abs(st.acc) >= 100) { step(Math.sign(st.acc)); st.acc = 0; st.lastStepT = now; }
    resetIdleTimer();
  }

  function onKey(e) {
    var down = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    var up = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
    if (st.idle) {
      if (down || up || e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        enter({ spin: st.loader });
      }
      return;
    }
    if (down || up) { e.preventDefault(); step(down ? 1 : -1); }
  }

  function onTouchStart(e) { st.touchY = e.touches[0].clientY; st.touchMoved = false; }
  function onTouchMove() { st.touchMoved = true; }
  function onTouchEnd(e) {
    if (st.idle) { enter({ spin: st.loader }); return; }
    if (!st.touchMoved) return;
    var dy = st.touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) >= 20) step(dy > 0 ? 1 : -1);
  }

  function onMouseMove(e) {
    resetIdleTimer();
    var r = frame.getBoundingClientRect();
    var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (st.idle) {
      if (st.loader) { inside ? showStats() : hideStats(); return; }
      if (!st.idleMoveOrigin) st.idleMoveOrigin = [e.clientX, e.clientY];
      if (Math.hypot(e.clientX - st.idleMoveOrigin[0], e.clientY - st.idleMoveOrigin[1]) > 12) enter();
      return;
    }
    setHovered(inside && !st.expanded);
  }

  function onClick() { if (st.idle) enter({ spin: st.loader }); }

  function onBtnClick(e) {
    e.stopPropagation();
    st.expanded = !st.expanded;
    setFlag('expanded', st.expanded);
    if (st.expanded) setHovered(false);
    resetIdleTimer();
  }

  function onResize() {
    var idx = mod(Math.round(st.displayY / st.pillH));
    measure();
    st.target = 4 * n + idx;
    st.displayY = st.target * st.pillH;
  }

  if (new URLSearchParams(window.location.search).get('direct') === '1') {
    st.idle = false; st.loader = false;
    setFlag('idle', false); setFlag('loader', false);
  } else if (window.innerWidth <= 767) {
    showStats();
    setTimeout(function () { if (st.loader) setFlag('auto-enter', true); }, 2000);
  }
  resetIdleTimer();

  document.fonts.ready.then(function () {
    measure();
    st.displayY = st.target * st.pillH;
    setFlag('ready', true);
    st.raf = requestAnimationFrame(frameLoop);
  });

  root.addEventListener('wheel', onWheel, { passive: false });
  root.addEventListener('click', onClick);
  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchmove', onTouchMove, { passive: true });
  root.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  btn.addEventListener('click', onBtnClick);
  btn.addEventListener('mouseenter', function () { setFlag('btn-hover', true); });
  btn.addEventListener('mouseleave', function () { setFlag('btn-hover', false); });
})();
