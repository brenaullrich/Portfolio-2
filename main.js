(function () {
  'use strict';

  var root = document.documentElement;
  var UNLOCK_KEY = 'bu_portfolio_unlocked';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Password gate ------------------------------------------------------
  // Client-side only: keeps casual visitors out, not a real access control.
  var gateForm = document.getElementById('gate-form');
  var pwInput = document.getElementById('pw');
  var pwError = document.getElementById('pw-error');

  function isUnlocked() { return root.classList.contains('unlocked'); }

  if (!isUnlocked()) pwInput.focus();

  pwInput.addEventListener('input', function () { pwError.hidden = true; });
  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = pwInput.value.trim().toLowerCase().replace(/\s+/g, '') === 'social26';
    if (!ok) { pwError.hidden = false; return; }
    try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (err) {}
    pwInput.value = '';
    root.classList.add('unlocked');
    playGridVideos();
    animateStrip();
  });

  // ---- Collage scaling ----------------------------------------------------
  // The collage is a fixed 460×600 composition; scale it to fit narrow screens.
  var fit = document.querySelector('.collage-fit');
  var collage = document.querySelector('.collage');
  function fitCollage() {
    var s = Math.min(1, fit.clientWidth / 460);
    collage.style.transform = s < 1 ? 'scale(' + s + ')' : '';
    fit.style.height = (600 * s) + 'px';
  }
  fitCollage();
  window.addEventListener('resize', fitCollage);

  // ---- Photobooth strip drop-in ------------------------------------------
  var strip = document.getElementById('strip');
  var tack = document.getElementById('tack');
  var animated = false;
  var canAnimate = !reduceMotion && !!strip.animate;
  if (canAnimate) root.classList.add('js-anim');

  function animateStrip() {
    if (animated || !canAnimate || !isUnlocked()) return;
    animated = true;
    var shadow = ' drop-shadow(0 12px 18px rgba(42,27,32,0.28))';
    var drop = strip.animate([
      { transform: 'translateY(-102%) rotate(0deg)' },
      { transform: 'translateY(-60%) rotate(0deg)', offset: 0.35 },
      { transform: 'translateY(-60%) rotate(0deg)', offset: 0.5 },
      { transform: 'translateY(4%) rotate(-3.5deg)', offset: 0.85 },
      { transform: 'translateY(0) rotate(-2deg)' }
    ], { duration: 2200, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both' });
    strip.animate([
      { filter: 'brightness(2.4) contrast(0.35) sepia(0.4)' + shadow },
      { filter: 'brightness(1.4) contrast(0.7) sepia(0.3)' + shadow, offset: 0.5 },
      { filter: 'brightness(1) contrast(1) sepia(0)' + shadow }
    ], { duration: 3600, delay: 900, easing: 'ease-out', fill: 'both' });
    drop.onfinish = function () {
      var pin = tack.animate([
        { opacity: 0, transform: 'translate(-26px, -46px) rotate(-28deg)' },
        { opacity: 1, transform: 'translate(0, 4px) rotate(-2deg)', offset: 0.7 },
        { opacity: 1, transform: 'translate(0, -1px) rotate(-5deg)', offset: 0.88 },
        { opacity: 1, transform: 'translate(0, 0) rotate(-4deg)' }
      ], { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' });
      pin.onfinish = function () {
        strip.animate([
          { transform: 'translateY(2px) rotate(-2.6deg)' },
          { transform: 'translateY(0) rotate(-2deg)' }
        ], { duration: 300, easing: 'ease-out', fill: 'forwards' }).onfinish = function () {
          strip.animate([
            { transform: 'rotate(-2deg)' },
            { transform: 'rotate(-0.8deg)' },
            { transform: 'rotate(-2deg)' }
          ], { duration: 5200, easing: 'ease-in-out', iterations: Infinity });
        };
      };
    };
  }
  animateStrip();

  // ---- Reel previews ------------------------------------------------------
  var gridVideos = Array.prototype.slice.call(document.querySelectorAll('.reel-frame video'));
  function playGridVideos() {
    gridVideos.forEach(function (v) {
      v.muted = true;
      if (v.paused) v.play().catch(function () {});
    });
  }
  playGridVideos();

  // ---- Video modal --------------------------------------------------------
  var modal = document.getElementById('modal');
  var modalVideo = document.getElementById('modal-video');
  var modalTitle = document.getElementById('modal-title');
  var modalMeta = document.getElementById('modal-meta');
  var modalClose = document.getElementById('modal-close');
  var lastTrigger = null;

  function openModal(item) {
    lastTrigger = item;
    modalTitle.textContent = item.dataset.title;
    modalMeta.textContent = item.dataset.meta;
    modalVideo.src = item.dataset.src;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    gridVideos.forEach(function (v) { v.pause(); });
    modalVideo.muted = false;
    modalVideo.play().catch(function () {
      modalVideo.muted = true;
      modalVideo.play().catch(function () {});
    });
    modalClose.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
    modal.hidden = true;
    document.body.style.overflow = '';
    playGridVideos();
    if (lastTrigger) lastTrigger.focus();
  }

  document.querySelectorAll('.reel-item').forEach(function (item) {
    item.addEventListener('click', function () { openModal(item); });
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
})();
