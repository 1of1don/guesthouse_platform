interface GuesthouseSkeletonGridProps {
  count?: number;
}

// Grey placeholder cards with the same shape as PropertyCard,
// shown while the guesthouse list is loading.
export default function GuesthouseSkeletonGrid({ count = 6 }: GuesthouseSkeletonGridProps) {
  const bar = 'rounded bg-black/[0.07] dark:bg-white/[0.07]';

  return (
    <div
      role="status"
      aria-label="Loading guesthouses"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="glass-card rounded-2xl overflow-hidden flex flex-col">
          <div className="aspect-16/10 bg-black/[0.06] dark:bg-white/[0.06]" />
          <div className="p-4 space-y-3">
            <div className={`h-3 w-1/3 ${bar}`} />
            <div className={`h-4 w-3/4 ${bar}`} />
            <div className={`h-3 w-full ${bar}`} />
            <div className={`h-3 w-5/6 ${bar}`} />
            <div className="flex gap-2 pt-1">
              <div className={`h-6 w-16 rounded-lg ${bar}`} />
              <div className={`h-6 w-20 rounded-lg ${bar}`} />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
              <div className={`h-5 w-20 ${bar}`} />
              <div className={`h-8 w-24 rounded-xl ${bar}`} />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading guesthouses...</span>
    </div>
  );
}
