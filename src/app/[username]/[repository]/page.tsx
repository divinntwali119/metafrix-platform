"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  Folder,
  FileText,
  Clock,
  BookOpen,
  ArrowLeft,
  X,
} from "lucide-react";
import { RepoHeader } from "@/components/repository/RepoHeader";
import { RepositoryNotFound } from "@/components/repository/RepositoryNotFound";
import { RepositoryUnavailable } from "@/components/repository/RepositoryUnavailable";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { CodeSnippetViewer } from "@/components/ui/CodeSnippetViewer";
import { useRepository } from "@/hooks/useRepository";
import { repositoryService } from "@/services/repository.service";
import { formatDate } from "@/lib/utils";
import type { Commit, FileTreeItem, Repository } from "@/types";

interface PageProps {
  params: Promise<{
    username: string;
    repository: string;
  }>;
}

export default function RepositoryCodePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { username, repository: repoName } = resolvedParams;
  const { repository: repo, isLoading, error } = useRepository(username, repoName);

  if (isLoading) return <LoadingScreen />;

  return repo ? (
    <RepositoryCodeContent key={repo.id} username={username} repoName={repoName} repo={repo} />
  ) : error ? (
    <RepositoryUnavailable message={error} />
  ) : (
    <RepositoryNotFound username={username} repository={repoName} />
  );
}

