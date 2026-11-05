'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/components/ui/Link';
import { ClampList } from '@/components/ui/ClampList';
import { loadAtlasFile, useAtlasFile } from '@/features/atlas/useAtlasFile';
import { quarrelHref } from '@/features/library/paths';
import { marginChunkUrl, marginIndexUrl, type MarginBlock, type MarginChunk, type MarginIndex, type MarginTables } from '@/features/library/margin-paths';
import { TYPE_GLOW } from '@/types/character';
import { useReadingNow } from './ReadingLens';

/** The margin (docs/LIBRARY_PLAN.md §6): for the block under the reading line,
 *  what in the atlas rests on it — figures, ⚖ quarrels, lines in the sky,
 *  stories, works on the Loom. A column beside the text on a wide screen, a
 *  bottom sheet below that. The page's index comes first; the notes come in
 *  chunks as the reader moves, the chunks either side fetched ahead. */

const ACCENT_FALLBACK = '#aab4c8';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h4 className="mb-2 font-display text-[9.5px] tracking-[0.26em] text-aether-faint">{title}</h4>
      {children}
    </section>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 font-body text-[14px] italic text-aether-faint">{children}</p>;
}

function Notes({ block, tables, tellers }: { block: MarginBlock; tables: MarginTables; tellers: Record<string, string> }) {
  const figures = Object.entries(block.figures).sort((a, b) => b[1].facts - a[1].facts);
  const tint = (id: string) => (tables.who[id] ? TYPE_GLOW[tables.who[id][1]].color : ACCENT_FALLBACK);
  return (
    <>
      {figures.length > 0 && (
        <Section title="FIGURES">
          <ul className="space-y-2.5">
            <ClampList max={8} noun="FIGURES">
              {figures.map(([id, note]) => {
                const color = tint(id);
                return (
                  <li key={id} className="border-t border-white/[0.06] pt-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                      <Link href={`/character/${id}`} className="font-display text-[12.5px] tracking-[0.08em] hover:underline" style={{ color }}>
                        {tables.who[id]?.[0] ?? id}
                      </Link>
                      <span className="ml-auto font-body text-[12.5px] italic text-aether-faint">
                        {note.facts} fact{note.facts === 1 ? '' : 's'}
                        {note.topic ? <span className="ml-1 not-italic text-nebula-soft">⚖</span> : null}
                      </span>
                    </div>
                    {note.excerpt && <p className="mt-1 line-clamp-2 font-body text-[14px] italic leading-snug text-aether/75">{note.excerpt}</p>}
                    <p className="mt-1 font-display text-[8.5px] tracking-[0.16em] text-aether-faint">
                      {note.sources.map((source) => (tellers[source] ?? source).toUpperCase()).join(' · ')}
                      <span className="ml-1.5 font-body text-[12px] normal-case tracking-normal italic">{note.citation}</span>
                    </p>
                  </li>
                );
              })}
            </ClampList>
          </ul>
        </Section>
      )}
      {block.topics.length > 0 && (
        <Section title="⚖ QUARRELS">
          <ul className="space-y-2">
            <ClampList max={4} noun="QUARRELS">
              {block.topics.map((topic) => {
                const [title, claims] = tables.topics[topic] ?? [topic, []];
                const here = block.here?.[topic] ?? [];
                return (
                  <li key={topic} className="rounded-lg border border-nebula-soft/30 bg-nebula-violet/[0.07] px-3 py-2.5">
                    <Link href={quarrelHref(topic)} className="font-body text-[14.5px] leading-snug text-aether transition-colors hover:text-nebula-soft">
                      <span className="mr-1.5 text-nebula-soft">⚖</span>
                      {title}
                    </Link>
                    {claims.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {claims.map(([who, claim, citation], index) => (
                          <li key={index} className="grid grid-cols-[78px_1fr] gap-2">
                            <b className="pt-[3px] font-display text-[8px] font-normal tracking-[0.14em] text-nebula-soft">{who.replace(/^Pseudo-/, '').toUpperCase()}</b>
                            <span className="font-body text-[13.5px] leading-snug text-aether/85">
                              <span className="line-clamp-3">{claim}</span>
                              {citation && (
                                <em className={`block text-[12px] ${here.includes(index) ? 'text-star-olympian/90' : 'text-aether-faint'}`}>
                                  {citation}
                                  {here.includes(index) ? ' · these lines' : ''}
                                </em>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link href={quarrelHref(topic)} className="mt-2 inline-block font-display text-[8.5px] tracking-[0.22em] text-nebula-soft/90 hover:text-nebula-soft">
                      READ THE QUARREL →
                    </Link>
                  </li>
                );
              })}
            </ClampList>
          </ul>
        </Section>
      )}
      {block.relations.length > 0 && (
        <Section title="LINES IN THE SKY">
          <ul className="space-y-1">
            <ClampList max={10} noun="LINES">
              {block.relations.map((id) => {
                const relation = tables.relations[id];
                if (!relation) return null;
                const [from, to, type, sources] = relation;
                return (
                  <li key={id} className="flex flex-wrap items-baseline gap-x-1.5 font-body text-[14px] text-aether-muted">
                    <span style={{ color: tint(from) }}>{tables.who[from]?.[0] ?? from}</span>
                    <span className="text-aether-faint">→</span>
                    <span style={{ color: tint(to) }}>{tables.who[to]?.[0] ?? to}</span>
                    <span className="font-display text-[8px] tracking-[0.14em] text-aether-faint">
                      {type.toUpperCase()} · {sources.map((source) => (tellers[source] ?? source).toUpperCase()).join(', ')}
                    </span>
                  </li>
                );
              })}
            </ClampList>
          </ul>
        </Section>
      )}
      {Object.keys(block.stories).length > 0 && (
        <Section title="STORIES">
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(block.stories).map((id) => {
              const [title, accent] = tables.stories[id] ?? [id, ACCENT_FALLBACK];
              return (
                <Link key={id} href={`/story/${id}`} className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass px-2.5 py-1 font-body text-[13.5px] text-aether-muted hover:text-aether">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                  {title}
                </Link>
              );
            })}
          </div>
        </Section>
      )}
      {(block.works ?? []).length > 0 && (
        <Section title="ON THE LOOM">
          <ul className="space-y-2.5">
            {(block.works ?? []).map((id) => {
              const work = tables.works[id];
              if (!work) return null;
              const [title, artist, year, thumb] = work;
              return (
                <li key={id}>
                  <Link href={`/art/${id}`} className="group grid grid-cols-[84px_1fr] items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a Commons thumbnail, as the Legacy shelves load them */}
                    <img src={thumb} alt="" loading="lazy" className="h-14 w-[84px] rounded border border-white/10 object-cover" />
                    <span>
                      <span className="block font-body text-[14px] leading-tight text-aether group-hover:text-star-olympian">{title}</span>
                      <span className="block font-body text-[12px] italic leading-snug text-aether-faint">
                        {artist} · {year}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </>
  );
}

export function MarginPanel({ base, ranges, tellers, unitLabel }: { base: string; ranges: Record<string, string>; tellers: Record<string, string>; unitLabel: string }) {
  const index = useAtlasFile<MarginIndex>(marginIndexUrl(base));
  const now = useReadingNow();
  const [open, setOpen] = useState(false);
  const chunkNo = now && index.data ? index.data.chunk[now] : undefined;
  const chunk = useAtlasFile<MarginChunk>(chunkNo === undefined ? null : marginChunkUrl(base, chunkNo));
  const chunks = index.data?.chunks ?? 0;

  // the chunks either side, fetched ahead so that reading on never waits
  useEffect(() => {
    if (chunkNo === undefined) return;
    for (const near of [chunkNo + 1, chunkNo - 1]) {
      if (near >= 0 && near < chunks) loadAtlasFile(marginChunkUrl(base, near)).catch(() => {});
    }
  }, [base, chunkNo, chunks]);

  const facts = now ? (index.data?.facts[now] ?? 0) : 0;
  const block = now ? chunk.data?.blocks[now] : undefined;
  const range = now ? ranges[now] : null;

  const body = !index.data ? (
    <Quiet>{index.failed ? 'The margin could not be loaded.' : 'Reading the margin…'}</Quiet>
  ) : !now ? (
    <Quiet>The margin follows the reading line.</Quiet>
  ) : facts === 0 ? (
    <Quiet>No fact of the atlas cites these lines yet.</Quiet>
  ) : block && chunk.data ? (
    <Notes key={now} block={block} tables={chunk.data} tellers={tellers} />
  ) : (
    <Quiet>{chunk.failed ? 'The margin could not be loaded.' : 'Reading the margin…'}</Quiet>
  );
  const acrossStories = index.data ? Object.entries(index.data.across.stories) : [];
  const across = acrossStories.length > 0 ? (
    <Section title={`ACROSS ${unitLabel.toUpperCase()}`}>
      <div className="flex flex-wrap gap-1.5">
        {acrossStories.map(([id, [title, accent]]) => (
          <Link key={id} href={`/story/${id}`} className="inline-flex items-center gap-1.5 rounded-full border border-glass-border px-2.5 py-1 font-body text-[13px] text-aether-faint hover:text-aether">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            {title}
          </Link>
        ))}
      </div>
    </Section>
  ) : null;

  return (
    <>
      {/* wide screens: the column beside the text */}
      <aside aria-label="What rests on these lines" className="hidden xl:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 [scrollbar-width:thin]">
          <p className="font-display text-[10px] tracking-[0.3em] text-aether-faint">IN THESE LINES</p>
          <p className="mt-1 font-display text-[16px] tracking-[0.1em] text-aether">{range ?? '—'}</p>
          <p className="mt-1 font-body text-[14px] italic text-aether-muted">
            <span className="not-italic text-star-olympian">{facts}</span> fact{facts === 1 ? '' : 's'} of the atlas rest on these lines
          </p>
          {body}
          {across}
        </div>
      </aside>
      {/* narrower screens: a sheet that follows the reading line */}
      <div className={`fixed inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-star-olympian/40 bg-[rgba(10,6,30,0.96)] shadow-[0_-18px_50px_rgba(5,2,15,0.6)] backdrop-blur-xl transition-[height] duration-300 xl:hidden ${open ? 'h-[72svh]' : 'h-12'}`}>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex h-12 w-full flex-col items-center justify-center gap-1.5 px-4">
          <span className="h-1 w-10 rounded-full bg-white/25" />
          <span className="font-display text-[9.5px] tracking-[0.22em] text-aether-muted">
            IN THESE LINES · <span className="text-star-olympian">{range ?? '—'}</span> · {facts} FACT{facts === 1 ? '' : 'S'}
          </span>
        </button>
        {open && <div className="h-[calc(72svh-3rem)] overflow-y-auto px-5 pb-8">{body}{across}</div>}
      </div>
    </>
  );
}
