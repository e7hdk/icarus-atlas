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
    version: '0.2.1',
    codename: 'The Bound Shores and the City Skies',
    date: '2026-06-28',
    lines: [
      'Every ancient polis at last cast its reflection upon the Lands — two hundred and twenty-one cities, from Boeotian Thebes to distant Colchis, each shore named, sourced, and bound to the map so no tale may speak of a place the atlas does not know.',
      'Homer’s Catalogue of Ships was read into the earth: the seven Boeotian towns and their captains, Phocis and her four spears, Thessaly’s Lapiths and Aenians, the Meropid isles and the Paphlagonian coast — and behind them the whole Trojan muster, Lycia and Phrygia, Thrace and the Halizones of silver Alybe.',
      'The wanderer’s road was charted in full — Ogygia where Calypso kept Odysseus, Thrinacia where Helios’ cattle lowed, the Cyclopes’ isle and Laestrygonian Telepylus, the Lotus-eaters’ shore, and the floating isles of Aeolus who binds the winds.',
      'The six flagship cities opened their skies to every dweller the sources allow: Thebes and Mycenae, Argos and Athens, Sparta and Troy — and at Troy alone two hundred and eighty-six stars wheel together, the whole house of Priam and every ally who fought beneath her walls.',
      'The Argo’s track was sewn in residence and harbour — Lemnos and Chios, Salmydessus and the Strophades, Aea in Colchis and Circe’s Aeaea, Canthus slain in Libya, and the Phaeacian Corcyra where Jason and Medea fled the avenging Colchians.',
      'Corinth received its curse in place — Creon, Glauce, and the children Medea destroyed; Iolcus the usurped throne of Pelias and the return of Jason; Lebadeia the pit of Trophonius, where Agamedes was swallowed and Aristomenes’ shield hung in the dark.',
      'And every myth was tied to its shore at last: the spindle’s tales know their harbours, their sanctuaries and their passes — Gargaphie where Actaeon was torn, Taenarus where Orpheus descended, Thermopylae and Sardinia and Illyria — so story and map may never again speak past one another.',
      'Eight-and-twenty new stars joined the spindle since the last sealing — a hundred and seventy-six myths now told in sourced chapters, with cast and places and the ancient works that witness them.',
    ],
  },
  {
    version: '0.2.0',
    codename: 'The Spindle of Time and the Lands of Men',
    date: '2026-06-19',
    lines: [
      'A third door opened beside the Galaxy and the Lands: the Spindle of Time, where every myth is a thread wound on a turning cylinder of years — and you no longer gaze upon the sky but stand within it, rolling down the long corridor from Chaos to the last homecoming.',
      'Each great cycle winds into its own glowing arm of the spindle — the Cosmos and the house of Cadmus, Perseus and the Labours of Heracles, the Attic cycle of Theseus and the voyage of the Argo, the war at Troy and the long Returns, and Ovid’s ever-changing forms — and the traveller rolls from one to the next, or steps along the arrows of time and across the arms.',
      'Where two myths meet at one moment — a shared hero, a shared shore, the same death told twice — a thread of fate is tied across the gulf between the arms: Theseus raised from the Chair of Forgetfulness, Medea come to Aegeus’ Athens, the murder at Mycenae shadowing Odysseus’ own homecoming.',
      'And when the war was won the captains scattered homeward all at once: from a single moment the homeward roads burst forth and fanned into the dark — Nestor to sandy Pylos and Menelaus by way of Egypt, Diomedes and Idomeneus into exile, Aeneas toward Italy and Odysseus toward Ithaca.',
      'The myths are now told as well as charted: a hundred and forty-eight tales across the cycles, each in sourced chapters with its cast and its places, so a saga may be entered and read, not merely seen from afar.',
      'The second door, the Lands, was charted in full — a hundred and nine regions and their ancient cities, threescore-and-ten royal successions, and three-and-thirty rivers traced from spring to sea — the whole Mediterranean basin drawn as the ancients knew it.',
      'And the map was lit in the same fire as the sky: the sea became a glowing nebula, each region named in its own colour, the shores and the rivers hushed to a soft glow beneath a gentle vignette — that the basin might shimmer like the rest of the cosmos.',
      'The house of Odysseus wheeled into the western sea — Laertes and patient Penelope, the swineherd and the old nurse — and behind them the whole insolent catalogue of suitors who devoured the hall while the king was lost upon the water.',
      'And the lands were set true: Cos and Thera, Cythera and Lesbos and Salamis returned to their right seas; the Strymon and her sisters drawn from bare straight lines into their winding courses; and each shore’s myth bound at last to its ancient source.',
    ],
  },
  {
    version: '0.1.5',
    codename: 'The First Broods and the Muses’ Fire',
    date: '2026-06-14',
    lines: [
      'From the deep beginning the missing broods took fire at last: the one-eyed Cyclopes who forge the thunderbolt and the hundred-handed brothers who pin the Titans down, the Erinyes and the Giants sprung from Heaven’s spilled blood, the ash-tree Meliae, sea-bright Eurybia and the Mountains themselves — the first cosmos made whole.',
      'Night unfolded the last of her children — the death-fates Keres, the tribe of Dreams, the Hesperides who keep the golden apples, tender Philotes and oath-binding Styx — while Strife loosed her grim brood of Toil and Famine, Lies and Ruin, and the Oath that hunts the false-swearer.',
      'Then the gods’ own household gathered: the three Graces and the three Seasons, childbirth’s Eileithyia, rainbow Iris the messenger, Hecate honoured across heaven and earth and sea, and the four who stand at Zeus’s throne — Victory, Zeal, Strength and Force.',
      'And the nine Muses rose, the daughters of Memory, and would not burn in any single colour: each of the Nine wheels slowly through the whole spectrum, the sisters spread across the rainbow so their cluster shimmers in every hue at once — for it is by their fire that all the other stars are lit.',
      'The sky itself was tuned: wedded stars are now drawn into one ring, that consorts may orbit close as a binary, and the whole cosmos breathes a little wider, that every house might be read at a glance.',
    ],
  },
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
