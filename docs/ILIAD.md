# The Iliad — M10.2 Stories Research Dossier

> Research status: source-mapped against the seven atlas lenses (corpus-first), 2026-06-16. **Story Batch 1** — Books 1–6. **Story Batch 2** — Books 7–9, 11–15 (Book 10 = existing `rhesus`). **Story Batch 3** — Books 16–24 (Patroclus, Hector, Priam). Character roster batches live separately in `docs/ILIAD_ROSTER.md`.
>
> Scope: Homer's *Iliad* (Books 1–24) as nested episodes under `trojan-war`. Post-*Iliad* Epic Cycle (`aethiopis`, `little-iliad`) stays sibling episodes, not nested inside the Iliad spine.

## 1. Story tree

```
era 8   trojan-war                    (root — the Iliad decade)
          ├─ wrath-and-plague         (era 8.01 — Books 1–2)
          ├─ duel-and-truce           (era 8.02 — Books 3–4)
          ├─ diomedes-aristeia        (era 8.03 — Books 5–6)
          ├─ hector-and-the-wall      (era 8.07 — Books 7–8)
          ├─ embassy-to-achilles      (era 8.09 — Book 9)
          ├─ rhesus                   (era 8.1 — Book 10, Doloneia)
          ├─ wounding-of-the-chiefs   (era 8.11 — Books 11–12)
          ├─ battle-for-the-ships     (era 8.13 — Books 13–15)
          ├─ patroclus-falls          (era 8.16 — Book 16)
          ├─ achilles-and-hector      (era 8.17 — Books 17–22)
          ├─ priam-and-ransom         (era 8.24 — Books 23–24)
          ├─ aethiopis                (era 8.26 — post-Iliad)
          ├─ ajax-and-the-arms        (era 8.30 — post-Iliad)
          └─ little-iliad             (era 8.35 — post-Iliad)
```

Era numbers follow **Iliad book order**; `rhesus` keeps era `8.1` (Book 10) from the earlier Trojan shelf batch.

## 2. Overlap policy

- **Character roster** (`ILIAD_ROSTER.md`) — galaxy nodes; story episodes link via `cast.id`, never invent facts without `sources`.
- **Cypria / Aulis / Mysia** — pre-siege material nested under `cypria` (`suitor-oath-at-sparta`, `iphigenia-at-aulis`, `telephus-at-mysia`, `protesilaus-at-troy`, `palamedes`); Iliad episodes begin in the tenth year.
- **Aethiopis / Little Iliad** — post-*Iliad*; `trojan-war` root points outward, does not absorb them.
- **Odyssey / Nostoi** — Agamemnon's murder, Returns, Odysseus' wanderings stay on their shelves; cross-link in prose only.
- **Book 10** — `rhesus` episode; cross-linked from `wounding-of-the-chiefs` and `battle-for-the-ships`.

## 3. Documented dispute topics on this shelf

| topic | Where it surfaces |
|---|---|
| `agamemnon-daughters-identities` | wrath-and-plague ch. The quarrel — prose if Iphianassa naming cited |
| `aphrodite-parentage` | duel-and-truce ch. Aphrodite saves Paris — lens filter only |
| `deiphobus-slayer` | not on Iliad shelf — sack-of-troy |

## 4. Batch log

- **Story Batch 1 (done)** — `wrath-and-plague`, `duel-and-truce`, `diomedes-aristeia` + `trojan-war` root trim + `story-culture` + geo `storyIds`.
- **Story Batch 2 (done)** — `hector-and-the-wall`, `embassy-to-achilles`, `wounding-of-the-chiefs`, `battle-for-the-ships` + root pointers + `story-culture` + geo `storyIds`.
- **Story Batch 3 (done)** — `patroclus-falls`, `achilles-and-hector`, `priam-and-ransom` + root pointers + `story-culture` + geo `storyIds`. **Iliad shelf complete** at episode level (Books 1–24).

## 5. Verification

```bash
pnpm validate-data
pnpm corpus:search "<figure or passage>"   # before any new batch
```
