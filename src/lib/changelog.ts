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
    version: '0.8.0',
    codename: 'The Other Tongues',
    date: '2026-11-14',
    lines: [
      'The books can be read in German as well as English. Voß’s Iliad and Odyssey, Peppmüller’s Theogony and Suchier’s Metamorphoses were made line for line against the Greek and the Latin, and now each German line faces the line it renders, laid beside it where their editions print no numbers. A caret on the language switch opens the translations, each named in its own tongue with its translator. A work with no free German offers it faint, and keeps its English.',
      'The Theogony is the first book in Turkish, and the atlas’s own: Hesiod’s thousand and forty-two lines put into Turkish from the Greek, a line for every line, from the Muses of Helicon to the women the Muses are bidden to sing at the end. It is a draft, and says so, until it has been read through.',
    ],
  },
  {
    version: '0.7.0',
    codename: 'The Book of Night',
    date: '2026-11-10',
    lines: [
      'The reading room was bound as a book. A work now opens on its cover, boards the colour of the night sky with its title cut in gold, and the cover swings over on its spine. The original lies on the left page and its English on the right, each passage beginning at the same height on both, so the English always faces the Greek or the Latin it renders. On a phone a page holds a stretch of the original and, under it, the English of that stretch.',
      'The leaves turn: with the arrow keys, with a click on the edge of a page, where the leaf first lifts under the pointer, with a drag that carries it, or with a swipe; a leap across the book riffles its leaves. The pages are night and bear no stars, so that no accent of the Greek is taken for one, and gold keeps to the fore-edge, the page numbers and the thread in the gutter.',
      'Under the book runs its fore-edge, a bar for every passage, taller where more of the atlas rests on it, and the margin follows the open pages and the passage the reader touches. A footnote still opens its passage: the book falls open on the page that holds it, and the lines glow once. The book keeps the reader’s place, and the language they chose goes with them from work to work.',
    ],
  },
  {
    version: '0.6.5',
    codename: 'The Tear Rewoven',
    date: '2026-11-08',
    lines: [
      'The Loom’s tear, the nine centuries between antiquity and the Renaissance where the cloth held eleven works, now holds a hundred and nine. The myths never stopped being drawn: Carolingian painters copied Perseus and Andromeda into their star books, and al-Sufi drew Cassiopeia as the lady of the chair. Crusader painters at Acre set Achilles’ spear in Hector’s back, Byzantine carvers put Europa’s bull on ivory caskets, and a Rouen illuminator gave Ovid’s whole poem its pictures, down to Scylla bringing Minos her father’s head where Ovid has only a lock of his hair.',
      'Dante’s first painters are here too, with Cerberus as a winged demon, the Minotaur as a centaur, and Ulysses and Diomedes burning in one flame, and Electra stands with Hector and Aeneas among the great spirits of Limbo.',
    ],
  },
  {
    version: '0.6.4',
    codename: 'The Shelves Swept',
    date: '2026-11-08',
    lines: [
      'The Legacy shelves keep only what came after the myths. Twelve hundred cards had stood there that were never their afterlife: links back to a figure’s own entry, to a father or a town, to the Iliad and the Metamorphoses themselves, and dates that were no dates at all. They are gone, and a figure who has no afterlife yet keeps an honest empty page.',
      'The words stay, and a few that were filed as works join them: the cornucopia of Amalthea’s horn, the rod of Asclepius on every ambulance, the polyp Linnaeus named Hydra in 1758, the mentor and the pander, and Teucer, whom Pontevedra calls its founder.',
    ],
  },
  {
    version: '0.6.3',
    codename: 'The Muster Read Again',
    date: '2026-11-06',
    lines: [
      'Every citation was read against the lines it names, and a thousand that did not name their figure were set right or found sound. Thirty-four daughters of Danaus no longer claim Hyginus, whose roll of the brides gives fifty other names; men who are not in Apollodorus’ roll of the Argonauts no longer sail in it; and Odysseus’ parents, Telemachus on his mother’s lap and the suitors’ oath are found where the Epitome and the Library tell them.',
      'Aulis keeps only the men who sailed from it. Forty-one figures had been mustered there by their sons’ names: Aegeus and Theseus, Meleager and Althaea, the twin Moliones whom Heracles slew, a boy too young to command, and the allies of Troy. They have gone home, and the captains who sailed cite the lines of each teller that name them. The allies’ fathers no longer stand at Troy.',
      'Two warriors misread in the English of the Iliad take back their Greek names: Amphion, who led the Epeians beside Meges, and Amphius son of Merops, on whom Homer and Apollodorus never disagreed. A Dardanian captain “Theanus” was never there at all. Apollodorus wrote that Archelochus and Acamas were sons of Antenor and Theano, and the ghost has left the sky. Homer’s two men called Areilycus are two stars again: the Boeotian father of Prothoënor, and the Trojan whom Patroclus speared through the thigh.',
      'The Library links a hundred and ten more of the translators’ own spellings, from Murray’s Hecabe to Pausanias’ Ogygus, and Hesiod’s children of Strife answer to Evelyn-White’s English: Toil and Famine, Battles and Murders, Lawlessness and Ruin.',
    ],
  },
  {
    version: '0.6.2',
    codename: 'The Star Myths in Latin',
    date: '2026-11-06',
    lines: [
      'Seaton’s Argonautica now finds its stars under his own names: Cypris and Cytherea are Aphrodite, Enyalius is Ares, Brimo is Hecate and Cronos is Cronus, and Augeias, Meleagrus, Erytus, Cheiron and Eidyia are found where the lines are about them. Fifty-five names in the four books, plain until now, open their figures.',
      'Hyginus’ Astronomica can be read at last: the book of the star myths in Bunte’s Latin of 1875, its hundred and twenty-seven sections each beside Mary Grant’s English, from the Great Bear to the Milky Way. Thirty-four slips in the copy online were set right against Bunte’s own pages, and Jove and Father Liber are stars wherever Grant names them.',
      'The Fabulae can be read whole in Grant’s English, from the Genealogy of the first gods to the last fable, its names linked as the Astronomica’s are; their Latin waits for an edition free to set beside them. A fable cited whole now reaches all its parts, so the Argonauts of the fourteenth stand in its margin.',
      'Some of the crew were set right against the texts. The Asterius of Piresia is the son of Cometes, Amphion came from Pellene in Achaea and not from Macedonian Pella, Eribotes dies in Libya only in Hyginus, and a Deucalion of Pella whom no teller names has left the sky: Hyginus’ Argonaut Deucalion is Minos’ son, of Crete.',
    ],
  },
  {
    version: '0.6.1',
    codename: 'The Argo in English',
    date: '2026-11-06',
    lines: [
      'The Argonautica found its English. Seaton’s translation of 1912 now runs beside Mooney’s Greek in the Library, all four books of the voyage, from the public-domain text of Project Gutenberg, each paragraph set against the line of the Greek where it begins.',
      'Three of those beginnings had been misprinted in the copy the atlas first read, and the Greek set them right: Zetes and Calais join the crew at line 211 of the first book, not 221; Jason answers Argus at 3.484; Medea leaves the city’s paved streets for Hecate’s shrine at 3.887. The Ilissus, which had taken its line from the first misprint, now cites the lines that name it.',
      'On a figure’s page the list of tellers no longer hides behind the column it opens from: it opens over the page, whole and clear, and follows its button as the page scrolls.',
    ],
  },
  {
    version: '0.6.0',
    codename: 'The Library and the First Quarrel',
    date: '2026-11-06',
    lines: [
      'A fifth door opened, and behind it the Library: the eleven works of the seven tellers on one shelf in time, Homer and Hesiod at its left edge, the centuries between Hesiod and Apollonius left empty and labelled so, and the handbooks of the Roman age at its right. Each spine stands as tall as its work is long and is gilt as far as the atlas cites it, and beneath the shelf the sagas run as threads through the works that tell them.',
      'Every work can now be read, the Greek or the Latin line by line beside its English, ninety-one pages from the pinned editions, numbered in the original’s own count. And every footnote of the atlas, on a figure’s page, a story, a city, the galaxy’s card, the day’s star, the Proem, the voyage and a Pattern of the Loom, opens its passage there with the lines lit, wherever the Library holds it.',
      'Beside the text runs a margin: for the lines being read, the figures whose facts rest on them, the stories and the lines in the sky, the works on the Loom, and the quarrels they take a side in. In the English each name is a star, linked only where the passage is about that figure, so the war-goddess Enyo is never taken for her namesake among the Graeae.',
      'The quarrels became pages, one hundred and eighty-nine places where the tellers contradict each other, each claim set beside its teller’s own words in the original and in English, under the Muses’ warning that they know how to speak many false things as though they were true. Three quarrels written down twice were made one, and their claims read again in the texts.',
      'And the Theogony was given the sky. As the poem is scrolled, the dark galaxy lights each figure in the order Hesiod sings it, two hundred and thirty-two in eighteen beats, and draws each line of descent as he gives it; at the end the lens turns to Homer, the stars he never names sink back, and Aphrodite’s line leaves the foam of Uranus for Zeus and Dione.',
      'The galaxy learned to change its mind slowly: when the lens turns, a bond now fades out as the next fades in, instead of snapping. A search for “Il. 5.370” opens the passage itself, and the atlas wrote out its first map of pages for the engines that read it.',
    ],
  },
  {
    version: '0.5.0',
    codename: 'The Room Inside the Loom',
    date: '2026-11-04',
    lines: [
      'The Loom became a room. On a wide screen the cloth still hangs flat at first, every work in its place, and then it curls round whoever steps inside: the sagas go round the walls in the order of the Spindle, the centuries fall from the gold beam overhead to the clay weights by the floor, and the tear runs round the room as a ring mended in gold, with the night showing through it. A coffered dome, open at its eye, closes it above, and a dark floor holds its reflection.',
      'Inside, the visitor stands at the centre and turns, and the whole collection goes round them. Under the view a lens narrows from sixty degrees to fourteen to bring the far wall near, and one may stand back across the room instead.',
      'As the visitor turns, each work weaves its own image from Commons into the cloth, cut where the cloth first cut it, so the wall sharpens in place and stays sharp when they look away and back.',
      'A work pulled from the wall comes to the visitor with its neighbours along each thread, and their threads cross the air of the room; a Pattern’s gold thread runs across it from stop to stop; and turning the cloth steps out through the wall to its back, where every thread is wound round the drum.',
      'The cloth was woven wider for the room, eighty-eight works across and twenty-six rows down, so that closed it stands about as tall as it is wide. On the small screen it hangs as it did.',
    ],
  },
  {
    version: '0.4.0',
    codename: 'The Loom and the Gold Thread',
    date: '2026-11-03',
    lines: [
      'A fourth door opened beside the Galaxy, the Lands and the Myths, and behind it hangs the Loom: every image of the myths the atlas holds, one thousand six hundred and ninety-eight works from the gold mask of Mycenae to the painters of the last century, woven into a single cloth. Across it run the myths in the Spindle’s order and colours; down it run the centuries in which hands made them, oldest at the beam, as a Greek loom was woven from the top with its clay weights hanging below.',
      'Where the collection thins, in the thousand years between AD 500 and 1400, the cloth is torn and mended in gold, and the mending says plainly that what is missing is ours to gather, not art that was never made.',
      'Through the cloth run five hundred and sixty-two threads, one for every figure seen in two works or more. Pull a work and it rises out of the weave with its nearest neighbours along each thread; turn the cloth and its back is Arachne’s web, every stitch drawn at once, brightest where a figure crosses the tear.',
      'Six gold threads follow one gesture through the centuries: Arachne’s first scene, arms becoming branches, the carried body, the fall, the monster slain and the judgement of Paris. Each stop names the teller or the evidence that vouches for it, and resemblance is never passed off as descent.',
      'On the small screen the cloth hangs tall and scrolls down through time. A tap gathers a work’s web into the middle of the screen, earlier works above and later ones below, and a sheet beneath carries its threads.',
      'Every image across the atlas now carries its credit from Commons: the author, the license and the page that keeps it. The debt to those who photographed these works and set them free is paid in the open.',
      'And the doors were joined. A figure’s gallery and a myth’s centuries lead onto the Loom; the Spindle counts the works woven for each tale; the day’s artwork opens on its plate; and any single painting can be sent on its own.',
      'The atlas grew lighter on the way: its first page, which once carried three and a half megabytes of text, now carries thirty kilobytes, and each star’s prose arrives only when it is opened.',
    ],
  },
  {
    version: '0.3.1',
    codename: 'The Firmament and the Steady Hand',
    date: '2026-08-01',
    lines: [
      'The galaxy was given a sky to hang in. Ptolemy’s eight-and-forty figures now stand around it on a true celestial sphere — five hundred and fifty-four stars, each at the right ascension and declination the catalogues record, joined by the very lines the ancients drew, so the Wain looks like the Wain and the Swan falls down the Milky Way as it always has.',
      'And the sky was made honest. The ancients set whole figures among the stars — Callisto turned bear, the lyre the Muses carried up, the ship shown only from mast to stern — but they never named a character to each star, and the atlas will not pretend they did. Two claims are kept apart and both are cited: what a constellation IS, and which myth merely looks up and names it. Odysseus steers by the Bear; he is not the Bear.',
      'Where the sources do go star by star, the atlas follows them there — the seven daughters of Atlas in the shoulder of the Bull, Alcyone to Merope, each sister her own light; and the Twins, whose two bright stars have carried Castor and Pollux since antiquity.',
      'The twelve signs were filled from Hyginus’ own hand: the ram of the golden fleece, the bull that swam to Crete, the crab that snapped at Hercules in the swamp and was rewarded by Juno for its one moment of service; Justice who left the world when the ages turned; the goat-fish who threw panic among the Titans; and the two fishes that were Venus and her son, fleeing Typhon into the Euphrates. Where the tellers disagree — who pours the water, whether the Archer is a Centaur at all — the disagreement is printed, not resolved.',
      'Every figure was given a page of its own, as characters and cities and myths have: its plate engraved from the catalogue, how it came to the sky, the myths that raise their eyes to it, its stars listed by magnitude, and beneath all of it the testimony.',
      'Then the atlas turned to the hand that holds it. On the small screen the stars gave up their thousand separate labels for a single painted overlay, the pointer learned to wait for a true tap instead of chasing every drift of a thumb, and the instance matrices stopped crossing the bus each frame — the same sky, the same light, arriving steady.',
      'The Legacy nearly doubled while the sky was being built: eight hundred and thirty-five figures now carry their afterlife — two thousand and sixty-two artworks, three hundred and thirty-six films, two hundred and forty-eight works of music and fifteen hundred and sixty-four echoes in the speech of the living — and the neutral record grew to one thousand one hundred and ninety-seven entries.',
      'The festival year more than doubled: two-and-forty feasts now pinned to the reconstructed Attic moon, from the Apatouria where the phratries counted their sons to the Isthmian games, the Brauronia and the Chalkeia and the Genesia of the dead.',
      'The Oracle was taught not to test what the tellers dispute, nor to offer as false a myth the figure truly walks in — Athena stands on the Argo’s deck, and the riddle will not deny it — and whoever names the star of the day is now offered the questions first.',
      'And the forge learned what it need not repeat: the linked prose no longer rebakes the whole catalogue because one new name joined the sky, and the scan that binds names to prose was taught to look only where a name can begin. What took thirteen minutes now takes less than a second.',
    ],
  },
  {
    version: '0.3.0',
    codename: 'The Daily Sky and the Voyage Home',
    date: '2026-07-18',
    lines: [
      'The atlas learned to keep its own calendar: at every Athens-midnight a star of the day is dealt from a deterministic sky — five hundred and two souls in the cycle, no name repeated until all have burned — and the chosen star opens not a page but a Proem, a five-beat telling staged within the galaxy itself, with a Sphinx’s riddle for those who would earn the name.',
      'Nineteen ancient festivals were pinned to a reconstructed Attic moon, Lenaia in her true lunar seat, and a Heortologion was raised at its own quiet door — the sacred days of each month waiting beneath the reckoned calendar, real time and mythic time bound at last.',
      'The Legacy widened from paintings alone to the whole afterlife of myth: shelves for the screen, for music and the stage, for the games and speech of the living — nine hundred and eighty-seven artworks, a hundred and forty-three films, seven-and-seventy works of music and four hundred and thirty echoes in play across four hundred and fifty-seven figures — and every one of the hundred and seventy-six myths was given its own gallery of the centuries.',
      'The Lands took on true relief — the mountains’ shadow baked from the raw elevation of the earth into the basemap, so Taygetus and Ida and Parnassus stand up from the map as they stand against the Aegean light.',
      'And then the great door: NOSTOS, the Odyssey told as a voyage — three movements and twenty stations across a star-sea drifting in two depths, each part of the poem a new country under a new colour of sky, each station a landfall, and every epigraph the poem’s own words in Greek and in Murray’s English, drawn verbatim from the pinned corpus with the line that proves them.',
      'Six of the poem’s most human moments hold the scroll itself still — the invocation and Calypso’s refusal, the House of the Dead and the Sirens’ song, the dog who waited and the gentle death from the sea — the world dimming behind a veil while the lines surface one by one, song-rings rippling where the singers wait, cold light rising where the dead drink.',
      'Penelope’s thread hangs at the page’s left hand as true yarn: a waving strand that weaves itself forward as the reader sails and comes undone when they turn back, twenty knots for twenty stations, each knot a door, the whole roll of names kindling at a touch — and the thread never breaks, even in the dark.',
      'The voyage found its voice: four moods of sea-music crossfade as the reading line crosses each station — open water, storm, hearth, and the Sirens’ own song — the storm breaking at Scylla, the fire crackling on Ithaca, while the atlas’s older score stands aside until the traveller returns.',
      'Two long-waiting figures took the sky at last — Mentor, whose face Athena wears, and Argos the hound, first of a new kind, who knew his king in the twentieth year — while Ino was given her sea-name Leucothea; and along the stations were hung the centuries themselves, from the Eleusis amphora to Turner’s burning dawn.',
      'And the moment was given its doors: the Wain rides the masthead at the day-star’s left hand, as Calypso instructed; this week’s sky tells the Odyssey day by day; the codex offers the voyage in gold; and the atlas casts a proper shadow abroad at last — a card of the star-sea for every hearth the link may reach.',
    ],
  },
  {
    version: '0.2.2',
    codename: 'The Named Dwellings and the Incremental Forge',
    date: '2026-06-29',
    lines: [
      'At last every residence upon the map carries its witness — two thousand three hundred and twenty-nine dwellings cited to the ancient line, each star’s sojourn in a polis bound to the very passage that names it, so the lens may never show a home without the scroll that proves it.',
      'Five figures alone keep their citation in the story alone — a Same-roll suitor at Dulichium, a prophetess at Argos who never sat the throne, and at Troy a river, a nymph of Ida, and a prince the Catalogue never called by name — for some truths live only in the prose, and the atlas will not pretend otherwise.',
      'The Odyssey’s western islands were sealed in turn — Dulichium and Same, Zacynthus and long-suffering Ithaca, every insolent suitor and every dual-catalogue wanderer given the roll that belongs to his shore, and Homeric guests at Pylos beside the Neleid house under Nestor’s sandy court.',
      'Then the far harbours took their turn — Colchis and the Phaeacian Corcyra, Lycia under Xanthus and the Mysian Pergamon of Telephus, Knossos and Gortyn with their Minos threads drawn apart, Delos where Leto laboured, and Samothrace where Dardanus first touched the island of mysteries.',
      'The city sky learned to speak its own census — how many figures dwelt beneath each polis, a glass panel over the compact heavens, and for the empty shores a quiet nebula that sends the traveller back to lineage and map until the data catches up with the myth.',
      'And the forge of linked prose was taught incrementality — no longer must a single edited line rebake the whole catalogue of names; each tale and each star keeps its own seal, that the dev fire may skip what still holds true and burn only what changed.',
    ],
  },
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
