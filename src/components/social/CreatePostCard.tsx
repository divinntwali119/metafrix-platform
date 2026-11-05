"use client";

import { useState } from "react";
import {
  Code2,
  FolderGit2,
  HelpCircle,
  BookOpen,
  Image as ImageIcon,
  Send,
  X,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { Post } from "@/types";

export function CreatePostCard() {
  const { currentUser, addPost, repositories } = useAfriHubStore();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<Post["type"]>("text");
  const [includeCode, setIncludeCode] = useState(false);
  const [codeLang, setCodeLang] = useState("typescript");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeFilename, setCodeFilename] = useState("");
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !codeSnippet.trim()) return;

    const selectedRepo = repositories.find((r) => r.id === selectedRepoId);

    addPost({
      content,
      type: postType,
      codeSnippet:
        includeCode && codeSnippet.trim()
          ? {
              language: codeLang,
              code: codeSnippet.trim(),
              filename: codeFilename || `code.${codeLang}`,
            }
          : undefined,
      repositoryRef: selectedRepo
        ? {
            id: selectedRepo.id,
            name: selectedRepo.name,
            ownerUsername: selectedRepo.owner.username,
            description: selectedRepo.description,
            starsCount: selectedRepo.starsCount,
            language: selectedRepo.language,
          }
        : undefined,
      mediaUrls: imageUrl.trim() ? [imageUrl.trim()] : undefined,
    });

    // Reset
    setContent("");
    setIncludeCode(false);
    setCodeSnippet("");
    setCodeFilename("");
    setSelectedRepoId("");
    setImageUrl("");
    setShowImageInput(false);
    setPostType("text");
  };

  return (
    <div className="ui-panel ui-panel-pearl space-y-3 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="ui-avatar h-10 w-10 shrink-0 rounded-full border object-cover"
        />
        <div className="flex-1 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Partagez une avancée, une question technique ou une astuce de code..."
            rows={2}
            className="ui-field w-full resize-none p-2.5 text-sm transition-colors"
          />

          {/* Interactive Code Editor Section if active */}
          {includeCode && (
            <div className="animate-in fade-in space-y-2 rounded-md border border-[#30363d] bg-[#0d1117] p-3 duration-150">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={codeFilename}
                    onChange={(e) => setCodeFilename(e.target.value)}
                    placeholder="fichier.ts"
                    className="w-36 rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1 font-mono text-xs text-[#e6edf3] outline-none placeholder:text-[#8b949e]"
                  />
                  <select
                    value={codeLang}
                    onChange={(e) => setCodeLang(e.target.value)}
                    className="rounded-md border border-[#30363d] bg-[#161b22] px-2 py-1 font-mono text-xs text-[#c9d1d9] outline-none"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="sql">SQL</option>
                    <option value="bash">Bash</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeCode(false)}
                  className="text-[#8b949e] hover:text-[#e6edf3]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// Collez votre code ici..."
                rows={4}
                className="w-full rounded-md border border-[#30363d] bg-[#0d1117] p-2.5 font-mono text-xs text-[#e6edf3] outline-none placeholder:text-[#8b949e]"
              />
            </div>
          )}

          {/* Project / Repo Reference selector */}
          {postType === "project" && (
            <div className="flex items-center gap-2 text-xs">
              <FolderGit2 className="h-4 w-4 text-[#8b949e]" />
              <select
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
                className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-1.5 text-[#c9d1d9] outline-none"
              >
                <option value="">Sélectionner un dépôt à lier...</option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.owner.username}/{repo.name} ({repo.language})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Image URL input */}
          {showImageInput && (
            <div className="flex items-center gap-2 text-xs">
              <ImageIcon className="h-4 w-4 text-[#8b949e]" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... (URL de la capture d'écran)"
                className="flex-1 rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-1.5 text-[#c9d1d9] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowImageInput(false)}
                className="text-[#8b949e] hover:text-[#e6edf3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#30363d] pt-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIncludeCode(!includeCode);
              if (!includeCode) setPostType("code");
            }}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              includeCode
                ? "border-[#2f81f7] bg-[#1f6feb]/10 text-[#58a6ff]"
                : "border-transparent text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPostType(postType === "project" ? "text" : "project");
            }}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              postType === "project"
                ? "border-[#2f81f7] bg-[#1f6feb]/10 text-[#58a6ff]"
                : "border-transparent text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>Projet Git</span>
          </button>

          <button
            type="button"
            onClick={() => setPostType(postType === "question" ? "text" : "question")}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              postType === "question"
                ? "border-[#2f81f7] bg-[#1f6feb]/10 text-[#58a6ff]"
                : "border-transparent text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Question</span>
          </button>

          <button
            type="button"
            onClick={() => setPostType(postType === "tutorial" ? "text" : "tutorial")}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              postType === "tutorial"
                ? "border-[#2f81f7] bg-[#1f6feb]/10 text-[#58a6ff]"
                : "border-transparent text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Tutoriel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-xs font-medium text-[#8b949e] transition-colors hover:bg-[#21262d] hover:text-[#e6edf3]"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Média</span>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() && !codeSnippet.trim()}
          className="ui-button ui-button-primary px-4 py-2 text-xs sm:text-sm"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Publier</span>
        </button>
      </div>
    </div>
  );
}
