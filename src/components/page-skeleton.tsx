/**
 * Calm loading placeholder used as the `Suspense` fallback on app routes.
 * Mirrors the page rhythm (header row, title, stacked cards) so the static
 * shell never shifts when the real content streams in.
 */
export function PageSkeleton({
  rows = 3,
  title = true,
}: {
  rows?: number;
  title?: boolean;
}) {
  return (
    <div className="w-full flex flex-col gap-3" aria-hidden="true">
      <div className="flex justify-end">
        <div className="h-12 w-44 rounded-full bg-[#F2F2F2] animate-pulse motion-reduce:animate-none" />
      </div>

      {title && (
        <div className="mt-6 md:mt-8 h-9 sm:h-10 w-56 rounded-2xl bg-[#F2F2F2] animate-pulse motion-reduce:animate-none" />
      )}

      <div className="mt-2 flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="w-full h-[72px] rounded-2xl bg-[#F2F2F2] animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}
