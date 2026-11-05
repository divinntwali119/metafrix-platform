"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileCode2,
  Flame,
  FolderGit2,
  GitFork,
  Megaphone,
  MessageSquare,
  CircleHelp,
  BookOpen,
  Plus,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { currentUser, repositories, posts, users, toggleFollowUser } = useAfriHubStore();

  const userRepos = repositories
    .filter((repository) => repository.owner.username === currentUser.username)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const otherRepos = repositories
    .filter((repository) => repository.owner.username !== currentUser.username)
    .sort((a, b) => b.starsCount - a.starsCount)
    .slice(0, 3);
  const suggestedUsers = users.filter((user) => user.id !== currentUser.id).slice(0, 3);
  const recentPosts = posts.slice(0, 3);
  const totalStars = userRepos.reduce((total, repository) => total + repository.starsCount, 0);
  const totalForks = userRepos.reduce((total, repository) => total + repository.forksCount, 0);
  const profileFields = [
    currentUser.bio,
    currentUser.location,
    currentUser.website,
    currentUser.githubUrl,
    currentUser.skills.length > 0,
  ];
  const profileProgress = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  const contributionWeeks = Array.from({ length: 28 }, (_, week) => ({
    week,
    days: Array.from({ length: 7 }, (_, day) => {
      const seed = week * 7 + day;
      return seed % 7 === 0 ? 3 : seed % 4 === 0 ? 2 : seed % 3 === 0 ? 1 : 0;
    }),
  }));

  const stats = [
    {
      label: "Contributions",
      value: currentUser.contributionsCount.toLocaleString("fr-FR"),
      note: "cette année",
      icon: Activity,
      tone: "text-[#1877F2]",
    },
    {
      label: "Abonnés",
      value: currentUser.followersCount.toLocaleString("fr-FR"),
      note: "dans la communauté",
      icon: Users,
      tone: "text-[#1877F2]",
    },
    {
      label: "Étoiles reçues",
      value: totalStars.toLocaleString("fr-FR"),
      note: "sur vos dépôts",
      icon: Star,
      tone: "text-[#1877F2]",
    },
    {
      label: "Dépôts",
      value: userRepos.length.toLocaleString("fr-FR"),
      note: `${totalForks.toLocaleString("fr-FR")} forks au total`,
      icon: FolderGit2,
      tone: "text-[#1877F2]",
    },
  ];

  const postTypeLabels: Record<string, string> = {
    text: "Discussion",
    code: "Code",
    project: "Projet",
    tutorial: "Tutoriel",
    question: "Question",
    announcement: "Annonce",
  };

  const postTypeIcons: Record<string, typeof MessageSquare> = {
    text: MessageSquare,
    code: FileCode2,
    project: FolderGit2,
    tutorial: BookOpen,
    question: CircleHelp,
    announcement: Megaphone,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">
      <section
        className="relative overflow-hidden px-1 py-3 sm:px-2 sm:py-5 lg:py-6"
        style={{
          backgroundImage:
            "linear-gradient(90deg, var(--background) 0%, color-mix(in srgb, var(--background) 78%, transparent) 45%, color-mix(in srgb, var(--background) 12%, transparent) 100%), url('/metafrix-dashboard-waves.svg')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative flex flex-col justify-between gap-5 sm:gap-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-5">
            <div className="relative mt-1 h-14 w-14 shrink-0 sm:mt-0 sm:h-20 sm:w-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="ui-avatar h-full w-full border-2 border-(--card) object-cover"
              />
              <span
                role="img"
                aria-label="En ligne"
                className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-(--card) bg-emerald-500"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 sm:mb-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-(--accent) sm:text-[10px] sm:tracking-[0.18em]">
                  Votre espace MetafriX
                </span>
              </div>
              <h1 className="wrap-break-word text-lg font-bold leading-tight tracking-tight sm:text-2xl lg:text-3xl">
                Bonjour, {currentUser.name}
              </h1>
              <p className="mt-1.5 line-clamp-3 max-w-2xl text-[11px] leading-relaxed text-white/65 sm:line-clamp-2 sm:text-sm">
                {currentUser.bio}
              </p>
              <p className="mt-1.5 wrap-break-word text-[10px] text-white/50 sm:mt-2 sm:text-[11px]">
                @{currentUser.username}{currentUser.location ? ` · ${currentUser.location}` : ""}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 min-[380px]:grid-cols-2 lg:w-auto lg:pl-4">
            <Link
              href="/new"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-(--action) px-3 text-[11px] font-semibold text-white transition-colors hover:bg-(--action-hover) sm:px-4 sm:text-sm"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Nouveau dépôt
            </Link>
            <Link
              href="/feed"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 text-[11px] font-medium text-white/90 transition-colors hover:bg-white/10 sm:px-4 sm:text-sm"
            >
              <Compass className="h-4 w-4" aria-hidden="true" /> Fil social
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-label="Vos statistiques"
        className="grid grid-cols-2 gap-x-4 gap-y-4 py-2 sm:grid-cols-4 sm:gap-x-6 sm:py-3 xl:gap-x-10"
      >
        {stats.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className="flex min-w-0 items-start gap-2.5 px-1 sm:gap-3">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium text-(--secondary-text) sm:text-[11px]">{label}</p>
              <p className="mt-0.5 text-lg font-bold tracking-tight text-(--primary-text) sm:text-xl">{value}</p>
              <p className="mt-0.5 truncate text-[9px] text-(--secondary-text) sm:text-[10px]">{note}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 xl:grid-cols-3">
        <main className="min-w-0 space-y-4 sm:space-y-6 xl:col-span-2">
          <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Flame className="mt-0.5 h-4 w-4 shrink-0 text-[#1877F2]" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-(--primary-text)">Activité & contributions</h2>
                  <p className="mt-0.5 text-xs text-(--secondary-text)">Un aperçu de votre rythme de développement</p>
                </div>
              </div>
              <span className="text-[10px] text-(--secondary-text)">
                28 dernières semaines
              </span>
            </div>

            <div className="pb-1">
              <div className="grid grid-cols-28 gap-x-1 gap-y-0">
                {contributionWeeks.map((week) => (
                  <div key={week.week} className="flex flex-col gap-1">
                    {week.days.map((level, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`aspect-square w-full max-w-3 rounded-xs transition-transform hover:scale-125 ${
                          level === 3
                            ? "bg-violet-500"
                            : level === 2
                              ? "bg-violet-500/65"
                              : level === 1
                                ? "bg-violet-500/30"
                                : "bg-(--muted)"
                        }`}
                        title={`${level * 3} contributions`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-(--secondary-text)">
              <span>Moins</span>
              <div className="flex items-center gap-1.5" aria-label="Légende du niveau d’activité">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-(--muted)" />
                <span className="h-2.5 w-2.5 rounded-[3px] bg-violet-500/30" />
                <span className="h-2.5 w-2.5 rounded-[3px] bg-violet-500/65" />
                <span className="h-2.5 w-2.5 rounded-[3px] bg-violet-500" />
              </div>
              <span>Plus</span>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FolderGit2 className="h-4 w-4 shrink-0 text-[#1877F2]" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-(--primary-text)">Vos dépôts</h2>
                  <p className="mt-0.5 text-xs text-(--secondary-text)">Vos projets mis à jour récemment</p>
                </div>
              </div>
              <Link href="/new" className="inline-flex items-center gap-1 text-xs font-medium text-(--accent) hover:underline">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Créer
              </Link>
            </div>

            {userRepos.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {userRepos.slice(0, 4).map((repo) => (
                  <Link
                    key={repo.id}
                    href={`/${repo.owner.username}/${repo.name}`}
                    className="group flex min-h-32 flex-col justify-between py-2 transition-colors sm:min-h-36"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-xs font-semibold text-(--primary-text) group-hover:text-(--accent)">
                          {repo.name}
                        </h3>
                        <span className="shrink-0 text-[9px] text-(--secondary-text)">
                          {repo.isPrivate ? "Privé" : "Public"}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-(--secondary-text)">
                        {repo.description}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-(--secondary-text)">
                      <span className="min-w-0 truncate">{repo.language}</span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" aria-hidden="true" />{repo.starsCount}</span>
                        <span className="inline-flex items-center gap-1"><GitFork className="h-3 w-3" aria-hidden="true" />{repo.forksCount}</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <FolderGit2 className="mx-auto h-6 w-6 text-(--secondary-text)" aria-hidden="true" />
                <p className="mt-2 text-xs font-medium text-(--primary-text)">Aucun dépôt pour le moment</p>
                <Link href="/new" className="mt-2 inline-flex items-center gap-1 text-xs text-(--accent) hover:underline">
                  Créer votre premier dépôt <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Compass className="h-4 w-4 shrink-0 text-[#1877F2]" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-(--primary-text)">La communauté</h2>
                  <p className="mt-0.5 text-xs text-(--secondary-text)">Publications récentes de votre réseau</p>
                </div>
              </div>
              <Link href="/feed" className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-(--accent) hover:underline">
                Tout voir <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="space-y-5">
              {recentPosts.map((post) => (
                <article key={post.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.author.avatar} alt="" className="ui-avatar h-8 w-8 shrink-0 object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-(--primary-text)">{post.author.name}</p>
                        <p className="truncate text-[10px] text-(--secondary-text)">@{post.author.username} · {formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-medium text-(--secondary-text)">
                      {(() => {
                        const Icon = postTypeIcons[post.type] ?? MessageSquare;
                        return <Icon className="h-3 w-3" aria-hidden="true" />;
                      })()}
                      {postTypeLabels[post.type] ?? post.type}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-(--primary-text)">{post.content}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-(--secondary-text)">
                    <span>{post.likesCount} réactions</span>
                    <span>{post.commentsCount} commentaires</span>
                    <span>{post.sharesCount} partages</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-4 sm:space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1877F2]" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-(--primary-text)">Profil</h2>
                  <p className="text-[10px] text-(--secondary-text)">Complétez votre présence</p>
                </div>
              </div>
              <span className="text-sm font-bold text-(--primary-text)">{profileProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-(--muted)" role="progressbar" aria-label="Complétion du profil" aria-valuenow={profileProgress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-linear-to-r from-violet-500 to-cyan-500 transition-all" style={{ width: `${profileProgress}%` }} />
            </div>
            <p className="text-xs leading-relaxed text-(--secondary-text)">
              Un profil à jour aide les autres développeurs à vous découvrir.
            </p>
            <Link href="/settings" className="inline-flex items-center gap-1 text-xs font-semibold text-(--accent) hover:underline">
              Modifier mon profil <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Star className="h-4 w-4 shrink-0 text-[#1877F2]" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-(--primary-text)">Projets populaires</h2>
                <p className="text-[10px] text-(--secondary-text)">À explorer dans la communauté</p>
              </div>
            </div>
            <div className="space-y-3">
              {otherRepos.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/${repo.owner.username}/${repo.name}`}
                  className="group block"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-(--primary-text) group-hover:text-(--accent)">
                      {repo.owner.username} / {repo.name}
                    </p>
                    <ExternalLink className="h-3 w-3 shrink-0 text-(--secondary-text)" aria-hidden="true" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-(--secondary-text)">{repo.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-(--secondary-text)">
                    <span>{repo.language}</span>
                    <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" aria-hidden="true" />{repo.starsCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 shrink-0 text-[#1877F2]" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-(--primary-text)">À suivre</h2>
                  <p className="text-[10px] text-(--secondary-text)">Développeurs suggérés</p>
                </div>
              </div>
              <Link href="/developers" className="text-[10px] font-medium text-(--accent) hover:underline">Explorer</Link>
            </div>
            <div className="space-y-3">
              {suggestedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-2">
                  <Link href={`/developers/${user.username}`} className="flex min-w-0 items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={user.avatar} alt="" className="ui-avatar h-9 w-9 shrink-0 object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-(--primary-text)">{user.name}</span>
                      <span className="block truncate text-[10px] text-(--secondary-text)">@{user.username}</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`${user.isFollowed ? "Ne plus suivre" : "Suivre"} ${user.name}`}
                    aria-pressed={Boolean(user.isFollowed)}
                    onClick={() => toggleFollowUser(user.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                      user.isFollowed
                        ? "border border-(--border) text-(--secondary-text) hover:border-rose-400/40 hover:text-rose-500"
                        : "bg-(--action) text-white hover:bg-(--action-hover)"
                    }`}
                  >
                    {user.isFollowed ? "Suivi" : "Suivre"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-1">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#1877F2]" aria-hidden="true" />
              <div>
                <h2 className="text-xs font-semibold text-(--primary-text)">Continuez sur votre lancée</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-(--secondary-text)">
                  Partagez votre prochaine avancée avec la communauté MetafriX.
                </p>
                <Link href="/feed" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-(--accent) hover:underline">
                  Ouvrir le fil <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
