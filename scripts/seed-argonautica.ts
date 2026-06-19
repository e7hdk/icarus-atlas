/**
 * One-shot seed: missing Argonaut character nodes + Jason ally relations.
 * Run: pnpm tsx scripts/seed-argonautica.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const CHAR_DIR = join(ROOT, 'data/characters');
const REL_PATH = join(ROOT, 'data/relations.json');

type CharSeed = {
  id: string;
  name: string;
  greekName: string;
  romanName?: string;
  type: 'hero' | 'mortal' | 'creature';
  domains: string[];
  summary: { text: string; sources: string[]; citation: string; topic?: string }[];
  story: { text: string; sources: string[]; citation: string; topic?: string }[];
  residences?: { city: string; sources: string[] }[];
  allySources?: string[];
};

const CREW: CharSeed[] = [
  {
    id: 'orpheus',
    name: 'Orpheus',
    greekName: 'Orpheus (Ὀρφεύς)',
    romanName: 'Orpheus',
    type: 'hero',
    domains: ['the lyre', 'prophetic song', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Oeagrus and the Muse Calliope, Thracian minstrel of the Argo whose counter-melody saved the crew from the Sirens when Butes alone was lost to their song.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Argonautica 1.23, 4.905–909; Fabulae 14',
        topic: 'orpheus-parentage',
      },
    ],
    story: [
      {
        text: 'Apollonius places him first in the muster after Jason: from the Pierian height came Orpheus, whom Calliope bore to Oeagrus near Pimpleia, and his song held even the Clashing Rocks when the Argo passed. At the Sirens\' isle he chanted a counter-melody so sweet that the crew rowed on unharmed.',
        sources: ['apollonius', 'apollodorus'],
        citation: 'Argonautica 1.23–34, 4.891–919; Bibliotheca 1.9.16, 1.9.25',
      },
      {
        text: 'Hyginus names him prophet and cithara-player from Pieria on Olympus, and sets him at the prow to give the bosun\'s calls; Pausanias rejects the descent from Calliope as a Greek untruth.',
        sources: ['hyginus', 'pausanias'],
        citation: 'Fabulae 14; Description of Greece 9.30.4',
        topic: 'orpheus-parentage',
      },
    ],
    allySources: ['apollodorus', 'apollonius', 'hyginus'],
  },
  {
    id: 'argus-arestor',
    name: 'Argus',
    greekName: 'Argos (Ἄργος)',
    type: 'hero',
    domains: ['builder of the Argo', 'Athena\'s pupil', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Arestor, whom Athena guided in building the fifty-oared Argo and fitting a speaking timber from Dodona in her prow — not to be confused with Argus son of Phrixus at Colchis.',
        sources: ['apollonius', 'apollodorus', 'hyginus'],
        citation: 'Argonautica 1.111–114, 1.321–326; Bibliotheca 1.9.17; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollonius makes Athena teach Argus son of Arestor to build the ship at Pagasae; when she set the oak of Dodona in the prow, the timber spoke and prophesied. Acastus came down from Iolcus with this Argus to join the muster.',
        sources: ['apollonius'],
        citation: 'Argonautica 1.111–114, 1.224, 1.321–326',
      },
      {
        text: 'Hyginus also names an Argive Argus son of Polybus and Argia — or of Danaus — clad in a bull\'s hide, builder of the Argo; the name is shared among several craftsmen in the tradition.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'mopsus',
    name: 'Mopsus',
    greekName: 'Mopsos (Μόψος)',
    type: 'hero',
    domains: ['augury', 'the Argonaut voyage', 'Oechalia'],
    summary: [
      {
        text: 'Son of Ampycus, trained in augury by Apollo, who sailed with Jason, kept watch with Acastus in storm, and died of a serpent\'s bite in Libya after joining the crew mid-voyage.',
        sources: ['apollonius', 'hyginus', 'ovid'],
        citation: 'Argonautica 1.80, 1.1079, 4.1502–1536; Fabulae 14; Metamorphoses 12.456',
      },
    ],
    story: [
      {
        text: 'Apollonius names Mopsus son of Ampycus among the seers of the voyage; when storm pinned the heroes ashore he and Acastus kept watch while a halcyon hovered prophesying calm. In Libya he was bitten by a serpent and died — Idmon\'s avenger Idas slew the beast that gored the other seer.',
        sources: ['apollonius'],
        citation: 'Argonautica 1.80, 1.1079, 2.815–850, 4.1502–1536',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'tiphys',
    name: 'Tiphys',
    greekName: 'Tiphys (Τῖφυς)',
    type: 'hero',
    domains: ['helmsmanship', 'the Argonaut voyage', 'Boeotia'],
    summary: [
      {
        text: 'Son of Phorbas and Hyrmine, Boeotian helmsman of the Argo who steered her until he died of illness among the Mariandyni, whereupon Ancaeus son of Poseidon took the helm.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.105, 2.557–570; Fabulae 14, 18',
      },
    ],
    story: [
      {
        text: 'Apollonius makes Tiphys the first pilot, son of Phorbas, whom Athena herself set at the steering-oar when the ship was launched. He died in the house of King Lycus among the Mariandyni; Hera then kindled Ancaeus of Samos to guide the Argo through the Clashing Rocks.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.105, 2.557–570, 2.851–898; Fabulae 18',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'phineus-thrace',
    name: 'Phineus',
    greekName: 'Phineus (Φινεύς)',
    type: 'mortal',
    domains: ['prophecy', 'Salmydessus', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Blind Thracian seer, son of Agenor, tormented by the Harpies until Zetes and Calais drove them off; he then counselled the Argonauts through the Clashing Rocks.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.21; Argonautica 2.178–490; Fabulae 19',
      },
    ],
    story: [
      {
        text: 'Apollodorus tells how the gods set the Harpies over Phineus: whenever food was laid they snatched and befouled it. The winged Boreads pursued them; Iris swore by Styx they would trouble him no more. In return Phineus foretold the voyage and bade them release a dove through the Symplegades.',
        sources: ['apollodorus', 'apollonius'],
        citation: 'Bibliotheca 1.9.21; Argonautica 2.178–490',
      },
    ],
  },
  {
    id: 'amycus-bebrycian',
    name: 'Amycus',
    greekName: 'Amykos (Ἄμυκος)',
    type: 'hero',
    domains: ['boxing', 'Bebrycia', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Poseidon and the Bithynian nymph Melie, king of the Bebrycians who forced strangers to box and was slain by Polydeuces when the Argonauts landed.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.20; Argonautica 2.1–97; Fabulae 17',
      },
    ],
    story: [
      {
        text: 'Apollonius tells how Amycus challenged all comers to box; Polydeuces, stung by the insult, stripped and killed the king. The Mariandyni, long at war with the Bebrycians, welcomed Polydeuces as a god for the deed.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 2.1–97; Fabulae 17',
      },
    ],
  },
  {
    id: 'butes-athens',
    name: 'Butes',
    greekName: 'Butes (Βούτης)',
    type: 'hero',
    domains: ['Attica', 'the Sirens', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Teleon and Zeuxippe, Athenian Argonaut who alone leapt overboard at the Sirens\' song and was saved by Aphrodite at Lilybaeum.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.25; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'When Orpheus\' counter-melody held the crew at the Sirens\' isle, Butes alone was overcome and swam toward the deadly song; Aphrodite snatched him up and settled him in Lilybaeum, where she bore him Eryx.',
        sources: ['apollodorus', 'apollonius'],
        citation: 'Bibliotheca 1.9.25; Argonautica 4.914–919',
      },
    ],
    residences: [{ city: 'athens', sources: ['hyginus'] }],
    allySources: ['apollodorus', 'hyginus'],
  },
  {
    id: 'phalerus-athens',
    name: 'Phalerus',
    greekName: 'Phaleros (Φαληρός)',
    type: 'hero',
    domains: ['Attica', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Alcon, Athenian Argonaut from the harbour that bears his name.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.97; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollonius numbers Phalerus son of Alcon among the Athenians who sailed with Jason — Alcon once shot the snake that threatened his son\'s life.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.97; Fabulae 14',
      },
    ],
    residences: [{ city: 'athens', sources: ['apollonius', 'hyginus'] }],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'nauplius-amymone',
    name: 'Nauplius',
    greekName: 'Nauplios (Ναύπλιος)',
    type: 'hero',
    domains: ['seafaring', 'Argos', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Poseidon and Amymone, Argive Argonaut who lived to great age and later avenged his son Palamedes by wrecking the Achaean returns from Troy.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 2.1.5; Argonautica 1.134–136; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollonius names Nauplius among the Argonauts; Hyginus makes him son of Neptune and Amymone daughter of Danaus. He survived the voyage and in later days misled returning Greeks with false beacon-fires.',
        sources: ['apollonius', 'hyginus', 'apollodorus'],
        citation: 'Argonautica 1.134–136; Fabulae 14; Epitome 6.7–11',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'idmon',
    name: 'Idmon',
    greekName: 'Idmōn (Ἰδμών)',
    type: 'hero',
    domains: ['augury', 'the Argonaut voyage', 'Argos'],
    summary: [
      {
        text: 'Son of Apollo and the nymph Cyrene — or of Abas — Argive seer who read his death in the birds yet sailed with Jason and was gored by a boar among the Mariandyni.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.23; Argonautica 2.815–850; Fabulae 14, 18',
      },
    ],
    story: [
      {
        text: 'Though augury foretold he would perish on the voyage, Idmon would not stay behind. Among the Mariandyni he went out for straw and a boar gored him; Idas son of Aphareus slew the beast in vengeance.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.23; Argonautica 2.815–850; Fabulae 18',
      },
    ],
    allySources: ['apollodorus', 'apollonius', 'hyginus'],
  },
  {
    id: 'aethalides',
    name: 'Aethalides',
    greekName: 'Aithalidēs (Αἰθαλίδης)',
    type: 'hero',
    domains: ['heraldry', 'unfailing memory', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Hermes and Eupolemia, herald of the Argonauts whose soul passed through countless lives remembering all.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.641–650; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollonius makes Aethalides the unfailing herald of the host, son of Hermes, who even in Hades keeps the memory of his former lives — a gift his father granted him.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.641–650; Fabulae 14',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'coronus-gyrton',
    name: 'Coronus',
    greekName: 'Koronos (Κόρωνος)',
    type: 'hero',
    domains: ['Gyrton in Thessaly', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Caeneus from Gyrton in Thessaly, numbered among Jason\'s crew.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Hyginus names Coronus son of Caeneus from Gyrton; Apollodorus counts him in the roll of those who sailed to Colchis.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Fabulae 14',
      },
    ],
    allySources: ['apollodorus', 'hyginus'],
  },
  {
    id: 'asterion-pellene',
    name: 'Asterion',
    greekName: 'Asteriōn (Ἀστερίων)',
    type: 'hero',
    domains: ['Pellene', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Argonaut from Pellene, son either of Hyperasius or of Pyremus and Antigone daughter of Pheres.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.176; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollonius and Hyginus both name an Asterion among the Minyae; Hyginus makes him son of Pyremus and Antigone of Pellene, or alternatively of Hyperasius from Piresia at the foot of Phylleus.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.176; Fabulae 14',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'asterius-piresia',
    name: 'Asterius',
    greekName: 'Asterios (Ἀστέριος)',
    type: 'hero',
    domains: ['Piresia in Thessaly', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Argonaut from Piresia at the foot of Mount Phylleus, son of Hyperasius — paired with Asterion in the catalogues.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Argonautica 1.35; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollodorus and Apollonius number Asterius among the Thessalian Minyae who sailed from Pagasae; Hyginus sets him at Piresia where the Apidanus and Enipeus meet.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Argonautica 1.35; Fabulae 14',
      },
    ],
    allySources: ['apollodorus', 'apollonius', 'hyginus'],
  },
  {
    id: 'polyphemus-elatid',
    name: 'Polyphemus',
    greekName: 'Polyphemos (Πολύφημος)',
    type: 'hero',
    domains: ['Larissa', 'Mysia', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Elatus, Thessalian Argonaut left in Mysia searching for Hylas; he founded Cius and died old without finding the boy.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.19; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'When Hylas was lost to the nymphs, Heracles and Polyphemus searched while the Argo sailed on. Polyphemus remained in Mysia, founded Cius, and ruled there until he died still seeking Hylas.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.19; Fabulae 14',
      },
    ],
    allySources: ['apollodorus', 'hyginus'],
  },
  {
    id: 'eurydamus',
    name: 'Eurydamus',
    greekName: 'Eurydamos (Εὐρύδαμος)',
    type: 'hero',
    domains: ['Dolopia', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Ctimenus or of Irus and Demonassa, Argonaut from the region of Lake Xynius.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollodorus and Hyginus count Eurydamus among the crew; Hyginus makes him son of Irus and Demonassa, or of Ctimenus near Lake Xynius.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Fabulae 14',
      },
    ],
    allySources: ['apollodorus', 'hyginus'],
  },
  {
    id: 'eribotes',
    name: 'Eribotes',
    greekName: 'Eribōtēs (Ἐριβώτης)',
    type: 'hero',
    domains: ['Eleon', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Teleon from Eleon, Argonaut who tended Oileus when a Stymphalian bird wounded him and was killed in Libya on the return.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.72, 2.1039, 4.1465; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollonius names Eribotes son of Teleon; on the outward voyage he helped the wounded Oileus, and Hyginus says he was slain in Libya by the shepherd Cephalion while raiding flocks.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.72, 4.1465; Fabulae 14',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'oileus-locris',
    name: 'Oileus',
    greekName: 'Oileus (Οἰλεύς)',
    type: 'hero',
    domains: ['Locris', 'the Argonaut voyage', 'father of Ajax'],
    summary: [
      {
        text: 'Son of Hodoedocus, Locrian Argonaut and father of Ajax the Lesser, wounded by a Stymphalian bird on the voyage.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Argonautica 2.1037; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollonius tells how a Stymphalian bird struck Oileus in the shoulder; Eribotes drew out the barbed feather and healed the wound. He is numbered among the Argonauts in every major catalogue.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 2.1037; Fabulae 14',
      },
    ],
    allySources: ['apollodorus', 'apollonius', 'hyginus'],
  },
  {
    id: 'clytius-oechalia',
    name: 'Clytius',
    greekName: 'Klytios (Κλυτίος)',
    type: 'hero',
    domains: ['Oechalia', 'archery', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Eurytus of Oechalia and Antiope, Argonaut slain at Colchis by Aeetes or, in another tale, by Heracles.',
        sources: ['hyginus', 'diodorus'],
        citation: 'Fabulae 14; Library of History 4.37.5',
      },
    ],
    story: [
      {
        text: 'Hyginus names Clytius son of Eurytus among the Argonauts; his father had received archery from Apollo. At Colchis he fell — some say to Aeetes\' hand.',
        sources: ['hyginus', 'diodorus'],
        citation: 'Fabulae 14; Library of History 4.37.5',
      },
    ],
    allySources: ['hyginus', 'apollodorus'],
  },
  {
    id: 'iphitus-oechalia',
    name: 'Iphitus',
    greekName: 'Iphitos (Ἴφιτος)',
    type: 'hero',
    domains: ['Oechalia', 'the bow of Odysseus', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Eurytus of Oechalia, Argonaut who later gave his bow to Odysseus and was thrown from the walls of Tiryns by Heracles.',
        sources: ['apollodorus', 'hyginus', 'homer'],
        citation: 'Bibliotheca 1.9.16, 2.6.2; Fabulae 14; Odyssey 21.30',
      },
    ],
    story: [
      {
        text: 'Hyginus counts Iphitus son of Eurytus among the Argonauts. After the voyage he trusted Heracles when cattle were stolen and was murdered in madness — but not before giving Odysseus the great bow.',
        sources: ['hyginus', 'homer', 'apollodorus'],
        citation: 'Fabulae 14; Odyssey 21.30; Bibliotheca 2.6.2',
      },
    ],
    allySources: ['apollodorus', 'hyginus'],
  },
  {
    id: 'phlias',
    name: 'Phlias',
    greekName: 'Phlias (Φλίας)',
    type: 'hero',
    domains: ['Phlius', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Dionysus and Ariadne — or of other fathers in rival genealogies — eponym of Phlius near Sicyon, numbered among the Argonauts.',
        sources: ['apollonius', 'hyginus', 'pausanias'],
        citation: 'Argonautica 1.115; Fabulae 14; Description of Greece 2.6.6',
      },
    ],
    story: [
      {
        text: 'Apollonius names Phlias among the crew from the Peloponnese; Hyginus makes him son of Liber and Ariadne from Phlius, though others call him Theban.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.115; Fabulae 14',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'hylas',
    name: 'Hylas',
    greekName: 'Hylas (Ὕλας)',
    type: 'hero',
    domains: ['Mysia', 'beauty', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Theodamas and the nymph Menodice, beloved of Heracles, ravished by Mysian nymphs at the spring and lost to the expedition.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.19; Argonautica 1.120–135; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'When Hylas went to fetch water at Cios, nymphs seized the beautiful youth and hid him; Heracles and Polyphemus searched while the Argo sailed on without them. Some say the nymphs turned Hylas into an echo answering Heracles\' cry.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.19; Argonautica 1.120–135; Fabulae 14',
      },
    ],
    allySources: ['apollodorus', 'apollonius', 'hyginus'],
  },
  {
    id: 'pirithous',
    name: 'Pirithous',
    greekName: 'Peirithoos (Πειρίθοος)',
    type: 'hero',
    domains: ['Lapiths', 'friendship with Theseus', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Ixion, Lapith king and comrade of Theseus, numbered among the Argonauts in Hyginus\' catalogue.',
        sources: ['hyginus', 'apollodorus'],
        citation: 'Fabulae 14; Bibliotheca 1.9.16',
      },
    ],
    story: [
      {
        text: 'Hyginus names Pirithous son of Ixion among the Thessalian Minyae who sailed for the fleece; he is better known for the Calydonian hunt and for descending with Theseus to fetch Persephone.',
        sources: ['hyginus', 'apollodorus'],
        citation: 'Fabulae 14; Bibliotheca 1.8.2, 1.9.16',
      },
    ],
    allySources: ['hyginus', 'apollodorus'],
  },
  {
    id: 'laocoon-calydon',
    name: 'Laocoon',
    greekName: 'Laokoōn (Λαοκόων)',
    type: 'hero',
    domains: ['Calydon', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Porthaon and brother of Oeneus, Calydonian Argonaut from the house of Thestius\' kin.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.192; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollonius and Hyginus count Laocoon son of Porthaon among the crew — uncle of Meleager in the Calydonian line, not to be confused with the Trojan priest of later saga.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.192; Fabulae 14',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'iphitus-phocis',
    name: 'Iphitus',
    greekName: 'Iphitos (Ἴφιτος)',
    type: 'hero',
    domains: ['Phocis', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Naubolus from Phocis — or of Hippasus in another account — Argonaut distinct from Iphitus son of Eurytus.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Hyginus names an Iphitus son of Naubolus from Phocis among the Argonauts, warning that another Iphitus, son of Eurytus, sailed in the same company.',
        sources: ['hyginus', 'apollodorus'],
        citation: 'Fabulae 14; Bibliotheca 1.9.16',
      },
    ],
    allySources: ['hyginus', 'apollodorus'],
  },
  {
    id: 'actor-argonaut',
    name: 'Actor',
    greekName: 'Aktōr (Ἄκτωρ)',
    type: 'hero',
    domains: ['Peloponnese', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Hippasus, Peloponnesian Argonaut in Hyginus\' roll — distinct from Actor father of Menoetius and Eurytion.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Hyginus lists Actor son of Hippasus from the Peloponnese among Jason\'s comrades.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    allySources: ['hyginus'],
  },
  {
    id: 'thersanon-andros',
    name: 'Thersanon',
    greekName: 'Thersanōn (Θερσάνων)',
    type: 'hero',
    domains: ['Andros', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Helios and Leucothoe, Argonaut from the island of Andros.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Hyginus names Thersanon son of the Sun and Leucothoe among the crew from Andros.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    allySources: ['hyginus'],
  },
  {
    id: 'hippalcimus',
    name: 'Hippalcimus',
    greekName: 'Hippalkimos (Ἱππάλκιμος)',
    type: 'hero',
    domains: ['Pisa', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Pelops and Hippodamia, Argonaut from Pisa in the Peloponnese.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Hyginus counts Hippalcimus son of Pelops among the Minyae who sailed on the Argo.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    allySources: ['hyginus'],
  },
  {
    id: 'eurymedon-phlius',
    name: 'Eurymedon',
    greekName: 'Eurymedōn (Εὐρυμέδων)',
    type: 'hero',
    domains: ['Phlius', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Dionysus and Ariadne from Phlius, Argonaut paired with Phlias in the Peloponnesian contingent.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Hyginus names Eurymedon son of Liber and Ariadne among the Argonauts from Phlius.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    allySources: ['hyginus'],
  },
  {
    id: 'palaemon-argonaut',
    name: 'Palaemon',
    greekName: 'Palaemon (Παλαίμων)',
    type: 'hero',
    domains: ['Calydon', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Lernus, Calydonian Argonaut in Hyginus\' catalogue.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollodorus and Hyginus number Palaemon among those who sailed to Colchis; Hyginus makes him son of Lernus from Calydon.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Fabulae 14',
      },
    ],
    allySources: ['apollodorus', 'hyginus'],
  },
  {
    id: 'caeneus-gortyn',
    name: 'Caeneus',
    greekName: 'Kaineus (Καινεύς)',
    type: 'hero',
    domains: ['Gortyn', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Coronus, Argonaut from Gortyn — distinct from the invulnerable Lapith Caeneus.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Hyginus lists a Caeneus son of Coronus from Gortyn among the crew; Apollodorus counts him separately from Coronus son of Caeneus.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.16; Fabulae 14',
      },
    ],
    allySources: ['apollodorus', 'hyginus'],
  },
  {
    id: 'deucalion-pella',
    name: 'Deucalion',
    greekName: 'Deukaliōn (Δευκαλίων)',
    type: 'hero',
    domains: ['Pella in Macedonia', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Hyperasius from Pella, Macedonian Argonaut — not to be confused with Deucalion the survivor of the Flood.',
        sources: ['hyginus', 'apollonius'],
        citation: 'Fabulae 14; Argonautica 1.367',
      },
    ],
    story: [
      {
        text: 'Hyginus names a Deucalion son of Hyperasius from Pella among the Minyae; he must be kept distinct from the Deucalion who refathered mankind after the Flood.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    allySources: ['hyginus'],
  },
  {
    id: 'deucalion-crete',
    name: 'Deucalion',
    greekName: 'Deukaliōn (Δευκαλίων)',
    type: 'mortal',
    domains: ['Crete', 'the Argonaut voyage', 'father of Idomeneus'],
    summary: [
      {
        text: 'Son of Minos, Cretan Argonaut in Hyginus\' list, father of Idomeneus — slain by Theseus in another tale.',
        sources: ['hyginus', 'apollodorus', 'plutarch'],
        citation: 'Fabulae 14; Bibliotheca 3.1.2; Life of Theseus 19.6',
      },
    ],
    story: [
      {
        text: 'Hyginus counts Deucalion son of Minos among the Argonauts; Plutarch tells how Theseus slew this Deucalion and his guard when leaving Crete.',
        sources: ['hyginus', 'plutarch'],
        citation: 'Fabulae 14; Life of Theseus 19.6',
      },
    ],
    residences: [{ city: 'cnossus', sources: ['hyginus'] }],
    allySources: ['hyginus'],
  },
  {
    id: 'canthus',
    name: 'Canthus',
    greekName: 'Kanthos (Κάνθος)',
    type: 'hero',
    domains: ['Libya', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Canethus or Abas, Argonaut killed in Libya on the return while raiding flocks.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.77–80, 4.1465–1485; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollonius names Canthus among the crew; Hyginus says he was slain in Libya by the shepherd Cephalion when pillaging sheep.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 4.1465–1485; Fabulae 14',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'phocus-magnesian',
    name: 'Phocus',
    greekName: 'Phokos (Φῶκος)',
    type: 'hero',
    domains: ['Magnesia', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Caeneus from Magnesia, Argonaut paired with Priasus in Hyginus\' catalogue — not the Aeacid Phocus.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Hyginus names Phocus and Priasus sons of Caeneus from Magnesia among the crew.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    allySources: ['hyginus'],
  },
  {
    id: 'priasus',
    name: 'Priasus',
    greekName: 'Priasos (Πρίασος)',
    type: 'hero',
    domains: ['Magnesia', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Caeneus from Magnesia, Argonaut in Hyginus\' roll.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Hyginus lists Priasus son of Caeneus among Jason\'s comrades from Magnesia.',
        sources: ['hyginus'],
        citation: 'Fabulae 14',
      },
    ],
    allySources: ['hyginus'],
  },
  {
    id: 'leodocus',
    name: 'Leodocus',
    greekName: 'Leodokos (Λεωδόκος)',
    type: 'hero',
    domains: ['Argos', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Bias and Pero, Argonaut from the Argive branch of the Aeolid house.',
        sources: ['apollonius'],
        citation: 'Argonautica 1.118',
      },
    ],
    story: [
      {
        text: 'Apollonius names Leodocus with his brothers Areius, son of Bias and Pero, among the Argonauts.',
        sources: ['apollonius'],
        citation: 'Argonautica 1.118',
      },
    ],
    allySources: ['apollonius'],
  },
  {
    id: 'echion-hermes',
    name: 'Echion',
    greekName: 'Echiōn (Ἐχίων)',
    type: 'hero',
    domains: ['Alope', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Hermes and Antianira, Argonaut from Alope — distinct from Echion the Spartos of Thebes.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.51; Fabulae 14',
      },
    ],
    story: [
      {
        text: 'Apollonius and Hyginus name Echion son of Hermes among the crew; some make him and his brother Eurytus Thessalians rather than from Alope.',
        sources: ['apollonius', 'hyginus'],
        citation: 'Argonautica 1.51; Fabulae 14',
      },
    ],
    allySources: ['apollonius', 'hyginus'],
  },
  {
    id: 'eurytus-hermes',
    name: 'Eurytus',
    greekName: 'Eurytos (Εὔρυτος)',
    type: 'hero',
    domains: ['Alope', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Hermes and Antianira, brother of Echion, Argonaut — distinct from Eurytus king of Oechalia.',
        sources: ['hyginus', 'apollonius'],
        citation: 'Fabulae 14; Argonautica 1.51',
      },
    ],
    story: [
      {
        text: 'Hyginus pairs Eurytus and Echion as sons of Mercury and Antianira from Alope among the Minyae who sailed with Jason.',
        sources: ['hyginus', 'apollonius'],
        citation: 'Fabulae 14; Argonautica 1.51',
      },
    ],
    allySources: ['hyginus', 'apollonius'],
  },
  {
    id: 'amphion-pella',
    name: 'Amphion',
    greekName: 'Amphiōn (Ἀμφίων)',
    type: 'hero',
    domains: ['Pella in Macedonia', 'the Argonaut voyage'],
    summary: [
      {
        text: 'Son of Hyperasius from Pella, Macedonian Argonaut — distinct from Amphion the Theban wall-builder.',
        sources: ['hyginus', 'apollonius'],
        citation: 'Fabulae 14; Argonautica 1.735',
      },
    ],
    story: [
      {
        text: 'Hyginus lists Amphion son of Hyperasius with Asterion among the Minyae; he must not be merged with the Theban twin who built the walls with his lyre.',
        sources: ['hyginus', 'apollonius'],
        citation: 'Fabulae 14; Argonautica 1.735',
      },
    ],
    allySources: ['hyginus', 'apollonius'],
  },
  {
    id: 'cyzicus-dolion',
    name: 'Cyzicus',
    greekName: 'Kyzikos (Κύζικος)',
    type: 'mortal',
    domains: ['the Doliones', 'Propontis', 'hospitality betrayed'],
    summary: [
      {
        text: 'Son of Eusorus, king of an island in the Propontis who received the Argonauts generously and was killed by Jason in a night battle by mistake.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.18; Argonautica 1.1012–1074; Fabulae 16',
      },
    ],
    story: [
      {
        text: 'When the Argo was driven back to his island by night, Cyzicus took the returning crew for enemies and fell to Jason\'s spear; at dawn the heroes mourned and gave him burial.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.18; Fabulae 16',
      },
    ],
  },
  {
    id: 'lycus-mariandyni',
    name: 'Lycus',
    greekName: 'Lykos (Λύκος)',
    type: 'mortal',
    domains: ['the Mariandyni', 'Propontis', 'hospitality'],
    summary: [
      {
        text: 'King of the Mariandyni who received the Argonauts because they had slain his enemy Amycus; Idmon and Tiphys died at his court.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Bibliotheca 1.9.23; Fabulae 18',
      },
    ],
    story: [
      {
        text: 'Hyginus tells how Lycus honoured the heroes for killing Amycus; there Idmon was gored by a boar and Tiphys died of illness, and Ancaeus took the helm.',
        sources: ['hyginus', 'apollodorus'],
        citation: 'Fabulae 18; Bibliotheca 1.9.23',
      },
    ],
  },
  {
    id: 'talos-crete',
    name: 'Talos',
    greekName: 'Talōs (Τάλως)',
    type: 'creature',
    domains: ['Crete', 'the brazen guardian', 'Medea\'s sorcery'],
    summary: [
      {
        text: 'Brazen man who guarded Crete and circled the island thrice daily; Medea destroyed him by magic as the Argonauts sailed homeward.',
        sources: ['apollodorus', 'apollonius'],
        citation: 'Bibliotheca 1.9.26; Argonautica 4.1638–1693',
      },
    ],
    story: [
      {
        text: 'Apollodorus says Medea destroyed the brazen Talos on Crete — some say by driving him mad, others by fixing a nail in his vein so that all the ichor ran out.',
        sources: ['apollodorus', 'apollonius'],
        citation: 'Bibliotheca 1.9.26; Argonautica 4.1638–1693',
      },
    ],
  },
];

/** Existing promoted crew needing ally edges only */
const EXISTING_CREW = [
  'heracles',
  'theseus',
  'iolaus',
  'laertes',
  'menoetius',
  'philoctetes',
  'admetus',
  'atalanta',
  'augeas',
  'periclymenus-neleus',
  'erginus-miletus',
  'talaus-aeolid',
  'staphylus-dionysus',
  'phanus-dionysus',
  'eurytion',
  'epochus',
  'leodocus',
];

