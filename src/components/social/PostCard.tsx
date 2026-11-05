"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  FolderGit2,
  Trash2,
  Send,
  ExternalLink,
  Code2,
  BookOpen,
  CircleHelp,
  Megaphone,
} from "lucide-react";
import { Post } from "@/types";
import { useAfriHubStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { CodeSnippetViewer } from "../ui/CodeSnippetViewer";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const {
    currentUser,
    toggleLikePost,
    toggleBookmarkPost,
    deletePost,
    comments,
    addComment,
  } = useAfriHubStore();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  const postComments = comments[post.id] || [];
  const isAuthor = post.author.id === currentUser.id;

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/feed#${post.id}`);
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText("");
  };

  const getBadgeStyle = (type: Post["type"]) => {
    switch (type) {
      case "project":
        return "bg-[#21262d] text-[#c9d1d9] border-[#30363d]";
      case "code":
        return "bg-[#21262d] text-[#c9d1d9] border-[#30363d]";
      case "question":
        return "bg-[#21262d] text-[#c9d1d9] border-[#30363d]";
      case "tutorial":
        return "bg-[#21262d] text-[#c9d1d9] border-[#30363d]";
      default:
        return "bg-[#21262d] text-[#c9d1d9] border-[#30363d]";
    }
  };

  const postTypeLabels: Record<Post["type"], string> = {
    text: "Discussion",
    code: "Code",
    project: "Projet",
    tutorial: "Tutoriel",
    question: "Question",
    announcement: "Annonce",
  };

  const postTypeIcons: Record<Post["type"], typeof MessageSquare> = {
    text: MessageSquare,
    code: Code2,
    project: FolderGit2,
    tutorial: BookOpen,
    question: CircleHelp,
    announcement: Megaphone,
  };
  const PostTypeIcon = postTypeIcons[post.type];

  return (
    <article
      id={post.id}
      className="ui-panel p-4 transition-colors sm:p-5"
    >
      {/* Header: Author & Options */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/developers/${post.author.username}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="ui-avatar h-10 w-10 rounded-full border border-[#30363d] object-cover transition-opacity hover:opacity-85"
            />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/developers/${post.author.username}`}
                className="text-sm font-semibold text-[#e6edf3] transition-colors hover:text-[#2f81f7]"
              >
                {post.author.name}
              </Link>
              <span className="text-xs text-[#8b949e]">
                @{post.author.username}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-[#8b949e]">
              <span>{formatDate(post.createdAt)}</span>
              <span>•</span>
              <span
                className={`ui-badge rounded px-1.5 py-0.5 text-[10px] ${getBadgeStyle(
                  post.type
                )}`}
              >
                <PostTypeIcon className="mr-1 inline h-3 w-3" aria-hidden="true" />
                {postTypeLabels[post.type]}
              </span>
            </div>
          </div>
        </div>

        {/* Options menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-md p-1.5 text-[#8b949e] transition-colors hover:bg-[#21262d] hover:text-[#e6edf3]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-[#30363d] bg-[#161b22] py-1 text-xs shadow-lg"
              onClick={() => setShowMenu(false)}
            >
              <button
                onClick={handleShare}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[#c9d1d9] hover:bg-[#21262d]"
              >
                <Share2 className="h-3.5 w-3.5" />
                Copier le lien
              </button>
              {isAuthor && (
                <button
                  onClick={() => deletePost(post.id)}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[#f85149] hover:bg-[#21262d]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#c9d1d9]">
        {post.content}
      </div>

      {/* Code Snippet if present */}
      {post.codeSnippet && (
        <CodeSnippetViewer
          code={post.codeSnippet.code}
          language={post.codeSnippet.language}
          filename={post.codeSnippet.filename}
        />
      )}

      {/* Repository Card Reference if present */}
      {post.repositoryRef && (
        <Link
          href={`/${post.repositoryRef.ownerUsername}/${post.repositoryRef.name}`}
          className="feed-post-repository-frame ui-panel-inset group my-3 block p-3.5 transition-colors hover:border-[#8b949e]"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-[#8b949e]" />
              <span className="text-xs font-semibold text-[#e6edf3] group-hover:text-[#2f81f7]">
                {post.repositoryRef.ownerUsername} / {post.repositoryRef.name}
              </span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-[#8b949e] group-hover:text-[#e6edf3]" />
          </div>
          <p className="line-clamp-1 text-xs text-[#8b949e]">
            {post.repositoryRef.description}
          </p>
        </Link>
      )}

      {/* Attached Media Images if present */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="feed-post-media-frame my-3 overflow-hidden rounded-md border border-[#30363d]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.mediaUrls[0]}
            alt="Media joint"
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      {/* Action Buttons: Like, Comment, Share, Bookmark */}
      <div className="mt-4 flex items-center justify-between border-t border-[#30363d] pt-3 text-xs text-[#8b949e]">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={() => toggleLikePost(post.id)}
            aria-label={post.isLiked ? "Retirer la mention J’aime" : "J’aime cette publication"}
            aria-pressed={post.isLiked}
            className={`flex items-center gap-1.5 transition-colors ${
              post.isLiked ? "font-semibold text-[#1877F2]" : "hover:text-[#1877F2]"
            }`}
          >
            <ThumbsUp
              className={`h-4 w-4 text-[#1877F2] ${post.isLiked ? "fill-current" : ""}`}
            />
            <span>{post.likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 transition-colors hover:text-[#2f81f7]"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{post.commentsCount + postComments.length}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 transition-colors hover:text-[#e6edf3]"
          >
            <Share2 className="h-4 w-4" />
            <span>{shareFeedback ? "Copié !" : post.sharesCount}</span>
          </button>
        </div>

        <button
          onClick={() => toggleBookmarkPost(post.id)}
          className={`p-1.5 rounded-lg transition-colors ${
            post.isBookmarked
              ? "bg-[#1f6feb]/10 text-[#58a6ff]"
              : "hover:bg-[#21262d] hover:text-[#e6edf3]"
          }`}
          title={post.isBookmarked ? "Enregistré" : "Enregistrer la publication"}
        >
          <Bookmark className={`h-4 w-4 ${post.isBookmarked ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Interactive Comments Section */}
      {showComments && (
        <div className="animate-in mt-4 space-y-4 border-t border-[#30363d] pt-4 duration-200 fade-in">
          {/* New Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="ui-avatar h-7 w-7 shrink-0 rounded-full object-cover"
            />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Écrire un commentaire..."
              className="flex-1 rounded-md border border-[#30363d] bg-[#0d1117] px-3.5 py-1.5 text-xs text-[#e6edf3] placeholder-[#8b949e] focus:border-[#2f81f7] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="ui-button ui-button-primary p-2"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3 pt-2">
            {postComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  className="ui-avatar mt-0.5 h-6 w-6 shrink-0 rounded-full object-cover"
                />
                <div className="feed-post-comment-frame flex-1 rounded-md border border-[#30363d] bg-[#0d1117] p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#e6edf3]">
                      {comment.author.name}
                    </span>
                    <span className="text-[10px] text-[#8b949e]">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="leading-normal text-[#c9d1d9]">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
