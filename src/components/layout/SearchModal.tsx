"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FolderGit2, User, CheckCircle2, ArrowRight, MessageSquare, LoaderCircle } from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { BrandMark } from "@/components/layout/BrandMark";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { repositoryService } from "@/services/repository.service";
import { socialService } from "@/services/social.service";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Post, Repository, User as Developer } from "@/types";

interface ApiSearchResults {
  query: string;
  repositories: Repository[];
  users: Developer[];
  posts: Post[];
  error: string | null;
}

export function SearchModal() {
  const router = useRouter();
  const { isSearchOpen, setIsSearchOpen, repositories, users, posts, issues, currentUser, isAuthenticated } = useAfriHubStore();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const [query, setQuery] = useState("");
  const [apiResults, setApiResults] = useState<ApiSearchResults | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen || isDemoMode) return;
    const searchQuery = query.trim();
    let active = true;
    const timeoutId = window.setTimeout(() => {
      void Promise.allSettled([
        repositoryService.getRepositories({ search: searchQuery || undefined, page_size: 4 }),
        socialService.getDevelopers({ search: searchQuery || undefined, page_size: 4 }),
        searchQuery
          ? socialService.getPosts({ search: searchQuery, page_size: 4 })
          : Promise.resolve({ count: 0, next: null, previous: null, results: [] as Post[] }),
      ]).then(([repositoryResult, developerResult, postResult]) => {
        if (!active) return;
        const failures = [repositoryResult, developerResult, postResult].filter(
          (result) => result.status === "rejected",
        );
        const requestCount = searchQuery ? 3 : 2;
        if (failures.length === requestCount) {
          setApiResults({
            query: searchQuery,
            repositories: [],
            users: [],
            posts: [],
            error: getApiErrorMessage(failures[0].reason, "La recherche est momentanément indisponible."),
          });
          return;
        }
        setApiResults({
          query: searchQuery,
          repositories: repositoryResult.status === "fulfilled" ? repositoryResult.value : [],
          users: developerResult.status === "fulfilled" ? developerResult.value.results : [],
          posts: postResult.status === "fulfilled" ? postResult.value.results : [],
          error: failures.length > 0 ? "Certains résultats n’ont pas pu être chargés." : null,
        });
      });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [isDemoMode, isSearchOpen, query]);

  if (!isSearchOpen) return null;

  const currentApiResults = apiResults?.query === query.trim() ? apiResults : null;
  const isApiLoading = !isDemoMode && currentApiResults === null;
  const filteredRepos = isDemoMode
    ? query.trim()
      ? repositories.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          (r.description || "").toLowerCase().includes(query.toLowerCase()) ||
          r.language.toLowerCase().includes(query.toLowerCase())
      )
      : repositories.slice(0, 3)
    : currentApiResults?.repositories ?? [];

  const filteredUsers = isDemoMode
    ? query.trim()
      ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      )
      : users.slice(0, 3)
    : currentApiResults?.users ?? [];

  const filteredPosts = isDemoMode
    ? query.trim()
      ? posts.filter((p) => p.content.toLowerCase().includes(query.toLowerCase()))
      : []
    : currentApiResults?.posts ?? [];

  const filteredIssues = isDemoMode && query.trim()
    ? issues.filter(
        (issue) =>
          issue.title.toLowerCase().includes(query.toLowerCase()) ||
          issue.body.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const hasResults =
    filteredRepos.length > 0 ||
    filteredUsers.length > 0 ||
    filteredPosts.length > 0 ||
    filteredIssues.length > 0;

  const handleSelect = (url: string) => {
    setIsSearchOpen(false);
    setQuery("");
    router.push(url);
  };

  const getDeveloperUrl = (user: Developer) =>
    isAuthenticated && user.id === currentUser.id
      ? "/dashboard"
      : `/developers/${encodeURIComponent(user.username)}`;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const firstRepo = filteredRepos[0];
      if (firstRepo) {
        handleSelect(`/${firstRepo.owner.username}/${firstRepo.name}`);
        return;
      }

      const firstUser = filteredUsers[0];
      if (firstUser) {
        handleSelect(getDeveloperUrl(firstUser));
        return;
      }

      if (filteredPosts.length > 0) {
        handleSelect(`/feed#${filteredPosts[0].id}`);
        return;
      }

      if (filteredIssues.length > 0) {
        handleSelect("/dashboard");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 px-4 pt-20 animate-in fade-in duration-150"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsSearchOpen(false);
      }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-[#30363d] bg-[#161b22] shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Recherche MetafriX"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#27272A] gap-3">
          <Search className="h-5 w-5 text-[#8b949e]" />
          <input
            type="text"
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Rechercher des dépôts, développeurs ou publications"
            placeholder="Rechercher des dépôts, développeurs, publications..."
            className="w-full bg-transparent text-sm text-white placeholder-[#A1A1AA] outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[#A1A1AA] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="rounded bg-[#18181B] px-2 py-0.5 text-xs text-[#A1A1AA] border border-[#27272A] hover:text-white"
          >
            Échap
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {isApiLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#8b949e]" role="status">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Recherche en cours…
            </div>
          )}

          {currentApiResults?.error && (
            <div className="py-8 text-center text-sm text-[#f85149]" role="alert">
              {currentApiResults.error}
            </div>
          )}

          {/* Repositories */}
          {filteredRepos.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                <span>Dépôts ({filteredRepos.length})</span>
                <FolderGit2 className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-1">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleSelect(`/${repo.owner.username}/${repo.name}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#18181B] border border-transparent hover:border-[#27272A] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#18181B] border border-[#27272A] group-hover:border-[#6366F1]/50">
                        <FolderGit2 className="h-4 w-4 text-[#818CF8]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-[#818CF8] flex items-center gap-2">
                          <span>{repo.owner.username} / {repo.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#27272A] text-zinc-300">
                            {repo.language}
                          </span>
                        </div>
                        <p className="text-xs text-[#A1A1AA] line-clamp-1">
                          {repo.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Developers */}
          {filteredUsers.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                <span>Développeurs ({filteredUsers.length})</span>
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(getDeveloperUrl(user))}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#18181B] border border-transparent hover:border-[#27272A] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarImage
                        src={user.avatar}
                        alt={user.name}
                        className="ui-avatar h-8 w-8 rounded-full object-cover border border-[#27272A]"
                      />
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-[#818CF8]">
                          {user.name}{" "}
                          <span className="text-xs text-[#A1A1AA]">@{user.username}</span>
                        </div>
                        <p className="text-xs text-[#A1A1AA] line-clamp-1">{user.bio}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#818CF8] font-medium">Voir profil</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Posts / Discussions */}
          {filteredPosts.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                <span>Publications & Code</span>
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                {filteredPosts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => handleSelect("/feed")}
                    className="w-full p-2.5 rounded-xl hover:bg-[#18181B] border border-transparent hover:border-[#27272A] transition-all text-left"
                  >
                    <p className="text-xs font-semibold text-zinc-300">
                      Par @{post.author.username}
                    </p>
                    <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-0.5">
                      {post.content}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredIssues.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
                <span>Issues ({filteredIssues.length})</span>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-1">
                {filteredIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => handleSelect("/dashboard")}
                    className="w-full rounded-md border border-transparent p-2.5 text-left transition-colors hover:border-[#30363d] hover:bg-[#21262d]"
                  >
                    <p className="text-sm font-medium text-[#e6edf3]">{issue.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#8b949e]">{issue.body}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() && !isApiLoading && !currentApiResults?.error && !hasResults && (
            <div className="py-8 text-center text-sm text-[#A1A1AA]">
              Aucun résultat trouvé pour &quot;{query}&quot;
            </div>
          )}

          {!query.trim() && !isApiLoading && !hasResults && !currentApiResults?.error && (
            <div className="py-8 text-center text-sm text-[#A1A1AA]">
              Saisissez un nom, un langage ou un mot-clé pour rechercher.
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2.5 bg-[#18181B]/50 border-t border-[#27272A] flex items-center justify-between text-[11px] text-[#A1A1AA]">
          <span>Entrée pour ouvrir le premier résultat · Échap pour fermer</span>
          <span className="flex items-center gap-1.5">
            <BrandMark size={16} className="h-4 w-4" />
            <span>MetafriX</span>
          </span>
        </div>
      </div>
    </div>
  );
}
