"use client";

import { useEffect, useState } from "react";

import { useAfriHubStore } from "@/lib/store";
import { repositoryService } from "@/services/repository.service";
import type { Repository } from "@/types";

export function useRepository(owner: string, name: string) {
  const upsertRepository = useAfriHubStore((state) => state.upsertRepository);
  const [result, setResult] = useState<{
    key: string;
    repository: Repository | null;
    error: string;
  } | null>(null);
  const key = `${owner.toLowerCase()}/${name.toLowerCase()}`;

  useEffect(() => {
    let active = true;
    void repositoryService
      .getRepository(owner, name)
      .then((repository) => {
        if (!active) return;
        if (repository) upsertRepository(repository);
        setResult({ key, repository, error: "" });
      })
      .catch(() => {
        if (active) {
          setResult({
            key,
            repository: null,
            error: "Impossible de charger ce dépôt. Réessayez plus tard.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [key, name, owner, upsertRepository]);

  const hasResult = result?.key === key;

  return {
    repository: hasResult ? result.repository : null,
    isLoading: !hasResult,
    error: hasResult ? result.error : "",
  };
}
