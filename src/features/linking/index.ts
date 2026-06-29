export { LinkedProse } from './LinkedProse';
export {
  buildLinkingContext,
  buildNameIndex,
  buildSortedSearchNames,
  type LinkingContext,
  type NameIndex,
  type NameIndexEntry,
} from './name-index';
export {
  getBakedLinkedProse,
  getCharacterStorySegments,
  getCharacterSummarySegments,
  getStoryProseSegments,
  resolveCharacterProseSegments,
  type BakedCharacterProse,
  type BakedLinkedProse,
  type BakedStoryProse,
} from './load-baked';
export { linkingSignature } from './linkingSignature';
export { LINKED_PROSE_PARSER_VERSION, parseLinkedProse, type ProseSegment } from './parse-prose';
export { resolveCharacterId } from './resolve-name';
