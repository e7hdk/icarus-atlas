/** What a door shows if its baked data never arrives. */
export function DoorUnavailable({ what }: { what: string }) {
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
        .
      </p>
    </div>
  );
}
