/** The atlas's own chronicle — each release a stanza, newest first.
 *  Kept in the mythic register of the rest of the app; the version shown in
 *  the settings footer is CHANGELOG[0].version. */

export interface ChangelogEntry {
  version: string;
  /** A short codename for the release, in the app's voice. */
  codename: string;
  /** ISO date the release was sealed. */
  date: string;
  /** Poetic lines — what the sky gained. */
  lines: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.4',
    codename: 'The Monsters and Their Hunter',
    date: '2026-06-14',
    lines: [
      'A dark new quarter opened beneath the disc: from the Sea came Phorcys and Ceto, the stone-gazing Gorgons, and from slain Medusa the winged horse Pegasus and the golden-sword Chrysaor.',
      'Echidna the mother of monsters and storm-born Typhon, who once fought Zeus for heaven, bred the beasts the heroes must unmake — Cerberus and the Hydra, the Chimera and the Nemean Lion — while in the strait lurked Scylla and Charybdis, and on the wind the snatching Harpies and the singing Sirens.',
      'Then came their hunter. Heracles, born of Zeus and Alcmene in a threefold night, strangled Hera’s serpents in his cradle; of Perseid blood through both his parents, he was at once a prince of Mycenae and a son of the god.',
      'Set to twelve labours by Eurystheus, he became the bane of the chthonic brood — the lion, the hydra, the apple-dragon Ladon, the hound of Hades — so the monsters that had hung waiting in the dark at last found their slayer.',
      'And when the poisoned shirt of Nessus burned him upon Oeta, the centaur’s dying revenge, he was taken up to Olympus and wedded to Hebe — the one mortal made a god.',
    ],
  },
  {
    version: '0.1.3',
    codename: 'The Beasts Take the Sky',
    date: '2026-06-14',
    lines: [
      'The house of Cadmus was made whole: Actaeon, torn on Cithaeron by his own hounds, joins his cousins in ruin, and the five Sown Men stand complete where the dragon’s teeth were cast.',
      'Arcadia woke along the highland — Pelasgus the acorn-king, and Lycaon, who set a child’s flesh before Zeus and fled the table on four wolf’s legs, the flood at his heels.',
      'Callisto, Artemis’ huntress, bore a son to Zeus and was driven into a bear’s hide and up among the stars as the Great Bear; her boy Arcas gave the land its name and rose behind her as the Bear-warden.',
      'The goat-god Pan took his place, and the shy Pleiad Maia, who nursed the infant Arcas and gave swift Hermes his mother.',
      'And Atalanta came into her own at last — the babe a she-bear suckled, first spear at the Calydonian boar, outrun only by the suitor who scattered Aphrodite’s golden apples, until the two were made lions.',
    ],
  },
  {
    version: '0.1.2',
    codename: 'The Heroes Muster',
    date: '2026-06-14',
    lines: [
      'The Spartan house wheeled into the Laconian quarter — Tyndareus and Leda, the horse-taming twins Castor and Polydeuces, and at last a father and mother for long-orphaned Helen; below them the Apharetid feud of Idas, who once drew his bow against Apollo, and far-seeing Lynceus.',
      'The line of Aeacus rose, the Greek spine of the war to come — Peleus and silver-footed Thetis, and of them Achilles; Telamonian Ajax behind his tower of shield; Patroclus, and the just centaur Chiron who reared the heroes he would mourn.',
      'The Aetolian house kindled around Calydon — Oeneus who took the first vine from Dionysus, the white-tusked boar that slighted Artemis loosed upon his fields, Meleager and the brand his own mother fed to the fire, the swift huntress Atalanta, and Diomedes, the mortal who wounded two gods at Troy.',
      'And the rivers themselves took a star: Achelous, foremost of waters, who wrestled Heracles for a bride and left his horn behind to brim with plenty.',
      'House was bound to house — one father, Thestius, claimed for both Althaea of Calydon and Leda of Sparta, so that the boar-hunters and the Tyndarids share a single blood.',
    ],
  },
  {
    version: '0.1.1',
    codename: 'The Houses Gather',
    date: '2026-06-12',
    lines: [
      'The House of Aeolus kindled along the outer arm — seven-and-forty stars from a single Thessalian king: the Argonauts’ Iolcus, Corinthian Sisyphus at his ever-falling stone, the golden ram, and Bellerophon astride the wind.',
      'The Athenian royal house took its place, from serpent-bodied Cecrops who witnessed Athena’s olive down to Theseus and the slain Minotaur.',
      'Every new star now burns with three lights: the poets’ sourced telling, an encyclopedia’s plain record, and a gallery of the art it kindled across the ages.',
      'Athens found its ground on the map — its kings ranked in succession, its dwellers gathered into a sky of their own.',
      'And the sky learned to count itself: the settings now keep a tally of every star that hangs in the dark.',
    ],
  },
  {
    version: '0.1.0',
    codename: 'First Light',
    date: '2026-06-11',
    lines: [
      'The first sky was struck from the dark — Chaos at the centre, the primordials in close orbit, the Titans on their ember ring, the Olympians on a band of gold, and the Night Court wheeling below.',
      'Every figure became a star, glowing by its nature; every bond a thread of light drawn between them.',
      'The source lens was lit, that the whole sky might re-shape itself according to Hesiod, or Homer, or any of seven ancient hands — for the tellers never did agree, and the disagreement is the point.',
    ],
  },
];

/** The live version, shown in the settings footer. */
export const APP_VERSION = CHANGELOG[0].version;
