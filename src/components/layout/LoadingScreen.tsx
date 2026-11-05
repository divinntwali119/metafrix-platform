import { BrandMark } from "@/components/layout/BrandMark";

export function LoadingScreen() {
  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      aria-busy="true"
      className="fixed inset-0 z-9999 grid min-h-dvh place-items-center bg-background"
    >
      <BrandMark
        size={64}
        className="h-14 w-14 animate-pulse motion-reduce:animate-none"
      />
      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}
