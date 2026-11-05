import type { ReactNode } from 'react';

/** What a door shows if its baked data never arrives: a way to try again and, where a
 *  door has one, another way to the same things. */
export function DoorUnavailable({ what, fallback }: { what: string; fallback?: ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-8 text-center font-body text-lg text-aether-muted">
      <p>
        {what} could not be loaded.{' '}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-star-olympian underline underline-offset-4"
        >
          Try again
        </button>
        {fallback ? <>, or {fallback}</> : null}.
      </p>
    </div>
  );
}
