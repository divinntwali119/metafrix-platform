"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  Bell,
  Check,
  CheckCheck,
  CircleDot,
  GitPullRequest,
  Heart,
  MessageSquare,
  Trash2,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { AvatarImage } from "@/components/ui/AvatarImage";
import type { NotificationItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { socialService } from "@/services/social.service";
import { getApiErrorMessage } from "@/lib/api-error";

type NotifFilter = "all" | "unread" | "pr_issue" | "social";
type NotificationDateGroup = "today" | "yesterday" | "earlier";

const filterOptions: { id: NotifFilter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "unread", label: "Non lues" },
  { id: "pr_issue", label: "Dépôts & code" },
  { id: "social", label: "Réseau social" },
];

function getNotificationIcon(type: NotificationItem["type"]): {
  Icon: LucideIcon;
  color: string;
  filled?: boolean;
} {
  switch (type) {
    case "reaction":
      return { Icon: Heart, color: "text-(--danger)", filled: true };
    case "comment":
    case "reply":
    case "message":
      return { Icon: MessageSquare, color: "text-(--accent)" };
    case "pr_review":
      return { Icon: GitPullRequest, color: "text-(--accent-cyan)" };
    case "issue_assigned":
      return { Icon: CircleDot, color: "text-(--warning)" };
    case "follow":
      return { Icon: UserPlus, color: "text-(--success)" };
    case "collab_invite":
      return { Icon: Users, color: "text-(--accent-cyan)" };
    case "mention":
      return { Icon: AtSign, color: "text-(--accent)" };
    default:
      return { Icon: Bell, color: "text-(--accent)" };
  }
}

