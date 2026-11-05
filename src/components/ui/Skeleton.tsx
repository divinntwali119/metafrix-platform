import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn("skeleton", className)}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="ui-panel space-y-4 p-4 sm:p-5" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-36 max-w-full" />
          <Skeleton className="h-2.5 w-24 max-w-full" />
        </div>
        <Skeleton className="h-7 w-7 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12 max-w-full" />
        <Skeleton className="h-3 w-2/3 max-w-full" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg sm:h-40" />
      <div className="flex gap-4 border-t border-(--border) pt-3">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

export function FeaturedRepositoriesSkeleton() {
  return (
    <section
      className="ui-panel feed-featured-frame space-y-4 p-4 sm:p-5"
      role="status"
      aria-label="Chargement des projets à découvrir"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden sm:gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="ui-panel feed-featured-card flex min-h-48 w-[min(82vw,19rem)] shrink-0 flex-col space-y-4 p-4 sm:w-72 sm:p-5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="mt-auto flex gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Chargement des projets en vedette…</span>
    </section>
  );
}

export function ProfileGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="ui-panel overflow-hidden">
          <Skeleton className="h-24 w-full rounded-none" />
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="-mt-8 h-14 w-14 shrink-0 rounded-full border-4" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSuggestionsSkeleton() {
  return (
    <section
      className="ui-panel space-y-4 p-4 sm:p-5"
      role="status"
      aria-label="Chargement des profils suggérés"
      aria-busy="true"
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56 max-w-full" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex w-24 shrink-0 flex-col items-center gap-2">
            <Skeleton className="h-21 w-21 rounded-full" />
            <Skeleton className="h-3 w-20 max-w-full" />
            <Skeleton className="h-3 w-16 max-w-full" />
            <Skeleton className="h-8 w-full rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">Chargement des suggestions de profils…</span>
    </section>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" aria-hidden="true">
      <Skeleton className="h-48 w-full rounded-2xl sm:h-60" />
      <div className="ui-panel relative -mt-10 space-y-5 p-5 sm:mx-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full border-4 sm:h-24 sm:w-24" />
            <div className="space-y-2 pb-1">
              <Skeleton className="h-5 w-40 max-w-full" />
              <Skeleton className="h-3 w-28 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-3 w-full max-w-2xl" />
        <Skeleton className="h-3 w-4/5 max-w-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="ui-panel space-y-3 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden space-y-4 lg:block">
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function RepositoryPageSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8" aria-hidden="true">
      <div className="space-y-4 lg:col-span-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-14 w-full" />
        <div className="ui-panel divide-y divide-(--border) overflow-hidden p-4">
          {Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 py-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-32 max-w-[33%]" />
              <Skeleton className="ml-auto hidden h-3 w-48 max-w-[33%] sm:block" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
      <div className="hidden space-y-4 lg:block">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}