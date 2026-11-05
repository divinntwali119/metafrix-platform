"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FolderGit2, User, CheckCircle2, ArrowRight, MessageSquare } from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { BrandMark } from "@/components/layout/BrandMark";

export function SearchModal() {
  const router = useRouter();
  const { isSearchOpen, setIsSearchOpen, repositories, users, posts, issues } = useAfriHubStore();
  const [query, setQuery] = useState("");
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

  if (!isSearchOpen) return null;

  const filteredRepos = query.trim()
    ? repositories.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.description.toLowerCase().includes(query.toLowerCase()) ||
          r.language.toLowerCase().includes(query.toLowerCase())
      )
    : repositories.slice(0, 3);

  const filteredUsers = query.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      )
    : users.slice(0, 3);

  const filteredPosts = query.trim()
    ? posts.filter((p) => p.content.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredIssues = query.trim()
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const firstRepo = filteredRepos[0];
      if (firstRepo) {
        handleSelect(`/${firstRepo.owner.username}/${firstRepo.name}`);
        return;
      }

      const firstUser = filteredUsers[0];
      if (firstUser) {
        handleSelect(`/developers/${firstUser.username}`);
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
            aria-label="Rechercher des dépôts, développeurs, publications ou issues"
            placeholder="Rechercher des dépôts, développeurs, code, discussions..."
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
                    onClick={() => handleSelect(`/developers/${user.username}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#18181B] border border-transparent hover:border-[#27272A] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
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

          {query.trim() && !hasResults && (
            <div className="py-8 text-center text-sm text-[#A1A1AA]">
              Aucun résultat trouvé pour &quot;{query}&quot;
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
