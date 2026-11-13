"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  MessageSquare,
  Compass,
  GitBranch,
  Users,
  Home,
  Plus,
  LogOut,
  Settings,
  ShieldCheck,
  User as UserIcon,
  Building2,
  FolderGit2,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { authService } from "@/services/auth.service";
import { socialService } from "@/services/social.service";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    isAuthenticated,
    logout,
    notifications,
    conversations,
    setIsSearchOpen,
  } = useAfriHubStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [apiUnreadNotifications, setApiUnreadNotifications] = useState(0);
  const [apiUnreadMessages, setApiUnreadMessages] = useState(0);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const unreadNotifications = isDemoMode
    ? notifications.filter((notification) => !notification.isRead).length
    : isAuthenticated ? apiUnreadNotifications : 0;
  const unreadMessages = isDemoMode
    ? conversations.reduce((total, conversation) => total + conversation.unreadCount, 0)
    : isAuthenticated ? apiUnreadMessages : 0;

  useEffect(() => {
    if (isDemoMode || !isAuthenticated) return;
    let active = true;
    const refreshCounts = async () => {
      const [notificationResult, conversationResult] = await Promise.allSettled([
        socialService.getNotifications({ unread: true, page_size: 1 }),
        socialService.getConversations(),
      ]);
      if (!active) return;
      if (notificationResult.status === "fulfilled") {
        setApiUnreadNotifications(notificationResult.value.count);
      }
      if (conversationResult.status === "fulfilled") {
        setApiUnreadMessages(conversationResult.value.reduce((total, conversation) => total + conversation.unreadCount, 0));
      }
    };
    void refreshCounts();
    window.addEventListener("afrihub:notifications-updated", refreshCounts);
    window.addEventListener("afrihub:conversations-updated", refreshCounts);
    const intervalId = window.setInterval(() => void refreshCounts(), 30_000);
    return () => {
      active = false;
      window.removeEventListener("afrihub:notifications-updated", refreshCounts);
      window.removeEventListener("afrihub:conversations-updated", refreshCounts);
      window.clearInterval(intervalId);
    };
  }, [currentUser.id, isAuthenticated, isDemoMode, pathname]);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <header className="site-navbar sticky top-0 z-40 w-full bg-[#0d1117]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <BrandMark size={32} className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight text-[#e6edf3]">MetafriX</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md px-3 py-2 text-sm text-[#c9d1d9] hover:bg-[#161b22]">
              Connexion
            </Link>
            <Link href="/register" className="rounded-md bg-[#238636] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2ea043]">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const navLinks = [
    { href: "/feed", label: "Accueil", icon: Home },
    { href: "/dashboard", label: "Tableau de bord", icon: GitBranch },
    { href: "/developers", label: "Développeurs", icon: Users },
    { href: "/organizations", label: "Organisations", icon: Building2 },
  ];

  return (
    <header className="site-navbar sticky top-0 z-40 w-full bg-[#0d1117]">
      <div>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <BrandMark size={32} className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight text-[#e6edf3]">
              MetafriX
            </span>
          </Link>

          <div className="mx-2 hidden max-w-md flex-1 sm:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex w-full items-center justify-between rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-1.5 text-left text-sm text-[#8b949e] transition-colors hover:border-[#8b949e] hover:text-[#e6edf3]"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span>Rechercher dans MetafriX</span>
              </span>
              <kbd className="hidden rounded border border-[#30363d] px-1.5 py-0.5 text-[10px] font-mono lg:inline-flex">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Rechercher"
              className="rounded-md p-2 text-[#8b949e] transition-colors hover:bg-[#161b22] hover:text-[#e6edf3] sm:hidden"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Quick Create Button */}
            <div className="relative">
              <button
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className="flex items-center gap-1.5 rounded-md bg-[#238636] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2ea043] sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau</span>
              </button>

              {isNewMenuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-52 rounded-md border border-[#30363d] bg-[#161b22] py-1.5 text-sm shadow-lg"
                  onClick={() => setIsNewMenuOpen(false)}
                >
                  <Link
                    href="/new"
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#e6edf3] transition-colors hover:bg-[#21262d]"
                  >
                    <FolderGit2 className="h-4 w-4 text-[#8b949e]" />
                    <span>Nouveau dépôt Git</span>
                  </Link>
                  <Link
                    href="/feed"
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#e6edf3] transition-colors hover:bg-[#21262d]"
                  >
                    <Compass className="h-4 w-4 text-[#8b949e]" />
                    <span>Nouvelle publication</span>
                  </Link>
                  <Link
                    href="/organizations/new"
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[#e6edf3] transition-colors hover:bg-[#21262d]"
                  >
                    <Building2 className="h-4 w-4 text-[#8b949e]" />
                    <span>Créer une organisation</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Messages */}
            <Link
              href="/messages"
              aria-label="Messagerie"
              className="relative rounded-md p-2 text-[#8b949e] transition-colors hover:bg-[#161b22] hover:text-[#e6edf3]"
            >
              <MessageSquare className="h-4 w-4" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#6366F1] text-[10px] font-bold text-white">
                  {unreadMessages}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative rounded-md p-2 text-[#8b949e] transition-colors hover:bg-[#161b22] hover:text-[#e6edf3]"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            {/* User Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="Ouvrir le menu du compte"
                className="rounded-full p-0.5 transition-opacity hover:opacity-80"
              >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="ui-avatar h-8 w-8 rounded-full border border-[#30363d] object-cover"
              />
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-64 rounded-md border border-[#30363d] bg-[#161b22] py-2 text-sm shadow-lg"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                <div className="border-b border-[#30363d] px-4 py-2">
                  <p className="font-semibold text-[#e6edf3]">{currentUser.name}</p>
                  <p className="text-xs text-[#8b949e]">@{currentUser.username}</p>
                </div>

                <div className="py-1">
                  <Link
                    href={`/developers/${currentUser.username}`}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#c9d1d9] transition-colors hover:bg-[#21262d]"
                  >
                    <UserIcon className="h-4 w-4 text-[#8b949e]" />
                    Votre profil
                  </Link>
                  <Link
                    href={`/divin/afri-pay-gateway`}
                    className="flex items-center gap-2.5 px-4 py-2 text-[#c9d1d9] transition-colors hover:bg-[#21262d]"
                  >
                    <FolderGit2 className="h-4 w-4 text-[#8b949e]" />
                    Vos dépôts ({currentUser.repositoriesCount})
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-[#c9d1d9] transition-colors hover:bg-[#21262d]"
                  >
                    <Settings className="h-4 w-4 text-[#8b949e]" />
                    Paramètres
                  </Link>
                  <Link
                    href="/about"
                    className="flex items-center gap-2.5 px-4 py-2 text-[#c9d1d9] transition-colors hover:bg-[#21262d]"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#8b949e]" />
                    À propos et politiques
                  </Link>
                </div>

                <div className="mt-1 border-t border-[#30363d] pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await authService.logout();
                      } finally {
                        logout();
                        router.replace("/login");
                      }
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[#f85149] transition-colors hover:bg-[#21262d]"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto hidden max-w-7xl px-4 sm:px-6 lg:px-8 md:block">
        <nav
          aria-label="Navigation principale"
          className="flex h-11 gap-5 overflow-x-auto scrollbar-none"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className="flex shrink-0 items-center gap-2 px-3 text-sm text-[#8b949e] transition-colors hover:text-[#e6edf3]"
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-(--accent)" : ""}`}
                  fill={isActive ? "currentColor" : "none"}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <nav
        aria-label="Navigation mobile principale"
        className="mobile-navigation fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 bg-[#0d1117] md:hidden"
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
                className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium text-[#8b949e] transition-colors hover:text-[#e6edf3]"
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-(--accent)" : ""}`}
                fill={isActive ? "currentColor" : "none"}
              />
              <span className="max-w-full truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
