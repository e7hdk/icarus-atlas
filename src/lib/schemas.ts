import { z } from 'zod';
import { CHARACTER_TYPES, RELATION_TYPES, SOURCE_IDS } from '@/types/character';

export const sourceIdSchema = z.enum(SOURCE_IDS);

export const sourcedTextSchema = z.object({
  text: z.string().min(1),
  sources: z.array(sourceIdSchema).min(1),
  citation: z.string().optional(),
  topic: z.string().optional(),
});

export const characterSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  name: z.string().min(1),
  greekName: z.string().min(1),
  romanName: z.string().optional(),
  type: z.enum(CHARACTER_TYPES),
  domains: z.array(z.string().min(1)).min(1),
  epithets: z.array(z.string().min(1)).optional(),
  summary: z.array(sourcedTextSchema).min(1),
  story: z.array(sourcedTextSchema).min(1),
  cluster: z.string().min(1),
});

export const relationSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  type: z.enum(RELATION_TYPES),
  from: z.string().min(1),
  to: z.string().min(1),
  sources: z.array(sourceIdSchema).min(1),
  topic: z.string().optional(),
  note: z.string().optional(),
});

export const sourceSchema = z.object({
  id: sourceIdSchema,
  name: z.string().min(1),
  works: z.array(z.string().min(1)).min(1),
  period: z.string().min(1),
  language: z.string().min(1),
  description: z.string().min(1),
});

export const artworkSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  year: z.string().min(1),
  imageUrl: z.string().url(),
});

export const cultureSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  artworks: z.array(artworkSchema),
});

export const referenceSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id must be kebab-case'),
  summary: z.string().min(1),
  attribution: z.string().min(1),
  symbols: z.array(z.string().min(1)).optional(),
  sacredAnimals: z.array(z.string().min(1)).optional(),
  cultCenters: z.array(z.string().min(1)).optional(),
  etymology: z.string().optional(),
  externalLinks: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).optional(),
});

export type CharacterInput = z.infer<typeof characterSchema>;
export type RelationInput = z.infer<typeof relationSchema>;
export type SourceInput = z.infer<typeof sourceSchema>;
