"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  User,
  Repository,
  Post,
  Conversation,
  Message,
  NotificationItem,
  Issue,
  PullRequest,
  Organization,
} from "@/types";
import {
  currentUser as initialCurrentUser,
  mockUsers,
  mockRepositories,
  mockPosts,
  mockConversations,
  mockMessages,
  mockNotifications,
  mockOrganizations,
  mockIssues,
  mockPullRequests,
} from "./mock-data";

interface UserPreferences {
  twoFactorEnabled: boolean;
  notifyMentions: boolean;
  notifyPRs: boolean;
  notifyEmailDigest: boolean;
  publicEmail: boolean;
  onlineStatus: boolean;
}

const applyTheme = (theme: "dark" | "light") => {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("light", theme === "light");
  }
};

interface AfriHubState {
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;

  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;

  // Auth
  currentUser: User;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;

  // Repositories
  repositories: Repository[];
  addRepository: (repo: Omit<Repository, "id" | "owner" | "createdAt" | "updatedAt" | "starsCount" | "forksCount" | "watchersCount" | "issuesCount" | "pullsCount">) => Repository;
  toggleStarRepo: (repoId: string) => void;
  deleteRepository: (repoId: string) => void;

  // Posts & Social
  posts: Post[];
  addPost: (post: {
    content: string;
    type: Post["type"];
    codeSnippet?: Post["codeSnippet"];
    repositoryRef?: Post["repositoryRef"];
    mediaUrls?: string[];
  }) => void;
  toggleLikePost: (postId: string) => void;
  toggleBookmarkPost: (postId: string) => void;
  deletePost: (postId: string) => void;

  // Comments
  comments: Record<string, { id: string; author: User; content: string; createdAt: string; likesCount: number; isLiked: boolean }[]>;
  addComment: (postId: string, content: string) => void;

  // Follow / Unfollow
  users: User[];
  toggleFollowUser: (userId: string) => void;