const ALLY_CREW = [
  ...CREW.filter((c) => c.allySources).map((c) => ({ id: c.id, sources: c.allySources! })),
  ...EXISTING_CREW.map((id) => ({
    id,
    sources: ['apollodorus', 'hyginus'] as string[],
  })),
  // already wired in relations — idempotent skip
  { id: 'acastus', sources: ['apollodorus', 'apollonius'] },
  { id: 'amphidamas-arcadia', sources: ['apollonius', 'hyginus'] },
  { id: 'ancaeus-arcadian', sources: ['apollodorus', 'apollonius'] },
  { id: 'ancaeus-samos', sources: ['apollonius', 'hyginus'] },
  { id: 'calais', sources: ['apollodorus', 'apollonius'] },
  { id: 'castor', sources: ['apollonius', 'hyginus'] },
  { id: 'cepheus-tegea', sources: ['apollonius', 'hyginus'] },
  { id: 'euphemus', sources: ['apollodorus', 'apollonius'] },
  { id: 'idas', sources: ['apollodorus', 'apollonius'] },
  { id: 'iphiclus-thestiad', sources: ['apollodorus', 'apollonius'] },
  { id: 'lynceus-apharetid', sources: ['apollodorus', 'apollonius'] },
  { id: 'meleager', sources: ['apollonius', 'hyginus'] },
  { id: 'peleus', sources: ['apollodorus', 'apollonius'] },
  { id: 'polydeuces', sources: ['apollonius', 'hyginus'] },
  { id: 'telamon', sources: ['apollodorus', 'apollonius'] },
  { id: 'zetes', sources: ['apollodorus', 'apollonius'] },
  { id: 'jason', sources: [] }, // skip self
];