function RepositoryCodeContent({
  username,
  repoName,
  repo,
}: {
  username: string;
  repoName: string;
  repo: Repository;
}) {
  const [currentBranch, setCurrentBranch] = useState(repo.defaultBranch);
  const [navigation, setNavigation] = useState<{
    branch: string;
    path: string;
    file: { path: string; name: string } | null;
  }>({ branch: repo.defaultBranch, path: "root", file: null });
  const currentPath = navigation.branch === currentBranch ? navigation.path : "root";
  const selectedFile = navigation.branch === currentBranch ? navigation.file : null;
  const [branchesResult, setBranchesResult] = useState<{
    repoId: string;
    branches: string[];
    error: string;
  } | null>(null);
  const [treeResult, setTreeResult] = useState<{
    key: string;
    items: FileTreeItem[];
    error: string;
  } | null>(null);
  const [commitsResult, setCommitsResult] = useState<{
    key: string;
    items: Commit[];
    error: string;
  } | null>(null);
  const [fileResult, setFileResult] = useState<{
    key: string;
    content: string | null;
    error: string;
  } | null>(null);
  const [readmeResult, setReadmeResult] = useState<{
    key: string;
    content: string | null;
  } | null>(null);

  const treeKey = `${repo.id}:${currentBranch}:${currentPath}`;
  const commitsKey = `${repo.id}:${currentBranch}`;
  const fileKey = selectedFile ? `${repo.id}:${currentBranch}:${selectedFile.path}` : "";
  const readmeKey = `${repo.id}:${currentBranch}:README.md`;
  const branches = branchesResult?.repoId === repo.id ? branchesResult.branches : [];
  const branchesError = branchesResult?.repoId === repo.id ? branchesResult.error : "";
  const branchOptions = branches.includes(repo.defaultBranch)
    ? branches
    : [repo.defaultBranch, ...branches];
  const currentTreeResult = treeResult?.key === treeKey ? treeResult : null;
  const fileTree = currentTreeResult?.items || [];
  const currentCommitsResult = commitsResult?.key === commitsKey ? commitsResult : null;
  const repoCommits = currentCommitsResult?.items || [];
  const latestCommit = repoCommits[0];
  const currentFileResult = fileResult?.key === fileKey ? fileResult : null;
  const readmeContent = readmeResult?.key === readmeKey ? readmeResult.content : null;

  useEffect(() => {
    let active = true;
    void repositoryService.getBranches(repo.id).then((items) => {
      if (active) setBranchesResult({ repoId: repo.id, branches: items, error: "" });
    }).catch(() => {
      if (active) {
        setBranchesResult({ repoId: repo.id, branches: [], error: "Impossible de charger les branches." });
      }
    });
    return () => {
      active = false;
    };
  }, [repo.id]);

  useEffect(() => {
    let active = true;
    void repositoryService.getFileTree(repo.id, currentPath, currentBranch).then((items) => {
      if (active) setTreeResult({ key: treeKey, items, error: "" });
    }).catch(() => {
      if (active) {
        setTreeResult({ key: treeKey, items: [], error: "Impossible de charger cette arborescence." });
      }
    });
    return () => {
      active = false;
    };
  }, [currentBranch, currentPath, repo.id, treeKey]);

  useEffect(() => {
    let active = true;
    void repositoryService.getCommits(repo.id, currentBranch).then((items) => {
      if (active) setCommitsResult({ key: commitsKey, items, error: "" });
    }).catch(() => {
      if (active) setCommitsResult({ key: commitsKey, items: [], error: "Impossible de charger les commits." });
    });
    return () => {
      active = false;
    };
  }, [commitsKey, currentBranch, repo.id]);

  useEffect(() => {
    if (!selectedFile) return;
    let active = true;
    void repositoryService.getFileContent(repo.id, selectedFile.path, currentBranch).then((content) => {
      if (active) setFileResult({ key: fileKey, content, error: "" });
    }).catch(() => {
      if (active) {
        setFileResult({ key: fileKey, content: null, error: "Ce fichier ne peut pas être affiché en ligne." });
      }
    });
    return () => {
      active = false;
    };
  }, [currentBranch, fileKey, repo.id, selectedFile]);

  useEffect(() => {
    let active = true;
    void repositoryService.getFileContent(repo.id, "README.md", currentBranch).then((content) => {
      if (active) setReadmeResult({ key: readmeKey, content });
    }).catch(() => {
      if (active) setReadmeResult({ key: readmeKey, content: null });
    });
    return () => {
      active = false;
    };
  }, [currentBranch, readmeKey, repo.id]);

  const handleItemClick = (item: FileTreeItem) => {
    if (item.type === "dir") {
      setNavigation({ branch: currentBranch, path: item.path, file: null });
    } else {
      setNavigation({
        branch: currentBranch,
        path: currentPath,
        file: { path: item.path, name: item.name },
      });
    }
  };

  const getLanguageForFile = (filename: string) => {
    if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
    if (filename.endsWith(".py")) return "python";
    if (filename.endsWith(".go")) return "go";
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".md")) return "markdown";
    return "text";
  };

  const formatFileSize = (size: FileTreeItem["size"]) => {
    if (typeof size === "string") return size;
    if (typeof size !== "number") return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#09090B]">
      <RepoHeader repository={repo} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Code View (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Top Toolbar: Branch selector, Path breadcrumbs & commits link */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                {/* Branch selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] text-zinc-200">
                  <GitBranch className="h-3.5 w-3.5 text-[#818CF8]" />
                  {branches.length > 0 ? (
                    <select
                      value={currentBranch}
                      onChange={(e) => setCurrentBranch(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
                    >
                      {branchOptions.map((branch) => (
                        <option key={branch} value={branch} className="bg-[#18181B]">
                          {branch}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-semibold text-white">
                      {branchesError || currentBranch}
                    </span>
                  )}
                </div>

                {/* Path breadcrumb */}
                {currentPath !== "root" && (
                  <button
                    onClick={() => {
                      setNavigation({ branch: currentBranch, path: "root", file: null });
                    }}
                    className="flex items-center gap-1 text-xs text-[#818CF8] hover:underline"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Racine</span>
                  </button>
                )}
                <span className="font-mono text-zinc-400">
                  {repo.name} / {currentPath !== "root" ? currentPath : ""}
                </span>
              </div>

              <div className="flex items-center gap-4 text-[#A1A1AA]">
                <Link
                  href={`/${username}/${repoName}/commits`}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {currentCommitsResult
                      ? `${repoCommits.length} commits`
                      : "Chargement des commits…"}
                  </span>
                </Link>
                <span className="hidden sm:inline">Branche {currentBranch}</span>
              </div>
            </div>

            {/* Latest Commit Bar */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#111113] border border-[#27272A] text-xs">
              {latestCommit ? (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={latestCommit.author.avatar}
                      alt={latestCommit.author.name}
                      className="ui-avatar h-5 w-5 shrink-0 rounded-full object-cover"
                    />
                    <span className="font-medium text-white truncate">
                      {latestCommit.author.name}
                    </span>
                    <span className="text-[#A1A1AA] truncate hidden sm:inline">
                      {latestCommit.message}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#A1A1AA] shrink-0">
                    <span className="text-[#818CF8]">{latestCommit.shortSha}</span>
                    <span>•</span>
                    <span>{formatDate(latestCommit.date)}</span>
                  </div>
                </>
              ) : (
                <span className="text-[#A1A1AA]">
                  {currentCommitsResult?.error || (currentCommitsResult ? "Aucun commit sur cette branche." : "Chargement des commits…")}
                </span>
              )}
            </div>

            {/* If a file is selected, show file viewer */}
            {selectedFile ? (
              <div className="space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between bg-[#111113] border border-[#27272A] p-3 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#818CF8]" />
                    <span className="font-semibold text-white">
                      {selectedFile.path}
                    </span>
                  </div>
                  <button
                    onClick={() => setNavigation({ branch: currentBranch, path: currentPath, file: null })}
                    className="p-1 rounded hover:bg-[#18181B] text-[#A1A1AA] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {currentFileResult?.error ? (
                  <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
                    {currentFileResult.error}
                  </p>
                ) : (
                  <CodeSnippetViewer
                    code={currentFileResult?.content ?? "Chargement du fichier…"}
                    language={getLanguageForFile(selectedFile.name)}
                    filename={selectedFile.name}
                  />
                )}
              </div>
            ) : (
              /* File Tree Table */
              <div className="overflow-hidden rounded-xl border border-[#27272A] bg-[#111113]">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    {!currentTreeResult ? (
                      <tr><td colSpan={3} role="status" className="px-4 py-8 text-center text-[#A1A1AA]">Chargement de l’arborescence…</td></tr>
                    ) : currentTreeResult.error ? (
                      <tr><td colSpan={3} role="alert" className="px-4 py-8 text-center text-rose-300">{currentTreeResult.error}</td></tr>
                    ) : fileTree.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-[#A1A1AA]">Aucun fichier sur cette branche.</td></tr>
                    ) : fileTree.map((item) => (
                      <tr
                        key={item.path}
                        tabIndex={0}
                        aria-label={`${item.type === "dir" ? "Ouvrir le dossier" : "Afficher le fichier"} ${item.name}`}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleItemClick(item);
                          }
                        }}
                        onClick={() => handleItemClick(item)}
                        className="group cursor-pointer border-b border-[#27272A]/40 transition-colors hover:bg-[#18181B] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#818CF8]"
                      >
                        <td className="flex max-w-55 items-center gap-2.5 px-3.5 py-2.5">
                          {item.type === "dir" ? (
                            <Folder className="h-4 w-4 text-[#818CF8] fill-[#818CF8]/20 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                          )}
                          <span className="text-zinc-200 group-hover:text-[#818CF8] transition-colors font-medium truncate">
                            {item.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-[#A1A1AA] text-right hidden md:table-cell">
                          {item.type === "file" ? formatFileSize(item.size) : ""}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                          {item.type === "dir" ? "Dossier" : "Fichier"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* README content is displayed as text, never injected as HTML. */}
            <div className="rounded-xl border border-[#27272A] bg-[#111113] overflow-hidden mt-6">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#27272A] bg-[#18181B]/50 text-xs font-semibold text-white">
                <BookOpen className="h-4 w-4 text-[#818CF8]" />
                <span>README.md</span>
              </div>
              <div className="p-5 text-sm text-zinc-200">
                {readmeContent === null ? (
                  <p className="text-[#A1A1AA]">
                    {readmeResult?.key === readmeKey
                      ? "Ce dépôt ne contient pas de README.md."
                      : "Chargement du README…"}
                  </p>
                ) : (
                  <pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word font-mono text-xs leading-relaxed text-zinc-300">
                    {readmeContent}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Repo Sidebar (1 col) */}
          <div className="space-y-6">
            {/* About */}
            <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-4">
              <h3 className="text-sm font-semibold text-white">À propos</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                {repo.description}
              </p>

              {/* Topics */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {repo.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-[#18181B] border border-[#27272A] px-2.5 py-0.5 text-[11px] font-medium text-[#818CF8] hover:bg-[#27272A] transition-colors"
                  >
                    #{topic}
                  </span>
                ))}
              </div>

              {/* Meta details */}
              <div className="space-y-2.5 pt-3 border-t border-[#27272A] text-xs text-[#A1A1AA]">
                <div className="flex items-center justify-between">
                  <span>Licence</span>
                  <span className="font-semibold text-white">{repo.license || "Non spécifiée"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taille du dépôt</span>
                  <span className="font-mono text-zinc-300">{repo.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dernière activité</span>
                  <span className="text-zinc-300">{formatDate(repo.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Contributors */}
            <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-3">
              <h3 className="text-sm font-semibold text-white">Propriétaire</h3>
              <div className="flex items-center -space-x-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={repo.owner.avatar}
                  alt={repo.owner.name}
                  className="ui-avatar h-8 w-8 rounded-full border-2 border-[#111113] object-cover"
                />
              </div>
            </div>

            {/* Languages breakdown */}
            <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-3">
              <h3 className="text-sm font-semibold text-white">Langage principal</h3>
              {repo.language ? (
                <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-[#818CF8]"
                    style={repo.languageColor ? { backgroundColor: repo.languageColor } : undefined}
                  />
                  {repo.language}
                </div>
              ) : (
                <p className="text-xs text-[#A1A1AA]">Langage non renseigné.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
