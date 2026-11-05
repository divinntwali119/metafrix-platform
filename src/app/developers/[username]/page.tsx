"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Globe,
  Calendar,
  FolderGit2,
  MessageSquare,
  Flame,
  Compass,
  Sparkles,
  UserRoundX,
  Star,
  GitFork,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { PostCard } from "@/components/social/PostCard";
import { MemberCover } from "@/components/social/MemberCover";

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 .1.76 2.45 3.73 1.75.1-.72.39-1.2.7-1.48-2.48-.28-5.09-1.24-5.09-5.51 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.11 2.95.72.78 1.15 1.77 1.15 2.99 0 4.28-2.61 5.22-5.1 5.5.4.35.75 1.02.75 2.06v3.05c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.34L5.62 22H2.5l7.25-8.29L1.8 2h6.4l4.43 6.77L18.9 2Zm-1.1 18h1.73L7.28 3.89H5.42L17.8 20Z" />
    </svg>
  );
}

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function DeveloperProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { username } = resolvedParams;
  const { users, currentUser, repositories, posts, toggleFollowUser, setActiveConversationId } =
    useAfriHubStore();

  const user =
    users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  return user ? (
    <DeveloperProfileContent
      user={user}
      currentUser={currentUser}
      repositories={repositories}
      posts={posts}
      toggleFollowUser={toggleFollowUser}
      setActiveConversationId={setActiveConversationId}
    />
  ) : (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <UserRoundX className="h-10 w-10 text-[#8b949e]" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-semibold text-[#e6edf3]">Profil introuvable</h1>
      <p className="mt-2 text-sm text-[#8b949e]">
        Ce profil n&apos;existe pas ou n&apos;est plus disponible.
      </p>
      <Link href="/developers" className="mt-5 text-sm text-[#2f81f7] hover:underline">
        Découvrir les développeurs
      </Link>
    </div>
  );
}