  // Messaging
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string, type?: Message["type"], codeSnippet?: Message["codeSnippet"]) => void;

  // Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;

  // Issues & PRs
  issues: Issue[];
  addIssue: (issue: { repositoryId: string; title: string; body: string; labels: { name: string; color: string }[] }) => void;
  pullRequests: PullRequest[];
  addPullRequest: (pr: { repositoryId: string; title: string; body: string; sourceBranch: string; targetBranch: string }) => void;

  // Organizations
  organizations: Organization[];
  addOrganization: (organization: Omit<Organization, "id">) => Organization;
  addOrganizationRepository: (organizationId: string, repositoryId: string) => void;

  // User preferences
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;

  // Global Search Modal
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export const useAfriHubStore = create<AfriHubState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      theme: "dark",
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme: () => {
        const nextTheme = get().theme === "dark" ? "light" : "dark";
        get().setTheme(nextTheme);
      },

      currentUser: initialCurrentUser,
      isAuthenticated: true,
      login: (email: string) => {
        set({
          isAuthenticated: true,
          currentUser: {
            ...get().currentUser,
            email,
          },
        });
      },
      logout: () => set({ isAuthenticated: false }),
      updateProfile: (updates) =>
        set((state) => ({
          currentUser: { ...state.currentUser, ...updates },
        })),

      repositories: mockRepositories,
      addRepository: (repoData) => {
        const newRepo: Repository = {
          ...repoData,
          id: `repo-${Date.now()}`,
          owner: get().currentUser,
          starsCount: 1,
          forksCount: 0,
          watchersCount: 1,
          issuesCount: 0,
          pullsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          repositories: [newRepo, ...state.repositories],
          currentUser: {
            ...state.currentUser,
            repositoriesCount: state.currentUser.repositoriesCount + 1,
          },
        }));
        return newRepo;
      },
      toggleStarRepo: (repoId) =>
        set((state) => ({
          repositories: state.repositories.map((r) =>
            r.id === repoId
              ? {
                  ...r,
                  starsCount: r.starsCount + 1,
                }
              : r
          ),
        })),
      deleteRepository: (repoId) =>
        set((state) => ({
          repositories: state.repositories.filter((r) => r.id !== repoId),
          currentUser: {
            ...state.currentUser,
            repositoriesCount: Math.max(0, state.currentUser.repositoriesCount - 1),
          },
        })),

      posts: mockPosts,
      addPost: (postData) => {
        const newPost: Post = {
          id: `post-${Date.now()}`,
          author: get().currentUser,
          content: postData.content,
          type: postData.type,
          codeSnippet: postData.codeSnippet,
          repositoryRef: postData.repositoryRef,
          mediaUrls: postData.mediaUrls,
          likesCount: 0,
          isLiked: false,
          commentsCount: 0,
          sharesCount: 0,
          isBookmarked: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ posts: [newPost, ...state.posts] }));
      },
      toggleLikePost: (postId) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: !p.isLiked,
                  likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
                }
              : p
          ),
        })),
      toggleBookmarkPost: (postId) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
          ),
        })),
      deletePost: (postId) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
        })),

      comments: {
        "post-1": [
          {
            id: "c-1",
            author: mockUsers[1],
            content: "Superbe avancée ! La doc est hyper claire. Hâte de tester avec le SDK Python.",
            createdAt: "2026-11-03T09:30:00Z",
            likesCount: 5,
            isLiked: false,
          },
          {
            id: "c-2",
            author: mockUsers[3],
            content: "Le composant QR code est fluide sur mobile ! Excellent travail !",
            createdAt: "2026-11-03T09:45:00Z",
            likesCount: 3,
            isLiked: true,
          },
        ],
      },
      addComment: (postId, content) => {
        const newComment = {
          id: `comment-${Date.now()}`,
          author: get().currentUser,
          content,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          isLiked: false,
        };
        set((state) => ({
          comments: {
            ...state.comments,
            [postId]: [...(state.comments[postId] || []), newComment],
          },
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
          ),
        }));
      },

      users: mockUsers,
      toggleFollowUser: (userId) =>
        set((state) => {
          const user = state.users.find((u) => u.id === userId);
          if (!user) return state;
          const nextIsFollowed = !user.isFollowed;
          const delta = nextIsFollowed ? 1 : -1;

          return {
            users: state.users.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    isFollowed: nextIsFollowed,
                    followersCount: u.followersCount + delta,
                  }
                : u
            ),
            currentUser: {
              ...state.currentUser,
              followingCount: state.currentUser.followingCount + delta,
            },
          };
        }),

      conversations: mockConversations,
      messages: mockMessages,
      activeConversationId: "conv-1",
      setActiveConversationId: (id) => set({ activeConversationId: id }),
      sendMessage: (conversationId, content, type = "text", codeSnippet) => {
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          conversationId,
          sender: get().currentUser,
          content,
          type,
          codeSnippet,
          createdAt: new Date().toISOString(),
          isRead: true,
        };

        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] || []), newMsg],
          },
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  lastMessage: newMsg,
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        }));
      },

      notifications: mockNotifications,
      markNotificationAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        })),
      markAllNotificationsAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),
      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      issues: mockIssues,
      addIssue: (issueData) => {
        const newIssue: Issue = {
          id: `issue-${Date.now()}`,
          repositoryId: issueData.repositoryId,
          number: Math.max(0, ...get().issues.map((issue) => issue.number)) + 1,
          title: issueData.title,
          body: issueData.body,
          author: get().currentUser,
          status: "open",
          labels: issueData.labels,
          assignees: [get().currentUser],
          commentsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ issues: [newIssue, ...state.issues] }));
      },

      pullRequests: mockPullRequests,
      addPullRequest: (prData) => {
        const newPR: PullRequest = {
          id: `pr-${Date.now()}`,
          repositoryId: prData.repositoryId,
          number: Math.max(0, ...get().pullRequests.map((pullRequest) => pullRequest.number)) + 1,
          title: prData.title,
          body: prData.body,
          author: get().currentUser,
          status: "open",
          sourceBranch: prData.sourceBranch,
          targetBranch: prData.targetBranch,
          additions: 15,
          deletions: 2,
          changedFilesCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ pullRequests: [newPR, ...state.pullRequests] }));
      },

      organizations: mockOrganizations,
      addOrganization: (organizationData) => {
        const organization: Organization = {
          ...organizationData,
          id: `org-${Date.now()}`,
        };
        set((state) => ({ organizations: [organization, ...state.organizations] }));
        return organization;
      },
      addOrganizationRepository: (organizationId, repositoryId) =>
        set((state) => ({
          organizations: state.organizations.map((organization) =>
            organization.id === organizationId &&
            !organization.repositoryIds?.includes(repositoryId)
              ? {
                  ...organization,
                  repositoriesCount: organization.repositoriesCount + 1,
                  repositoryIds: [...(organization.repositoryIds || []), repositoryId],
                }
              : organization
          ),
        })),

      preferences: {
        twoFactorEnabled: true,
        notifyMentions: true,
        notifyPRs: true,
        notifyEmailDigest: false,
        publicEmail: false,
        onlineStatus: true,
      },
      updatePreferences: (updates) =>
        set((state) => ({ preferences: { ...state.preferences, ...updates } })),

      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),
      isSearchOpen: false,
      setIsSearchOpen: (open) => set({ isSearchOpen: open }),
    }),
    {
      name: "afrihub-storage",
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme || "dark");
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        theme: state.theme,
        currentUser: state.currentUser,
        repositories: state.repositories,
        organizations: state.organizations,
        preferences: state.preferences,
        version: 0,
      }),
    }
  )
);
