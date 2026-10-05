(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const welcome = $('welcome'), details = $('invitation-content');
  const trigger = $('envelope-trigger'), nav = $('invitation-nav');
  const footer = $('invitation-footer');
  const root = document.documentElement;
  let opened = false;
  const reducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  details.hidden = true; nav.hidden = true; footer.hidden = true;

  function reveal(direct, destination) {
    if (opened) return;
    opened = true;
    trigger.disabled = true;
    trigger.setAttribute('aria-expanded', 'true');
    welcome.classList.add('is-opening');
    $('opening-status').textContent = direct || reducedMotion ? '' : 'Opening your invitation…';
    const finish = () => {
      details.hidden = false; details.classList.add('is-revealed');
      nav.hidden = false; footer.hidden = false;
      welcome.classList.add('is-open');
      root.classList.add('invitation-open');
      welcome.hidden = true;
      $('opening-label').textContent = 'With love, you’re invited.';
      $('opening-status').textContent = '';
      $('skip-opening').hidden = true; $('replay-opening').hidden = false;
      const target = $(destination || 'invitation');
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({preventScroll: true});
        target.scrollIntoView({behavior:'auto', block:'start'});
      }
    };
    // Allow four seconds to read after the ribbon and cover finish opening.
    if (direct) finish(); else setTimeout(finish, (reducedMotion ? 0 : 2500) + 4000);
  }
  trigger.addEventListener('click', () => reveal(false));
  $('skip-opening').addEventListener('click', () => reveal(true));
  $('replay-opening').addEventListener('click', () => {
    opened = false; details.hidden = true; details.classList.remove('is-revealed');
    nav.hidden = true; footer.hidden = true;
    welcome.classList.remove('is-opening','is-open');
    root.classList.remove('invitation-open');
    welcome.hidden = false;
    trigger.disabled = false; trigger.setAttribute('aria-expanded', 'false');
    $('opening-label').textContent = 'Tap the ribbon to open';
    $('skip-opening').hidden = false; $('replay-opening').hidden = true;
    welcome.scrollIntoView({behavior:'auto', block:'start'});
    trigger.focus({preventScroll:true});
  });
  const initialTarget = String(window.location?.hash || '').slice(1);
  if (['invitation','family','album','venue'].includes(initialTarget)) reveal(true, initialTarget);
})();