function DeveloperProfileContent({
  user,
  currentUser,
  repositories,
  posts,
  toggleFollowUser,
  setActiveConversationId,
}: {
  user: import("@/types").User;
  currentUser: import("@/types").User;
  repositories: import("@/types").Repository[];
  posts: import("@/types").Post[];
  toggleFollowUser: (userId: string) => void;
  setActiveConversationId: (id: string | null) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "repositories" | "posts" | "activity">("overview");

  const userRepos = repositories.filter(
    (r) =>
      r.owner.username.toLowerCase() === user.username.toLowerCase() &&
      (!r.isPrivate || user.id === currentUser.id)
  );
  const popularRepos = [...userRepos]
    .sort((first, second) => second.starsCount - first.starsCount)
    .slice(0, 4);

  const userPosts = posts.filter(
    (p) => p.author.username.toLowerCase() === user.username.toLowerCase()
  );

  const isCurrent = user.id === currentUser.id;
  const memberSince = new Date(user.createdAt).getUTCFullYear();

  const contributionWeeks = Array.from({ length: 30 }, (_, i) => ({
    week: i,
    days: Array.from({ length: 7 }, (_, d) => {
      const count = (i * 7 + d) % 4 === 0 ? 3 : (i * 7 + d) % 2 === 0 ? 1 : 0;
      return count;
    }),
  }));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-16">
      {/* Cover Image */}
      <MemberCover className="h-48 w-full sm:h-64">
        <div className="absolute inset-0 bg-linear-to-b from-black/25 via-transparent to-background" />
      </MemberCover>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Profile Card Header */}
        <div className="relative -mt-20 flex flex-col justify-between gap-6 pb-6 md:flex-row md:items-end">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatar}
              alt={user.name}
              className="ui-avatar h-28 w-28 shrink-0 rounded-full border-4 border-background object-cover sm:h-32 sm:w-32"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {user.name}
              </h1>
              <p className="font-mono text-sm text-[#8b949e]">@{user.username}</p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#8b949e]">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#8b949e]" />
                    {user.location}
                  </span>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#58a6ff] hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {user.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {user.githubUrl && (
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Profil GitHub"
                    className="flex items-center gap-1 text-[#58a6ff] hover:underline"
                  >
                    <GithubMark />
                    GitHub
                  </a>
                )}
                {user.twitterUrl && (
                  <a
                    href={user.twitterUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Profil X"
                    className="flex items-center gap-1 text-[#58a6ff] hover:underline"
                  >
                    <XMark />
                    X
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Membre depuis {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {!isCurrent ? (
              <>
                <button
                  type="button"
                  onClick={() => toggleFollowUser(user.id)}
                  aria-pressed={Boolean(user.isFollowed)}
                  className={`rounded-md border px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                    user.isFollowed
                      ? "border-[#30363d] bg-[#21262d] text-[#c9d1d9] hover:border-[#f85149] hover:text-[#f85149]"
                      : "border-[#30363d] bg-[#21262d] text-[#e6edf3] hover:border-[#2f81f7] hover:text-[#58a6ff]"
                  }`}
                >
                  {user.isFollowed ? "Abonné" : "Suivre"}
                </button>
                <Link
                  href="/messages"
                  onClick={() => setActiveConversationId("conv-1")}
                  className="ui-button ui-button-secondary px-4 py-2 text-xs sm:text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Message</span>
                </Link>
              </>
            ) : (
              <Link
                href="/settings"
                className="ui-button ui-button-secondary px-4 py-2 text-xs sm:text-sm"
              >
                Modifier mon profil
              </Link>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div role="tablist" aria-label="Sections du profil" className="flex gap-2 overflow-x-auto pt-4 scrollbar-none">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: Sparkles },
            { id: "repositories", label: `Dépôts (${userRepos.length})`, icon: FolderGit2 },
            { id: "posts", label: `Publications (${userPosts.length})`, icon: Compass },
            { id: "activity", label: "Activité", icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                aria-selected={isActive}
                aria-controls="profile-content"
                id={`profile-tab-${tab.id}`}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-sm ${
                  isActive
                    ? "bg-(--muted) text-(--primary-text)"
                    : "text-[#8b949e] hover:bg-(--muted) hover:text-[#e6edf3]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div
          id="profile-content"
          role="tabpanel"
          aria-labelledby={`profile-tab-${activeTab}`}
          className="mt-8"
        >
          {/* 1. Overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* About section stays open; repository items remain individually framed. */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">À propos</h3>
                  <p className="text-sm leading-relaxed text-[#c9d1d9]">{user.bio}</p>
                </section>

                {/* Heatmap */}
                <section className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {user.contributionsCount} contributions au cours de l&apos;année
                    </h3>
                    <span className="text-xs text-[#A1A1AA]">Série : 14 jours</span>
                  </div>

                  <div className="overflow-x-auto pb-2">
                    <div className="flex min-w-150 gap-1.5">
                      {contributionWeeks.map((week) => (
                        <div key={week.week} className="flex flex-col gap-1.5">
                          {week.days.map((level, dayIdx) => (
                            <div
                              key={dayIdx}
                              className={`h-3 w-3 rounded-sm ${
                                level === 3
                                  ? "bg-[#238636]"
                                  : level === 1
                                  ? "bg-[#238636]/40"
                                  : "bg-[#21262d]"
                              }`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Pinned / Notable Repositories */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Dépôts populaires</h3>
                  {popularRepos.length === 0 ? (
                    <div className="py-2 text-sm text-[#8b949e]">
                      Aucun dépôt public à afficher pour le moment.
                    </div>
                  ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {popularRepos.map((repo) => (
                      <Link
                        key={repo.id}
                        href={`/${repo.owner.username}/${repo.name}`}
                        className="ui-panel flex flex-col justify-between p-4 transition-colors hover:border-[#8b949e]"
                      >
                        <div>
                          <span className="block truncate text-sm font-semibold text-[#e6edf3]">
                            {repo.name}
                          </span>
                          <p className="mt-1 line-clamp-2 text-xs text-[#8b949e]">
                            {repo.description}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center justify-between pt-4 text-xs text-[#8b949e]">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: repo.languageColor }}
                            />
                            {repo.language}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" aria-hidden="true" />
                            {repo.starsCount}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  )}
                </div>
              </div>

              {/* Right Column: Skills & Tech */}
              <div className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">
                    Compétences & Langages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <span
                        key={skill}
                        className="ui-badge rounded-md px-2.5 py-1"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-sm font-semibold text-white">
                    Technologies maîtrisées
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-[#2f81f7]/30 bg-[#2f81f7]/10 px-2.5 py-1 text-xs font-medium text-[#58a6ff]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Statistiques</h3>
                  <div className="space-y-2 text-xs text-[#8b949e]">
                    <div className="flex justify-between">
                      <span>Abonnés</span>
                      <strong className="text-white">{user.followersCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Abonnements</span>
                      <strong className="text-white">{user.followingCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Dépôts publics</span>
                      <strong className="text-white">{user.repositoriesCount}</strong>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* 2. Repositories Tab */}
          {activeTab === "repositories" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userRepos.length === 0 ? (
                <div className="col-span-full py-8 text-center">
                  <FolderGit2 className="mx-auto h-8 w-8 text-[#8b949e]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-[#e6edf3]">Aucun dépôt public</p>
                  <p className="mt-1 text-xs text-[#8b949e]">
                    Les dépôts de {user.name} apparaîtront ici.
                  </p>
                </div>
              ) : userRepos.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/${repo.owner.username}/${repo.name}`}
                  className="ui-panel flex flex-col justify-between p-5 transition-colors hover:border-[#8b949e]"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {repo.name}
                    </h3>
                    <p className="text-xs text-[#A1A1AA] mt-1 line-clamp-2">
                      {repo.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-4 text-xs text-[#A1A1AA]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: repo.languageColor }}
                      />
                      {repo.language}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" aria-hidden="true" />
                        {repo.starsCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <GitFork className="h-3.5 w-3.5" aria-hidden="true" />
                        {repo.forksCount}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* 3. Posts Tab */}
          {activeTab === "posts" && (
            <div className="max-w-3xl space-y-4">
              {userPosts.length > 0 ? (
                userPosts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="py-8 text-center text-xs text-[#8b949e]">
                  Aucune publication pour ce développeur.
                </div>
              )}
            </div>
          )}

          {/* 4. Activity Tab */}
          {activeTab === "activity" && (
            <div className="max-w-2xl py-4 text-center">
              <Flame className="mx-auto h-8 w-8 text-[#8b949e]" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-semibold text-[#e6edf3]">
                Activité récente
              </h3>
              <p className="mt-1 text-xs text-[#8b949e]">
                Les contributions de {user.name} s&apos;afficheront ici.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
