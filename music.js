(function () {
  'use strict';
  const audio = document.getElementById('wedding-music');
  const button = document.getElementById('music-toggle');
  if (!audio || !button) return;
  audio.volume = 0.23;

  function update() {
    const action = audio.muted ? 'Unmute wedding music' : 'Mute wedding music';
    button.setAttribute('aria-pressed', String(audio.muted));
    button.setAttribute('aria-label', action);
    button.title = action;
  }
  function blockedStart() {
    audio.muted = true;
    update();
  }
  function play() {
    if (!audio.paused) return;
    // A guest gesture starts playback, including on mobile browsers.
    try {
      const pending = audio.play();
      if (pending && typeof pending.catch === 'function') pending.catch(blockedStart);
    } catch (_) { blockedStart(); }
  }
  function openWithMusic() {
    button.hidden = false;
    play();
  }
  button.addEventListener('click', () => {
    audio.muted = !audio.muted;
    update();
    if (!audio.muted) play();
  });
  audio.addEventListener('volumechange', update);
  audio.addEventListener('error', () => { button.hidden = true; });
  document.getElementById('envelope-trigger').addEventListener('click', openWithMusic);
  document.getElementById('skip-opening').addEventListener('click', openWithMusic);
  update();
})();
