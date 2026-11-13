"use client";

interface RepositoryUnavailableProps {
  message: string;
}

export function RepositoryUnavailable({ message }: RepositoryUnavailableProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p role="alert" className="text-sm text-rose-300">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg border border-white/15 px-4 py-2 text-sm text-white transition-colors hover:bg-white/5"
      >
        Réessayer
      </button>
    </div>
  );
}
