import { DoorUnavailable } from '@/components/ui/DoorUnavailable';
import { Link } from '@/components/ui/Link';

function PlainPage() {
  return (
    <Link href="/art/list" className="text-star-olympian underline underline-offset-4">
      a plain page
    </Link>
  );
}

/** What either Loom door shows when it cannot weave the cloth: a load that failed can be
 *  tried again; without WebGL 2 there is only the plain list of the same works. */
export function LoomUnavailable({ webGl }: { webGl: boolean }) {
  if (webGl) {
    return (
      <DoorUnavailable
        what="The Loom"
        fallback={
          <>
            find the same works on <PlainPage />
          </>
        }
      />
    );
  }
  return (
    <div className="flex h-full items-center justify-center p-8 text-center font-body text-lg text-aether-muted">
      <p>
        The Loom needs WebGL 2. The same works are listed on <PlainPage />.
      </p>
    </div>
  );
}
