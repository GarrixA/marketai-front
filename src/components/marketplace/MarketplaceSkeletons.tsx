function Bone({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block animate-pulse rounded bg-soko-line/80 ${className}`}
      aria-hidden
    />
  );
}

export function SellerOfferCardSkeleton() {
  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-xl border border-soko-line bg-white p-4.5"
      aria-hidden
    >
      <div className="flex items-start gap-3">
        <Bone className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-4 w-20 rounded-full" />
          <Bone className="h-5 w-3/4" />
          <Bone className="h-3 w-1/2" />
        </div>
      </div>
      <Bone className="mt-3 h-8 w-full" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Bone className="h-16 rounded-lg" />
        <Bone className="h-16 rounded-lg" />
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 border-t border-soko-line pt-3">
        <div className="space-y-2">
          <Bone className="h-2.5 w-24" />
          <Bone className="h-5 w-20" />
        </div>
        <Bone className="h-3.5 w-16" />
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-1.75 border border-soko-line bg-white"
      aria-hidden
    >
      <Bone className="h-36 w-full rounded-none" />
      <div className="flex flex-1 flex-col px-3 py-3.5 sm:px-4.5 sm:py-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
          <Bone className="h-5 w-16 shrink-0 rounded-full" />
        </div>
        <Bone className="mb-2 h-5 w-28" />
        <Bone className="mb-2 h-3 w-24" />
        <Bone className="mb-3 h-3 w-full" />
        <Bone className="mt-auto h-8 w-18 rounded-md" />
      </div>
    </article>
  );
}

export function SellerProfileSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading seller…</span>
      <div className="rounded-2xl border border-soko-line bg-white p-6">
        <div className="flex items-start gap-4">
          <Bone className="h-16 w-16 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3">
            <Bone className="h-4 w-24 rounded-full" />
            <Bone className="h-7 w-1/2" />
            <Bone className="h-3.5 w-2/3" />
            <Bone className="h-10 w-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function SourceSectionHeaderSkeleton() {
  return (
    <div className="mb-7.5 space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <Bone className="h-3 w-28" />
      <Bone className="h-9 w-72 max-w-full max-sm:h-8" />
      <Bone className="h-4 w-full max-w-xl" />
      <Bone className="h-4 w-2/3 max-w-md" />
    </div>
  );
}

export function SellerOfferGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading sellers…</span>
      {Array.from({ length: count }, (_, i) => (
        <SellerOfferCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductCardGridSkeleton({
  count = 8,
  className = "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading listings…</span>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
