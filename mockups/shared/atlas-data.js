/* Shared mockup engine: character data, source-lens logic, hover cards, fly-to travel.
   Each theme HTML provides the chrome (CSS + card template); this file provides behavior. */

const AtlasMockup = (() => {
  const TYPES = ['primordial', 'titan', 'olympian', 'god', 'hero', 'nymph', 'creature'];

  const LENS_NAMES = { hesiod: 'Hesiod', homer: 'Homer', consensus: 'Consensus' };

  const CHARACTERS = {
    chaos: {
      name: 'Chaos', greek: 'Χάος', type: 'primordial', pos: [47, 52], size: 11,
      domains: 'The Void',
      summary: 'The yawning void that was first of all things; from Chaos came Gaia, Tartarus, Erebus and Nyx.',
      bonds: [],
    },
    gaia: {
      name: 'Gaia', greek: 'Γαῖα', type: 'primordial', pos: [53, 31], size: 9,
      domains: 'Earth · Motherhood',
      summary: 'The Earth herself, mother and ground of all; she bore Uranus to cover her and the Titans to succeed him.',
      bonds: [
        { to: 'chaos', label: 'born after Chaos' },
        { to: 'uranus', label: 'consort & son' },
        { to: 'cronus', label: 'child' },
        { to: 'oceanus', label: 'child' },
      ],
    },
    uranus: {
      name: 'Uranus', greek: 'Οὐρανός', type: 'primordial', pos: [60, 58], size: 9,
      domains: 'Sky',
      summary: 'The starry sky, first lord of the cosmos; maimed by his son Cronus at Gaia’s urging.',
      bonds: [
        { to: 'gaia', label: 'consort' },
        { to: 'cronus', label: 'child & usurper' },
        { to: 'aphrodite', label: 'born of his foam', source: 'hesiod' },
      ],
    },
    nyx: {
      name: 'Nyx', greek: 'Νύξ', type: 'primordial', pos: [36, 64], size: 8,
      domains: 'Night',
      summary: 'Night, born of Chaos; a power so old that even Zeus is wary of crossing her.',
      bonds: [{ to: 'chaos', label: 'parent' }],
    },
    cronus: {
      name: 'Cronus', greek: 'Κρόνος', type: 'titan', pos: [27, 44], size: 9,
      domains: 'Time · Harvest',
      summary: 'Youngest Titan, who unmanned his father and devoured his children, until Zeus made him disgorge them.',
      bonds: [
        { to: 'uranus', label: 'father' },
        { to: 'gaia', label: 'mother' },
        { to: 'rhea', label: 'consort' },
        { to: 'zeus', label: 'child' },
        { to: 'poseidon', label: 'child' },
        { to: 'hades', label: 'child' },
      ],
    },
    rhea: {
      name: 'Rhea', greek: 'Ῥέα', type: 'titan', pos: [22, 60], size: 8,
      domains: 'Motherhood',
      summary: 'Titaness of motherhood, who saved the infant Zeus from Cronus’ jaws with a swaddled stone.',
      bonds: [
        { to: 'cronus', label: 'consort' },
        { to: 'zeus', label: 'child' },
        { to: 'hera', label: 'child' },
      ],
    },
    prometheus: {
      name: 'Prometheus', greek: 'Προμηθεύς', type: 'titan', pos: [33, 80], size: 8,
      domains: 'Fire · Forethought',
      summary: 'The fore-thinker who stole fire for mankind and paid for it chained to a peak of the Caucasus.',
      bonds: [{ to: 'zeus', label: 'defied' }],
    },
    oceanus: {
      name: 'Oceanus', greek: 'Ὠκεανός', type: 'titan', pos: [68, 76], size: 9,
      domains: 'The Great River',
      summary: 'The world-encircling river, eldest of the Titans, who kept apart from the war against Zeus.',
      bonds: [
        { to: 'uranus', label: 'father' },
        { to: 'gaia', label: 'mother' },
      ],
    },
    zeus: {
      name: 'Zeus', greek: 'Ζεύς', type: 'olympian', pos: [14, 22], size: 12,
      domains: 'Sky · Thunder · Kingship',
      summary: 'King of the gods, lord of sky and thunder, who overthrew Cronus and divided the world with his brothers.',
      bonds: [
        { to: 'cronus', label: 'father' },
        { to: 'rhea', label: 'mother' },
        { to: 'hera', label: 'consort' },
        { to: 'athena', label: 'daughter' },
        { to: 'aphrodite', label: 'daughter', source: 'homer' },
      ],
    },
    hera: {
      name: 'Hera', greek: 'Ἥρα', type: 'olympian', pos: [26, 12], size: 9,
      domains: 'Marriage · Queenship',
      summary: 'Queen of Olympus, goddess of marriage; implacable toward Zeus’ lovers and their children.',
      bonds: [
        { to: 'zeus', label: 'consort' },
        { to: 'cronus', label: 'father' },
        { to: 'rhea', label: 'mother' },
      ],
    },
    poseidon: {
      name: 'Poseidon', greek: 'Ποσειδῶν', type: 'olympian', pos: [42, 16], size: 10,
      domains: 'Sea · Earthquakes · Horses',
      summary: 'Earth-shaker and lord of the sea, who won the waters when the three brothers cast lots for the world.',
      bonds: [
        { to: 'cronus', label: 'father' },
        { to: 'rhea', label: 'mother' },
        { to: 'zeus', label: 'brother' },
      ],
    },
    athena: {
      name: 'Athena', greek: 'Ἀθηνᾶ', type: 'olympian', pos: [57, 10], size: 9,
      domains: 'Wisdom · War · Craft',
      summary: 'Goddess of wisdom and disciplined war, sprung fully armed from the head of Zeus.',
      bonds: [{ to: 'zeus', label: 'father' }],
    },
    aphrodite: {
      name: 'Aphrodite', greek: 'Ἀφροδίτη', type: 'olympian', pos: [63, 36], size: 11,
      domains: 'Love · Beauty · Desire',
      summary: 'Goddess of love, beauty and desire — whose very birth the poets cannot agree on.',
      bySource: {
        hesiod: 'Risen from the sea-foam that gathered about the sundered flesh of Uranus, she came ashore at Cythera. (Theogony 188–206)',
        homer: 'Daughter of Zeus and Dione, who fled wounded from Diomedes to her mother’s arms. (Iliad 5.370)',
      },
      variant: {
        hesiod: 'Two traditions — under Homer’s lens she is the daughter of Zeus and Dione.',
        homer: 'Two traditions — under Hesiod’s lens she rose from the sea-foam of Uranus.',
        consensus: 'Two traditions recorded: Hesiod (sea-foam of Uranus) and Homer (daughter of Zeus and Dione).',
      },
      bonds: [
        { to: 'uranus', label: 'parent', source: 'hesiod' },
        { to: 'zeus', label: 'father', source: 'homer' },
      ],
    },
    hades: {
      name: 'Hades', greek: 'ᾍδης', type: 'god', pos: [9, 72], size: 9,
      domains: 'The Underworld · The Dead',
      summary: 'Unseen lord of the dead, who won the underworld when the brothers cast lots; husband of Persephone.',
      bonds: [
        { to: 'cronus', label: 'father' },
        { to: 'rhea', label: 'mother' },
        { to: 'persephone', label: 'consort' },
      ],
    },
    persephone: {
      name: 'Persephone', greek: 'Περσεφόνη', type: 'god', pos: [17, 86], size: 8,
      domains: 'Spring · The Underworld',
      summary: 'Queen of the underworld for the months she dwells below, and the returning spring for the months above.',
      bonds: [
        { to: 'zeus', label: 'father' },
        { to: 'hades', label: 'consort' },
      ],
    },
  };

  let cfg = null;
  let lens = 'hesiod';
  let pinnedId = null;
  let traveling = false;

  const $ = (sel) => document.querySelector(sel);

  function visibleBonds(char) {
    return char.bonds.filter((b) => !b.source || b.source === lens || lens === 'consensus');
  }

  function drawLines(charId) {
    const svg = $('#lines');
    svg.innerHTML = '';
    if (!charId) return;
    const char = CHARACTERS[charId];
    for (const b of visibleBonds(char)) {
      const target = CHARACTERS[b.to];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', char.pos[0]);
      line.setAttribute('y1', char.pos[1]);
      line.setAttribute('x2', target.pos[0]);
      line.setAttribute('y2', target.pos[1]);
      line.setAttribute('stroke', cfg.lineAccent);
      line.setAttribute('stroke-width', b.source ? 0.3 : 0.22);
      if (b.source && lens === 'consensus' && b.source !== 'hesiod') {
        line.setAttribute('stroke-dasharray', '1.1 1.5');
      }
      line.setAttribute('opacity', b.source ? 0.85 : 0.4);
      svg.appendChild(line);
    }
  }

  function showCard(charId) {
    const char = CHARACTERS[charId];
    const vm = {
      name: char.name,
      greek: char.greek,
      type: char.type,
      domains: char.domains,
      summary: (char.bySource && char.bySource[lens]) || char.summary,
      variantNote: char.variant ? char.variant[lens] : '',
      bonds: visibleBonds(char).map((b) => ({ name: CHARACTERS[b.to].name, label: b.label + (b.source ? ' · ' + LENS_NAMES[b.source] : '') })),
      travelHint: traveling && pinnedId === charId ? (cfg.hereHint || 'You have arrived') : (cfg.travelHint || 'Click to travel →'),
    };
    const card = $('#card');
    card.innerHTML = cfg.cardTemplate(vm);
    card.classList.add('visible');
  }

  function hideCard() {
    $('#card').classList.remove('visible');
    drawLines(null);
  }

  function travelTo(charId) {
    const [x, y] = CHARACTERS[charId].pos;
    const k = cfg.travelScale || 2.3;
    $('#world').style.transform = `translate(${-k * (x - 50)}%, ${-k * (y - 50)}%) scale(${k})`;
    traveling = true;
    $('#back').classList.add('visible');
  }

  function resetView() {
    $('#world').style.transform = 'none';
    traveling = false;
    pinnedId = null;
    $('#back').classList.remove('visible');
    document.querySelectorAll('.star.selected').forEach((s) => s.classList.remove('selected'));
    hideCard();
  }

  function buildStars() {
    const wrap = $('#stars');
    for (const [id, char] of Object.entries(CHARACTERS)) {
      const el = document.createElement('div');
      el.className = 'star';
      el.dataset.id = id;
      el.style.left = char.pos[0] + '%';
      el.style.top = char.pos[1] + '%';
      el.style.width = char.size + 'px';
      el.style.height = char.size + 'px';
      el.style.setProperty('--c', cfg.typeColorVar(char.type));
      el.innerHTML = `<span>${char.name}</span>`;
      el.addEventListener('mouseenter', () => { if (!pinnedId) { showCard(id); drawLines(id); } });
      el.addEventListener('mouseleave', () => { if (!pinnedId) hideCard(); });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.star.selected').forEach((s) => s.classList.remove('selected'));
        el.classList.add('selected');
        pinnedId = id;
        travelTo(id);
        showCard(id);
        drawLines(id);
      });
      wrap.appendChild(el);
    }
  }

  function buildLegend() {
    const legend = $('#legend');
    legend.innerHTML = TYPES.map((t) => cfg.legendItem(t, cfg.typeColorVar(t))).join('');
  }

  function bindLens() {
    document.querySelectorAll('#lens button').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#lens button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        lens = btn.dataset.lens;
        const active = pinnedId;
        if (active) { showCard(active); drawLines(active); }
      });
    });
  }

  function init(config) {
    cfg = Object.assign({
      legendItem: (t, c) => `<span><b style="color:${c};background:${c}"></b>${t.toUpperCase()}</span>`,
      lineAccent: '#d9b65c',
    }, config);
    buildStars();
    buildLegend();
    bindLens();
    $('#back').addEventListener('click', resetView);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') resetView(); });
  }

  return { init, CHARACTERS, TYPES };
})();