function getDateGroup(createdAt: string): NotificationDateGroup {
  const date = new Date(createdAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return "today";
  if (date >= yesterday) return "yesterday";
  return "earlier";
}

export default function NotificationsPage() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const { hasHydrated, isAuthenticated, authLoading, currentUser } = useAfriHubStore();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
  } = useAfriHubStore();

  const [activeFilter, setActiveFilter] = useState<NotifFilter>("all");
  const [apiNotifications, setApiNotifications] = useState<NotificationItem[]>([]);
  const [loadedNotificationsFor, setLoadedNotificationsFor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [apiError, setApiError] = useState("");
  const isLoading = !isDemoMode && (authLoading || (isAuthenticated && loadedNotificationsFor !== currentUser.id));

  useEffect(() => {
    if (isDemoMode || authLoading || !isAuthenticated) return;
    let active = true;
    void socialService.getNotifications({ page: 1, page_size: 100 }).then((response) => {
      if (!active) return;
      setApiNotifications(response.results);
      setHasMore(Boolean(response.next));
      setPage(1);
    }).catch((error: unknown) => {
      if (active) setApiError(getApiErrorMessage(error, "Les notifications n’ont pas pu être chargées."));
    }).finally(() => {
      if (active) setLoadedNotificationsFor(currentUser.id);
    });
    return () => { active = false; };
  }, [authLoading, currentUser.id, isAuthenticated, isDemoMode]);

  const visibleNotifications = isDemoMode ? notifications : isAuthenticated ? apiNotifications : [];
  const isReady = isDemoMode ? hasHydrated : !isLoading;
  const unreadCount = visibleNotifications.filter((notification) => !notification.isRead).length;

  const filteredNotifications = visibleNotifications.filter((notification) => {
    if (activeFilter === "unread") return !notification.isRead;
    if (activeFilter === "pr_issue") {
      return ["pr_review", "issue_assigned", "collab_invite"].includes(notification.type);
    }
    if (activeFilter === "social") {
      return ["reaction", "comment", "reply", "follow", "message", "mention"].includes(
        notification.type
      );
    }
    return true;
  });

  const sortedNotifications = [...filteredNotifications].sort(
    (first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt)
  );
  const notificationGroups: {
    id: NotificationDateGroup;
    label: string;
    items: NotificationItem[];
  }[] = [
    { id: "today", label: "Aujourd’hui", items: [] },
    { id: "yesterday", label: "Hier", items: [] },
    { id: "earlier", label: "Plus tôt", items: [] },
  ];

  for (const notification of sortedNotifications) {
    const group = notificationGroups.find(
      (item) => item.id === getDateGroup(notification.createdAt)
    );
    group?.items.push(notification);
  }

  const handleMarkRead = async (id: string) => {
    if (isDemoMode) {
      markNotificationAsRead(id);
      return;
    }
    setApiError("");
    try {
      const notification = await socialService.markNotificationRead(id);
      setApiNotifications((items) => items.map((item) => item.id === id ? notification : item));
      window.dispatchEvent(new Event("afrihub:notifications-updated"));
    } catch (error) {
      setApiError(getApiErrorMessage(error, "La notification n’a pas pu être marquée comme lue."));
    }
  };

  const handleMarkAllRead = async () => {
    if (isDemoMode) {
      markAllNotificationsAsRead();
      return;
    }
    setIsSaving(true);
    setApiError("");
    try {
      await socialService.markAllNotificationsRead();
      setApiNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      window.dispatchEvent(new Event("afrihub:notifications-updated"));
    } catch (error) {
      setApiError(getApiErrorMessage(error, "Les notifications n’ont pas pu être mises à jour."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isDemoMode) {
      deleteNotification(id);
      return;
    }
    setApiError("");
    try {
      await socialService.deleteNotification(id);
      setApiNotifications((items) => items.filter((item) => item.id !== id));
      window.dispatchEvent(new Event("afrihub:notifications-updated"));
    } catch (error) {
      setApiError(getApiErrorMessage(error, "La notification n’a pas pu être supprimée."));
    }
  };

  const loadMore = async () => {
    if (isDemoMode || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await socialService.getNotifications({ page: page + 1, page_size: 100 });
      setApiNotifications((items) => [...items, ...response.results]);
      setHasMore(Boolean(response.next));
      setPage((current) => current + 1);
    } catch (error) {
      setApiError(getApiErrorMessage(error, "Impossible de charger d’autres notifications."));
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24 sm:px-6 sm:py-8">
      <div className="space-y-6 sm:space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-(--primary-text) sm:text-3xl">
              Notifications
            </h1>
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-(--secondary-text) sm:text-sm">
              Suivez l&apos;activité de vos dépôts et de votre réseau.
            </p>
          </div>
          {isReady && unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              disabled={isSaving}
              className="inline-flex min-h-9 w-fit items-center gap-2 rounded-lg px-2 text-xs font-medium text-(--secondary-text) transition-colors hover:bg-(--muted) hover:text-(--primary-text)"
            >
              <CheckCheck className="h-4 w-4 text-(--accent)" aria-hidden="true" />
              Tout marquer comme lu
            </button>
          )}
        </header>

        <section aria-label="Filtres de notifications" className="space-y-3">
          <div className="flex flex-wrap gap-2" role="group">
            {filterOptions.map((option) => {
              const isActive = activeFilter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(option.id)}
                  className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:text-sm ${
                    isActive
                      ? "border-(--accent) bg-(--muted) text-(--accent)"
                      : "border-(--border) text-(--secondary-text) hover:border-(--secondary-text) hover:text-(--primary-text)"
                  }`}
                >
                  {option.label}
                  {isReady && option.id === "unread" && unreadCount > 0 && (
                    <span className="ml-1.5 text-(--secondary-text)">{unreadCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-(--secondary-text)" role="status" aria-live="polite">
            {isReady ? (
              <>
                <span className="font-semibold text-(--primary-text)">
                  {filteredNotifications.length}
                </span>{" "}
                {filteredNotifications.length === 1 ? "notification" : "notifications"}
                {unreadCount > 0 && (
                  <>
                    <span className="px-1.5" aria-hidden="true">·</span>
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </>
                )}
              </>
            ) : (
              "Chargement des notifications…"
            )}
          </p>
        </section>

        {!isReady ? (
          <div
            role="status"
            aria-label="Chargement des notifications"
            aria-busy="true"
            className="space-y-2"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-3 w-2/3 max-w-full" />
                  <Skeleton className="h-3 w-28 max-w-full" />
                </div>
              </div>
            ))}
            <span className="sr-only">Chargement des notifications…</span>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-7">
            {notificationGroups.filter((group) => group.items.length > 0).map((group) => (
              <section key={group.id} aria-labelledby={`notification-group-${group.id}`}>
                <div className="mb-2 flex items-center justify-between px-3">
                  <h2
                    id={`notification-group-${group.id}`}
                    className="text-xs font-semibold text-(--secondary-text)"
                  >
                    {group.label}
                  </h2>
                  <span className="text-[10px] text-(--secondary-text)">
                    {group.items.length}
                  </span>
                </div>

                <div className="space-y-1">
                  {group.items.map((notification) => {
                    const { Icon, color, filled } = getNotificationIcon(notification.type);

                    return (
                      <article
                        key={notification.id}
                        className={`group flex items-center gap-2 rounded-xl transition-colors ${
                          notification.isRead
                            ? "hover:bg-(--muted)/45"
                            : "bg-(--muted)/45 hover:bg-(--muted)/70"
                        }`}
                      >
                        <Link
                          href={notification.targetUrl}
                          onClick={() => void handleMarkRead(notification.id)}
                          className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3 sm:px-4"
                        >
                          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-(--muted)">
                            <AvatarImage
                              src={notification.actor.avatar}
                              alt=""
                              loading="lazy"
                              className="ui-avatar h-full w-full object-cover"
                            />
                          </span>

                          <span className="min-w-0 flex-1 pt-0.5">
                            <span className="block text-xs leading-relaxed text-(--primary-text) sm:text-sm">
                              <span className="font-semibold">{notification.actor.name}</span>{" "}
                              <span className="text-(--secondary-text)">{notification.message}</span>
                            </span>
                            <span className="mt-1.5 flex items-center gap-2 text-[10px] text-(--secondary-text) sm:text-[11px]">
                              <time dateTime={notification.createdAt}>
                                {formatDate(notification.createdAt)}
                              </time>
                              <Icon
                                className={`h-3.5 w-3.5 ${color} ${filled ? "fill-current" : ""}`}
                                aria-hidden="true"
                              />
                            </span>
                          </span>
                        </Link>

                        {!notification.isRead && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-(--accent)"
                            role="img"
                            aria-label="Non lue"
                          />
                        )}
                        <div className="flex shrink-0 items-center pr-2 sm:pr-3">
                          {!notification.isRead && (
                            <button
                              type="button"
                              onClick={() => void handleMarkRead(notification.id)}
                              aria-label={`Marquer la notification de ${notification.actor.name} comme lue`}
                              title="Marquer comme lu"
                              className="grid h-8 w-8 place-items-center rounded-full text-(--secondary-text) transition-colors hover:bg-(--background) hover:text-(--accent)"
                            >
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDelete(notification.id)}
                            aria-label={`Supprimer la notification de ${notification.actor.name}`}
                            title="Supprimer"
                            className="grid h-8 w-8 place-items-center rounded-full text-(--secondary-text) transition-colors hover:bg-(--background) hover:text-(--danger)"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-6 w-6 text-(--secondary-text)" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-semibold text-(--primary-text)">
              {activeFilter === "unread" ? "Tout est à jour" : "Aucune notification"}
            </h2>
            <p className="mt-1 text-xs text-(--secondary-text)">
              Aucune notification dans cette section pour le moment.
            </p>
          </div>
        )}
        {(apiError || (!authLoading && !isAuthenticated && !isDemoMode ? "Connectez-vous pour consulter vos notifications." : "")) && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300" role="alert">{apiError || "Connectez-vous pour consulter vos notifications."}{!isAuthenticated && !isDemoMode && <Link href="/login" className="ml-2 font-semibold underline">Se connecter</Link>}</p>}
        {!isDemoMode && hasMore && (
          <button type="button" onClick={() => void loadMore()} disabled={isLoadingMore} className="w-full rounded-lg border border-(--border) px-4 py-2.5 text-sm text-(--primary-text) hover:bg-(--muted) disabled:opacity-60">
            {isLoadingMore ? "Chargement…" : "Afficher plus"}
          </button>
        )}
      </div>
    </div>
  );
}
