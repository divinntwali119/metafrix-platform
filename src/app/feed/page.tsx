"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Compass,
  Home,
  Users,
  FolderGit2,
  BookOpen,
  HelpCircle,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { CreatePostCard } from "@/components/social/CreatePostCard";
import { PostCard } from "@/components/social/PostCard";
import { PostCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeaturedRepositoriesCarousel } from "@/components/social/FeaturedRepositoriesCarousel";
import { FeaturedRepositoriesSkeleton } from "@/components/ui/Skeleton";
import { PlatformAnnouncements } from "@/components/social/PlatformAnnouncements";

type FeedFilter = "all" | "following" | "project" | "tutorial" | "question" | "code";

export default function FeedPage() {
  const { posts, users, repositories, currentUser, toggleFollowUser, hasHydrated } = useAfriHubStore();
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "following") {
      const author = users.find((u) => u.id === post.author.id);
      return author?.isFollowed || post.author.id === currentUser.id;
    }
    return post.type === activeFilter;
  });

  const filterTabs: { id: FeedFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "all", label: "Pour vous", icon: Home },
    { id: "following", label: "Abonnements", icon: Users },
    { id: "project", label: "Projets", icon: FolderGit2 },
    { id: "tutorial", label: "Tutoriels", icon: BookOpen },
    { id: "question", label: "Questions", icon: HelpCircle },
    { id: "code", label: "Extraits de code", icon: MessageSquare },
  ];

  const suggestedUsers = users.filter((u) => u.id !== currentUser.id).slice(0, 4);

  const trendingTopics = [
    { tag: "#MobileMoney", postsCount: "142 posts" },
    { tag: "#SwahiliNLP", postsCount: "89 posts" },
    { tag: "#FastAPI", postsCount: "74 posts" },
    { tag: "#AfriDev2026", postsCount: "63 posts" },
    { tag: "#RustAfrica", postsCount: "51 posts" },
  ];

  return (
    <div className="feed-page mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Main Feed Column (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <PlatformAnnouncements />

          <div className="pb-1">
            <h1 className="text-xl font-semibold tracking-tight text-[#e6edf3] sm:text-2xl">
              Fil d&apos;actualité
            </h1>
            <p className="mt-1 text-sm text-[#8b949e]">
              Les projets, idées et discussions de la communauté MetafriX.
            </p>
          </div>

          {/* Post Creator */}
          <CreatePostCard />

          {/* Featured repositories */}
          {!hasHydrated ? (
            <FeaturedRepositoriesSkeleton />
          ) : (
            <FeaturedRepositoriesCarousel
              repositories={repositories
                .filter((repository) => !repository.isPrivate)
                .sort((a, b) => b.starsCount - a.starsCount)}
            />
          )}

          {/* Feed filters */}
          <div className="flex items-center gap-5 overflow-x-auto border-b border-[#30363d] scrollbar-none">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "border-[#2f81f7] text-[#e6edf3]"
                      : "border-transparent text-[#8b949e] hover:text-[#e6edf3]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Post Feed List */}
          <div className="space-y-4">
            {!hasHydrated ? (
              <div role="status" aria-label="Chargement des publications" aria-busy="true" className="space-y-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <span className="sr-only">Chargement des publications…</span>
              </div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <EmptyState
                icon={<Compass className="h-5 w-5" />}
                title="Aucune publication trouvée"
                description="Soyez le premier à publier dans cette catégorie !"
              />
            )}
          </div>
        </div>

        {/* Sidebar: Trending & Suggestions */}
        <aside className="hidden space-y-6 lg:sticky lg:top-32 lg:block lg:self-start">
          {/* Trending Topics */}
          <div className="ui-panel space-y-4 p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#8b949e]" />
              <h3 className="text-sm font-semibold text-[#e6edf3]">Tendances techniques</h3>
            </div>

            <div className="space-y-2.5">
              {trendingTopics.map((item) => (
                <div
                  key={item.tag}
                  className="group flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-[#21262d]"
                >
                  <span className="text-xs font-medium text-[#c9d1d9] group-hover:text-[#2f81f7]">
                    {item.tag}
                  </span>
                  <span className="text-[11px] text-[#8b949e]">{item.postsCount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Developers */}
          <div className="ui-panel space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#8b949e]" />
                <h3 className="text-sm font-semibold text-[#e6edf3]">Développeurs à suivre</h3>
              </div>
              <Link
                href="/developers"
                className="text-xs text-[#2f81f7] hover:underline"
              >
                Tout voir
              </Link>
            </div>

            <div className="space-y-3">
              {suggestedUsers.map((user) => (
                <div
                  key={user.id}
                  className="feed-sidebar-suggestion flex items-center justify-between rounded-md border border-[#30363d] bg-[#0d1117] p-2.5"
                >
                  <Link
                    href={`/developers/${user.username}`}
                    className="flex items-center gap-2.5 min-w-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="ui-avatar h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#e6edf3]">
                        {user.name}
                      </p>
                      <p className="truncate text-[10px] text-[#8b949e]">
                        @{user.username}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => toggleFollowUser(user.id)}
                    className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      user.isFollowed
                        ? "border-[#30363d] bg-[#21262d] text-[#c9d1d9] hover:border-[#f85149] hover:text-[#f85149]"
                        : "border-[#30363d] bg-[#21262d] text-[#e6edf3] hover:border-[#2f81f7] hover:text-[#2f81f7]"
                    }`}
                  >
                    {user.isFollowed ? "Suivi" : "Suivre"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
