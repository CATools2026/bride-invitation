(function () {
  'use strict';
  const config = window.WEDDING_INVITATION || {};
  const album = window.WEDDING_ALBUM || {photos: []};
  const core = window.WeddingCore;
  const $ = id => document.getElementById(id);
  const text = (id, value) => { $(id).textContent = value; };
  const parentLines = (id, names) => {
    const lines = names.filter(Boolean).flatMap((name,index) => index ? ['&',name] : [name]);
    $(id).replaceChildren(...lines.map(value => {
      const line = document.createElement('span');
      line.className = value === '&' ? 'parent-line parent-line-and' : 'parent-line';
      line.textContent = value; return line;
    }));
  };
  const groom = String(config.groom || '').trim() || 'Groom';
  const bride = String(config.bride || '').trim() || 'Bride';
  const groomShort = String(config.groomShort || groom).trim();
  const brideShort = String(config.brideShort || bride).trim();
  const fields = {...config, groom, bride, groomShort, brideShort};
  document.querySelectorAll('[data-field]').forEach(element => {
    const value = fields[element.dataset.field];
    if (typeof value === 'string' && value.trim()) element.textContent = value;
  });
  $('draft-banner').hidden = config.draft === false;
  document.title = brideShort + ' & ' + groomShort + ' · Wedding Invitation';
  document.querySelector('meta[property="og:title"]').content = document.title;
  $('brand-monogram').replaceChildren(document.createTextNode(groomShort.charAt(0) + ' '));
  const and = document.createElement('i'); and.textContent = '&';
  $('brand-monogram').append(and, document.createTextNode(' ' + brideShort.charAt(0)));
  const bp = config.brideParents || {};
  const names = [bp.father, bp.mother].filter(value => typeof value === 'string' && value.trim());
  parentLines('groom-parents', names.length ? names : ['With love from Kaveesha’s family']);
  parentLines('envelope-groom-parents', names.length ? names : ['With love from Kaveesha’s family']);
  $('bride-family').hidden = true;

  const event = core.eventDate(config);
  const dateOnly = core.eventDate({...config, startTime: '12:00'});
  if (dateOnly) {
    // Format the supplied local date, independent of the guest’s timezone.
    const localDate = new Date(config.date + 'T12:00:00Z');
    const formatted = new Intl.DateTimeFormat('en-GB', {weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(localDate);
    text('hero-date', formatted); text('display-date', formatted); text('opening-date', formatted);
    const compactDate = config.date.slice(8,10) + ' · ' + config.date.slice(5,7) + ' · ' + config.date.slice(2,4);
    text('stationery-date', compactDate); text('closing-date', compactDate);
  }
  let timeLabel = String(config.timeLabel || '').trim();
  if (!timeLabel && event) {
    const [hours, minutes] = config.startTime.split(':').map(Number);
    timeLabel = (hours % 12 || 12) + ':' + String(minutes).padStart(2,'0') + (hours >= 12 ? ' PM' : ' AM');
  }
  if (timeLabel) { text('hero-time', timeLabel); text('display-time', timeLabel + ' · Sri Lanka time'); text('opening-time', timeLabel); }
  if (event) {
    $('calendar-button').hidden = false;
    const updateCountdown = () => {
      const remaining = event.getTime() - Date.now();
      if (remaining <= 0) { $('countdown').hidden = true; return; }
      $('countdown').hidden = false;
      text('count-days', String(Math.floor(remaining / 86400000)));
      text('count-hours', String(Math.floor(remaining / 3600000) % 24));
      text('count-minutes', String(Math.floor(remaining / 60000) % 60));
    };
    updateCountdown(); setInterval(updateCountdown, 60000);
    $('calendar-button').addEventListener('click', () => {
      const calendar = core.calendar(config);
      if (!calendar) return;
      const url = URL.createObjectURL(new Blob([calendar], {type:'text/calendar;charset=utf-8'}));
      const link = document.createElement('a'); link.href = url; link.download = 'wedding-celebration.ics';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  const venue = config.venue || {};
  if (venue.name) text('venue-name', venue.name);
  if (venue.address) text('venue-address', venue.address);
  for (const field of ['hall','note']) {
    if (venue[field]) { text('venue-' + field, venue[field]); $('venue-' + field).hidden = false; }
  }
  const query = [venue.name,venue.address].filter(Boolean).join(', ');
  const suppliedMap = core.safeLink(venue.mapsUrl);
  const mapLink = suppliedMap || (query ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query) : null);
  if (mapLink) {
    $('directions-button').href = mapLink; $('directions-button').hidden = false;
    $('share-location-button').href = 'https://wa.me/?text=' + encodeURIComponent(
      'Join us for ' + groom + ' & ' + bride + '’s wedding celebration.\n' + query + '\nVenue location: ' + mapLink);
    $('share-location-button').hidden = false; $('venue-pending').hidden = true;
  }
  const suppliedEmbed = core.safeLink(venue.mapEmbedUrl);
  let embedLink = query ? 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&z=16&output=embed' : null;
  if (suppliedEmbed) {
    const embedURL = new URL(suppliedEmbed);
    if (['www.google.com','maps.google.com'].includes(embedURL.hostname) && embedURL.pathname.startsWith('/maps')) embedLink = suppliedEmbed;
  }
  if (embedLink) {
    $('venue-map').src = embedLink; $('venue-map').hidden = false; $('map-pending').hidden = true;
  }
  const contact = config.contact || {};
  const phone = String(contact.phone || '').replace(/[\s()-]/g, '');
  if (/^\+?[0-9]{7,15}$/.test(phone)) {
    $('contact-link').href = 'https://wa.me/' + phone.replace(/^\+/, '');
    $('contact-link').target = '_blank';
    $('contact-link').rel = 'noopener noreferrer';
    text('contact-name', contact.name || 'The groom');
    $('contact-link').hidden = false;
  }

  const configuredPhotos = Array.isArray(album.photos) ? album.photos : [];
  const cacheVersion = Date.now().toString(36);
  const entries = configuredPhotos.map((item,index) => {
    const photo = typeof item === 'string' ? {file:item} : item || {};
    const src = core.photoURL(album.basePath, photo.file, cacheVersion);
    return src ? {src,caption:String(photo.caption || ''),alt:String(photo.alt || 'Pre-shoot photograph ' + (index + 1)),sourceIndex:index} : null;
  }).filter(Boolean);
  const available = new Map();
  let completed = 0, viewerPhotos = [], viewerIndex = 0, touchStart = null;
  const dialog = $('album-dialog'), viewerImage = $('viewer-image');

  function showPhoto(index) {
    if (!viewerPhotos.length) return;
    viewerIndex = (index + viewerPhotos.length) % viewerPhotos.length;
    const photo = viewerPhotos[viewerIndex];
    viewerImage.hidden = true; $('viewer-loading').hidden = false;
    text('viewer-loading', 'Opening photograph…');
    viewerImage.alt = photo.alt;
    text('viewer-caption',photo.caption);
    text('viewer-counter',(viewerIndex + 1) + ' of ' + viewerPhotos.length);
    $('viewer-prev').hidden = viewerPhotos.length < 2; $('viewer-next').hidden = viewerPhotos.length < 2;
    viewerImage.src = photo.src;
    if (viewerImage.complete && viewerImage.naturalWidth) { viewerImage.hidden = false; $('viewer-loading').hidden = true; }
  }
  viewerImage.addEventListener('load', () => { viewerImage.hidden = false; $('viewer-loading').hidden = true; });
  viewerImage.addEventListener('error', () => { viewerImage.hidden = true; text('viewer-loading','This photograph is unavailable. Try the next one.'); $('viewer-loading').hidden = false; });
  function openAlbum(sourceIndex) {
    // Thumbnails load lazily; navigation must still include the whole album.
    viewerPhotos = entries.slice();
    if (!viewerPhotos.length) return;
    const index = viewerPhotos.findIndex(photo => photo.sourceIndex === sourceIndex);
    showPhoto(index < 0 ? 0 : index);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    $('viewer-close').focus();
  }
  $('viewer-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
  $('viewer-prev').addEventListener('click', () => showPhoto(viewerIndex - 1));
  $('viewer-next').addEventListener('click', () => showPhoto(viewerIndex + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(viewerIndex + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(viewerIndex - 1); }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  $('viewer-stage').addEventListener('touchstart', event => {
    if (event.touches.length === 1) touchStart = {x:event.touches[0].clientX,y:event.touches[0].clientY};
  }, {passive:true});
  $('viewer-stage').addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) showPhoto(viewerIndex + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, {passive:true});

  function updateAlbumStatus() {
    const total = available.size;
    $('album-count').hidden = total === 0;
    $('album-hint').hidden = total === 0;
    text('album-count',total + (total === 1 ? ' photograph' : ' photographs'));
    if (completed === entries.length && total === 0) {
      $('album-grid').hidden = true; $('album-empty').hidden = false;
    }
  }
  if (entries.length) {
    $('album-empty').hidden = true; $('album-grid').hidden = false;
    entries.forEach((entry,index) => {
      const figure = document.createElement('figure'), button = document.createElement('button');
      const image = document.createElement('img'), loading = document.createElement('span');
      figure.className = 'photo-card'; button.className = 'photo-button'; button.type = 'button';
      button.disabled = true; button.setAttribute('aria-label','View ' + entry.alt);
      image.alt = entry.alt; image.width = 800; image.height = 1000;
      image.loading = index < 3 ? 'eager' : 'lazy'; image.decoding = 'async';
      loading.className = 'photo-state'; loading.textContent = 'Loading photograph…';
      button.append(image,loading); figure.append(button);
      if (entry.caption) { const caption = document.createElement('figcaption'); caption.className = 'photo-caption'; caption.textContent = entry.caption; figure.append(caption); }
      image.addEventListener('load', () => {
        completed++; available.set(entry.sourceIndex,entry); loading.remove();
        button.disabled = false; button.classList.add('is-loaded'); updateAlbumStatus();
      }, {once:true});
      image.addEventListener('error', () => { completed++; figure.remove(); updateAlbumStatus(); }, {once:true});
      button.addEventListener('click', () => openAlbum(entry.sourceIndex));
      $('album-grid').append(figure); image.src = entry.src;
    });
  }
})();
