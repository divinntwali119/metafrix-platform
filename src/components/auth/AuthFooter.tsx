import Link from "next/link";

export function AuthFooter() {
  return (
    <footer className="mt-6 flex items-center justify-center gap-5 text-xs text-(--secondary-text)">
      <Link
        href="/about#conditions"
        className="transition-colors hover:text-(--primary-text)"
      >
        Conditions d’utilisation
      </Link>
      <span className="h-1 w-1 rounded-full bg-(--border)" aria-hidden="true" />
      <Link
        href="/about#confidentialite"
        className="transition-colors hover:text-(--primary-text)"
      >
        Politique de confidentialité
      </Link>
    </footer>
  );
}