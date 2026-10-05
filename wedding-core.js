(function (root) {
  'use strict';
  function eventDate(config, time) {
    const date = String(config.date || '');
    const clock = String(time || config.startTime || '');
    const offset = String(config.timezoneOffset || '+05:30');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(clock)
      || !/^[+-](0\d|1[0-4]):[0-5]\d$/.test(offset)) return null;
    const parts = date.split('-').map(Number);
    const check = new Date(date + 'T00:00:00Z');
    if (!Number.isFinite(check.getTime()) || check.getUTCFullYear() !== parts[0]
      || check.getUTCMonth() + 1 !== parts[1] || check.getUTCDate() !== parts[2]) return null;
    const value = new Date(date + 'T' + clock + ':00' + offset);
    return Number.isFinite(value.getTime()) ? value : null;
  }

  function safeLink(value) {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
    } catch (_) { return null; }
  }

  function photoURL(base, filename, version) {
    if (typeof filename !== 'string' || !filename.trim()) return null;
    let path = filename.trim();
    if (/^https:/i.test(path)) {
      const link = safeLink(path);
      if (!link) return null;
      const url = new URL(link);
      url.searchParams.set('v', String(version));
      return url.href;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('/') || path.includes('\\')) return null;
    const queryAt = path.indexOf('?');
    const query = queryAt >= 0 ? path.slice(queryAt + 1) : '';
    path = queryAt >= 0 ? path.slice(0, queryAt) : path;
    try { path = decodeURIComponent(path); } catch (_) { return null; }
    if (path.split('/').some(part => part === '..' || part === '.' || !part)
      || !/\.(jpe?g|png|webp|avif|gif)$/i.test(path)) return null;
    const prefix = String(base || './album/');
    if (/^[a-z][a-z0-9+.-]*:/i.test(prefix) && !safeLink(prefix)) return null;
    if (prefix.startsWith('//') || prefix.includes('\\')) return null;
    const params = new URLSearchParams(query);
    params.set('v', String(version));
    return prefix.replace(/\/?$/, '/') + path.split('/').map(encodeURIComponent).join('/') + '?' + params;
  }

  function calendar(config) {
    const start = eventDate(config);
    if (!start) return null;
    let end = config.endTime ? eventDate(config, config.endTime) : null;
    if (end && end <= start) end = new Date(end.getTime() + 86400000);
    const stamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const escape = value => String(value || '').replace(/\\/g, '\\\\')
      .replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
    const venue = config.venue || {};
    const fold = line => {
      let result = '', width = 0;
      for (const char of line) {
        const bytes = new TextEncoder().encode(char).length;
        if (width + bytes > 74) { result += '\r\n '; width = 1; }
        result += char; width += bytes;
      }
      return result;
    };
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//EN',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:wedding-' + config.date + '@invitation.local', 'DTSTAMP:' + stamp(new Date()),
      'DTSTART:' + stamp(start), ...(end ? ['DTEND:' + stamp(end)] : []),
      'SUMMARY:' + escape((config.groom || 'Groom') + ' & ' + (config.bride || 'Bride')),
      'LOCATION:' + escape([venue.name, venue.address].filter(Boolean).join(', ')),
      'DESCRIPTION:' + escape(config.eventTitle || 'Wedding Celebration'),
      'END:VEVENT', 'END:VCALENDAR', ''
    ].map(fold).join('\r\n');
  }
  const api = {eventDate, safeLink, photoURL, calendar};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.WeddingCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
