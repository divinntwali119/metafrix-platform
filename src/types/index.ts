export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  location?: string;
  website?: string;
  githubUrl?: string;
  twitterUrl?: string;
  skills: string[];
  technologies: string[];
  followersCount: number;
  followingCount: number;
  repositoriesCount: number;
  contributionsCount: number;
  isFollowed?: boolean;
  createdAt: string;
}

export interface Repository {
  id: string;
  name: string;
  organizationId?: string;
  owner: User;
  description: string;
  isPrivate: boolean;
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  watchersCount: number;
  issuesCount: number;
  pullsCount: number;
  language: string;
  languageColor: string;
  size: string;
  updatedAt: string;
  createdAt: string;
  license?: string;
  topics: string[];
}

export interface FileTreeItem {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: string;
  lastCommitMessage?: string;
  lastCommitDate?: string;
}

export interface Commit {
  id: string;
  repositoryId?: string;
  shortSha: string;
  message: string;
  author: User;
  date: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface Issue {
  id: string;
  repositoryId?: string;
  number: number;
  title: string;
  body: string;
  author: User;
  status: "open" | "closed";
  labels: { name: string; color: string }[];
  assignees: User[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequest {
  id: string;
  repositoryId?: string;
  number: number;
  title: string;
  body: string;
  author: User;
  status: "open" | "merged" | "closed";
  sourceBranch: string;
  targetBranch: string;
  additions: number;
  deletions: number;
  changedFilesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CodeDiff {
  filename: string;
  status: "modified" | "added" | "deleted";
  additions: number;
  deletions: number;
  hunks: {
    oldStart: number;
    newStart: number;
    lines: {
      type: "add" | "delete" | "context";
      content: string;
      oldLineNumber?: number;
      newLineNumber?: number;
    }[];
  }[];
}

export interface Post {
  id: string;
  author: User;
  content: string;
  type: "text" | "code" | "project" | "tutorial" | "question" | "announcement";
  codeSnippet?: {
    language: string;
    code: string;
    filename?: string;
  };
  repositoryRef?: {
    id: string;
    name: string;
    ownerUsername: string;
    description: string;
    starsCount: number;
    language: string;
  };
  mediaUrls?: string[];
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  sharesCount: number;
  isBookmarked: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
}

export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  content: string;
  type: "text" | "code" | "repository" | "file";
  codeSnippet?: {
    language: string;
    code: string;
  };
  repositoryRef?: {
    id: string;
    name: string;
    ownerUsername: string;
  };
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  type:
    | "comment"
    | "reaction"
    | "reply"
    | "follow"
    | "mention"
    | "message"
    | "collab_invite"
    | "issue_assigned"
    | "pr_review";
  actor: User;
  message: string;
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar: string;
  website: string;
  location?: string;
  membersCount: number;
  repositoriesCount: number;
  repositoryIds?: string[];
  createdAt: string;
  members: {
    user: User;
    role: "owner" | "admin" | "member";
  }[];
}
