import Link from "next/link";
import { Construction } from "lucide-react";

interface FeatureUnavailableProps {
  title: string;
  description: string;
}

export function FeatureUnavailable({ title, description }: FeatureUnavailableProps) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center px-4 py-12">
      <section
        role="status"
        className="w-full rounded-2xl border border-(--border) bg-(--card) p-7 text-center shadow-sm sm:p-10"
      >
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-(--muted) text-(--accent)">
          <Construction className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-(--accent)">
          Fonctionnalité en développement
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-(--primary-text)">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-(--secondary-text)">{description}</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-(--action) px-4 text-sm font-semibold text-white transition-colors hover:bg-(--action-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
        >
          Retour au tableau de bord
        </Link>
      </section>
    </div>
  );
}
