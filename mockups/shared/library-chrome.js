// The shipped AtlasBar with a fifth door, for the Library mockups.
// The Library glyph follows the bar's idiom (18px, thin currentColor
// strokes): three spines of unequal height standing on a shelf, the middle
// one gilt-banded — the door's own shelf in miniature.
(function () {
  const glyphs = {
    galaxy: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3.2 L10.2 7.8 L14.8 9 L10.2 10.2 L9 14.8 L7.8 10.2 L3.2 9 L7.8 7.8 Z" fill="currentColor" fill-opacity="0.9"/><circle cx="14.6" cy="3.6" r="1.1" fill="currentColor" fill-opacity="0.7"/><circle cx="3.4" cy="14.2" r="0.9" fill="currentColor" fill-opacity="0.55"/></svg>',
    lands: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.5 12.5 L6.5 5.5 L9.2 10 L11 7.2 L15.5 12.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.8 15 Q4.5 13.8 6.2 15 Q7.9 16.2 9.6 15 Q11.3 13.8 13 15 Q14.4 16 15.4 15.2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.65"/></svg>',
    myths: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 4.5 H13 M5 13.5 H13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M5 4.5 A1.7 1.7 0 1 0 5 7.9 M13 4.5 A1.7 1.7 0 1 1 13 7.9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M5 7.9 V13.5 M13 7.9 V13.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M7.3 8.6 H10.7 M7.3 11 H10.7" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-opacity="0.7"/></svg>',
    art: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2.5 3.5 H15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5 3.5 V12.2 M9 3.5 V13.4 M13 3.5 V12.2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M3.6 7.2 H14.4 M3.6 9.6 H14.4" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-opacity="0.65"/><path d="M4.2 12.4 H5.8 L6.2 14.6 H3.8 Z M8.2 13.6 H9.8 L10.2 15.8 H7.8 Z M12.2 12.4 H13.8 L14.2 14.6 H11.8 Z" fill="currentColor" fill-opacity="0.8"/></svg>',
    library: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 15.6 H16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><rect x="3.3" y="6" width="2.7" height="9.6" rx="0.5" stroke="currentColor" stroke-width="1.1"/><rect x="7.6" y="3" width="2.7" height="12.6" rx="0.5" stroke="currentColor" stroke-width="1.1"/><rect x="11.9" y="7.4" width="2.7" height="8.2" rx="0.5" stroke="currentColor" stroke-width="1.1"/><path d="M7.6 6.1 H10.3 M7.6 7.3 H10.3" stroke="currentColor" stroke-width="0.9" stroke-opacity="0.75"/></svg>',
  };
  const doors = [
    ['galaxy', 'Galaxy'], ['lands', 'Lands'], ['myths', 'Myths'], ['art', 'Art'], ['library', 'Library'],
  ];
  const wain = '<svg width="16" height="16" viewBox="0 0 18 18" fill="none"><circle cx="3" cy="11" r="1.2" fill="currentColor"/><circle cx="6.5" cy="9.5" r="1.2" fill="currentColor"/><circle cx="9.5" cy="10.5" r="1.1" fill="currentColor"/><circle cx="11" cy="13.5" r="1.1" fill="currentColor"/><circle cx="15" cy="13.8" r="1.1" fill="currentColor"/><circle cx="15.4" cy="10" r="1.1" fill="currentColor"/><path d="M3 11 L6.5 9.5 L9.5 10.5 L11 13.5 L15 13.8 L15.4 10 L9.5 10.5" stroke="currentColor" stroke-width=".7" stroke-opacity=".6"/></svg>';
  const sun = '<svg width="14" height="14" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="3.4" stroke="currentColor" stroke-width="1.3"/><path d="M9 1.8 V4 M9 14 V16.2 M1.8 9 H4 M14 9 H16.2 M3.9 3.9 L5.4 5.4 M12.6 12.6 L14.1 14.1 M3.9 14.1 L5.4 12.6 M12.6 5.4 L14.1 3.9" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>';
  const bar = document.createElement('header');
  bar.className = 'atlasbar';
  bar.innerHTML =
    '<a class="brand" href="#" aria-label="Icarus Atlas — the galaxy"><img src="../src/app/icon.svg" alt=""><b>ICARUS <span style="color:var(--gold)">ATLAS</span></b></a>' +
    '<nav class="doors" aria-label="Doors">' +
    doors.map(([key, label]) => `<a href="#" class="${key === (document.body.dataset.door ?? 'library') ? 'on' : ''}" title="${label}" aria-label="${label}"><span class="g">${glyphs[key]}</span><span class="t">${label.toUpperCase()}</span></a>`).join('') +
    '</nav>' +
    `<div class="chips"><span class="chip round" title="The Odyssey">${wain}</span><span class="chip wide">${sun} 5 NOV · EPHEMERIS</span><span class="chip wide">⌘K</span><span class="chip round">⚙</span></div>`;
  document.body.prepend(bar);
  window.LIBRARY_GLYPH = glyphs.library;
})();
