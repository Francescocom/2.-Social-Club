// About — al passaggio sul nome di un format mostra la sua foto di sfondo.
(function () {
  var layers = document.querySelectorAll('.about__bgLayer');
  var links = document.querySelectorAll('.about__formatLink');
  links.forEach(function (link, i) {
    link.addEventListener('mouseenter', function () {
      if (!window.matchMedia('(hover: hover)').matches) return;
      layers.forEach(function (l, j) { l.classList.toggle('about__visible', i === j); });
    });
    link.addEventListener('mouseleave', function () {
      layers.forEach(function (l) { l.classList.remove('about__visible'); });
    });
  });
})();
