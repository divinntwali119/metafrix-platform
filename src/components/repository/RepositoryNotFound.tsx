import Link from "next/link";
import { FolderX } from "lucide-react";

interface RepositoryNotFoundProps {
  username: string;
  repository: string;
}

export function RepositoryNotFound({ username, repository }: RepositoryNotFoundProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <FolderX className="h-10 w-10 text-[#8b949e]" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-semibold text-[#e6edf3]">Dépôt introuvable</h1>
      <p className="mt-2 text-sm text-[#8b949e]">
        Le dépôt {username}/{repository} n&apos;existe pas ou n&apos;est pas accessible.
      </p>
      <Link href="/feed" className="mt-5 text-sm text-[#2f81f7] hover:underline">
        Retour au fil
      </Link>
    </div>
  );
}