function main() {
  let created = 0;
  let skipped = 0;

  for (const seed of CREW) {
    const path = join(CHAR_DIR, `${seed.id}.json`);
    const body = {
      id: seed.id,
      name: seed.name,
      greekName: seed.greekName,
      ...(seed.romanName ? { romanName: seed.romanName } : {}),
      type: seed.type,
      cluster: 'mortal-arm',
      domains: seed.domains,
      summary: seed.summary,
      story: seed.story,
      ...(seed.residences ? { residences: seed.residences } : {}),
    };
    if (existsSync(path)) {
      skipped++;
      continue;
    }
    writeFileSync(path, JSON.stringify(body, null, 2) + '\n');
    created++;
  }

  const rels = JSON.parse(readFileSync(REL_PATH, 'utf-8')) as Array<{
    id: string;
    type: string;
    from: string;
    to: string;
    sources?: string[];
    note?: string;
  }>;
  const relIds = new Set(rels.map((r) => r.id));
  let relAdded = 0;

  const seen = new Set<string>();
  for (const { id, sources } of ALLY_CREW) {
    if (id === 'jason' || !sources.length) continue;
    if (seen.has(id)) continue;
    seen.add(id);

    const forward = `jason-ally-${id}`;
    const backward = `${id}-ally-jason`;
    if (!relIds.has(forward)) {
      rels.push({
        id: forward,
        type: 'ally',
        from: 'jason',
        to: id,
        sources,
        note: 'Sailed on the Argo as one of Jason\'s comrades',
      });
      relAdded++;
    }
    if (!relIds.has(backward)) {
      rels.push({
        id: backward,
        type: 'ally',
        from: id,
        to: 'jason',
        sources,
        note: 'Sailed on the Argo under Jason\'s captaincy',
      });
      relAdded++;
    }
  }

  writeFileSync(REL_PATH, JSON.stringify(rels, null, 2) + '\n');
  console.log(`Characters created: ${created}, skipped existing: ${skipped}`);
  console.log(`Ally relations added: ${relAdded}`);
}

main();
