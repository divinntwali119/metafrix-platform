"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  Folder,
  FileText,
  GitCommit,
  Clock,
  BookOpen,
  ArrowLeft,
  X,
  Gauge,
  Globe2,
  Rocket,
} from "lucide-react";
import { RepoHeader } from "@/components/repository/RepoHeader";
import { RepositoryNotFound } from "@/components/repository/RepositoryNotFound";
import { CodeSnippetViewer } from "@/components/ui/CodeSnippetViewer";
import { useAfriHubStore } from "@/lib/store";
import { mockFileTree, mockFileContents, mockCommits } from "@/lib/mock-data";

interface PageProps {
  params: Promise<{
    username: string;
    repository: string;
  }>;
}

export default function RepositoryCodePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { username, repository: repoName } = resolvedParams;
  const { repositories } = useAfriHubStore();

  const repo =
    repositories.find(
      (r) =>
        r.name.toLowerCase() === repoName.toLowerCase() &&
        r.owner.username.toLowerCase() === username.toLowerCase()
    );

  return repo ? (
    <RepositoryCodeContent username={username} repoName={repoName} repo={repo} />
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
  repo: import("@/types").Repository;
}) {
  const [currentBranch, setCurrentBranch] = useState("main");
  const [currentPath, setCurrentPath] = useState("root");
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string } | null>(null);

  const fileTree = mockFileTree[currentPath] || mockFileTree["root"];
  const repoCommits = mockCommits.filter((commit) => commit.repositoryId === repo.id);
  const latestCommit = repoCommits[0];

  const handleItemClick = (item: { name: string; path: string; type: "file" | "dir" }) => {
    if (item.type === "dir") {
      setCurrentPath(item.path);
      setSelectedFile(null);
    } else {
      setSelectedFile({ path: item.path, name: item.name });
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

  const getFileContent = (path: string) => {
    return (
      mockFileContents[path] ||
      mockFileContents[selectedFile?.name || ""] ||
      `// Fichier : ${path}\n// Connecté au système de fichiers MetafriX Git\n\nexport default function handler() {\n  return { status: 200, message: "OK" };\n}`
    );
  };

  if (repo.id !== "repo-afripay" || !latestCommit) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <RepoHeader repository={repo} />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <GitCommit className="mx-auto h-8 w-8 text-[#8b949e]" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-semibold text-[#e6edf3]">Fichiers non disponibles</h1>
          <p className="mt-1 text-sm text-[#8b949e]">
            Le navigateur de fichiers de ce dépôt n&apos;est pas encore disponible.
          </p>
        </div>
      </div>
    );
  }

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
                  <select
                    value={currentBranch}
                    onChange={(e) => setCurrentBranch(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
                  >
                    <option value="main" className="bg-[#18181B]">main</option>
                    <option value="feature/wave-ci-sn" className="bg-[#18181B]">feature/wave-ci-sn</option>
                    <option value="v2.4-release" className="bg-[#18181B]">v2.4-release</option>
                  </select>
                </div>

                {/* Path breadcrumb */}
                {currentPath !== "root" && (
                  <button
                    onClick={() => {
                      setCurrentPath("root");
                      setSelectedFile(null);
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
                  <span>{repoCommits.length} commits</span>
                </Link>
                <span className="hidden sm:inline">Branche principale</span>
              </div>
            </div>

            {/* Latest Commit Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#111113] border border-[#27272A] text-xs">
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
                <span>il y a 3h</span>
              </div>
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
                    onClick={() => setSelectedFile(null)}
                    className="p-1 rounded hover:bg-[#18181B] text-[#A1A1AA] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <CodeSnippetViewer
                  code={getFileContent(selectedFile.path)}
                  language={getLanguageForFile(selectedFile.name)}
                  filename={selectedFile.name}
                />
              </div>
            ) : (
              /* File Tree Table */
              <div className="overflow-hidden rounded-xl border border-[#27272A] bg-[#111113]">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    {fileTree.map((item) => (
                      <tr
                        key={item.path}
                        onClick={() => handleItemClick(item)}
                        className="border-b border-[#27272A]/40 hover:bg-[#18181B] cursor-pointer transition-colors group"
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
                        <td className="py-2.5 px-3.5 text-[#A1A1AA] truncate hidden md:table-cell">
                          {item.lastCommitMessage}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                          {item.lastCommitDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Interactive README Rendered Box */}
            <div className="rounded-xl border border-[#27272A] bg-[#111113] overflow-hidden mt-6">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#27272A] bg-[#18181B]/50 text-xs font-semibold text-white">
                <BookOpen className="h-4 w-4 text-[#818CF8]" />
                <span>README.md</span>
              </div>
              <div className="p-6 text-sm text-zinc-200 space-y-4 leading-relaxed prose prose-invert max-w-none">
                <h1 className="text-2xl font-bold text-white border-b border-[#27272A] pb-2">
                  <span className="inline-flex items-center gap-2">
                    <Globe2 className="h-5 w-5 text-[#818CF8]" aria-hidden="true" />
                    {repo.name}
                  </span>
                </h1>
                <p className="text-[#A1A1AA]">{repo.description}</p>
                <div className="flex gap-2 py-2">
                  <span className="px-2 py-0.5 rounded bg-[#6366F1]/20 text-[#818CF8] text-xs font-mono border border-[#6366F1]/30">
                    MetafriX CI Passing
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono border border-emerald-500/30">
                    v2.4.0
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-mono border border-amber-500/30">
                    MIT License
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white pt-2">
                  <span className="inline-flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
                    Caractéristiques principales
                  </span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-xs text-[#A1A1AA]">
                  <li>Intégration directe M-Pesa, Wave, Orange Money et MTN MoMo.</li>
                  <li>Architecture résiliente et gestion d&apos;idempotence native.</li>
                  <li>Documentation complète et SDK TypeScript précompilé.</li>
                </ul>

                <h3 className="text-base font-semibold text-white pt-2">
                  <span className="inline-flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-[#818CF8]" aria-hidden="true" />
                    Installation rapide
                  </span>
                </h3>
                <div className="rounded-lg bg-[#09090B] border border-[#27272A] p-3 font-mono text-xs text-emerald-400">
                  npm install @metafrix/afri-pay
                </div>
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
                  <span className="font-semibold text-white">{repo.license || "MIT"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taille du dépôt</span>
                  <span className="font-mono text-zinc-300">{repo.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dernière activité</span>
                  <span className="text-zinc-300">hier</span>
                </div>
              </div>
            </div>

            {/* Contributors */}
            <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-3">
              <h3 className="text-sm font-semibold text-white">Contributeurs (4)</h3>
              <div className="flex items-center -space-x-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={repo.owner.avatar}
                  alt={repo.owner.name}
                  className="ui-avatar h-8 w-8 rounded-full border-2 border-[#111113] object-cover"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                  alt="Amara"
                  className="ui-avatar h-8 w-8 rounded-full border-2 border-[#111113] object-cover"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80"
                  alt="Fatou"
                  className="ui-avatar h-8 w-8 rounded-full border-2 border-[#111113] object-cover"
                />
              </div>
            </div>

            {/* Languages breakdown */}
            <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-3">
              <h3 className="text-sm font-semibold text-white">Langages</h3>
              <div className="h-2 w-full rounded-full overflow-hidden flex bg-[#18181B]">
                <div className="h-full bg-[#3178c6]" style={{ width: "88%" }} />
                <div className="h-full bg-[#3572A5]" style={{ width: "9%" }} />
                <div className="h-full bg-emerald-500" style={{ width: "3%" }} />
              </div>
              <div className="space-y-1 text-xs text-[#A1A1AA] pt-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#3178c6]" />
                    TypeScript
                  </span>
                  <span>88.0%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#3572A5]" />
                    Python
                  </span>
                  <span>9.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Shell
                  </span>
                  <span>2.8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
