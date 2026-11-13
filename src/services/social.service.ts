import { apiClient } from "./api";
import type { Conversation, NotificationItem, Organization, Post, User } from "@/types";

export interface ApiPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PostCreatePayload {
  content: string;
  type: Post["type"];
  codeSnippet?: Post["codeSnippet"];
  repositoryId?: string;
  mediaUrl?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  author: User;
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface OrganizationCreatePayload {
  name: string;
  slug: string;
  description: string;
  website: string;
  location: string;
}

export const socialService = {
  async getPosts(params: Record<string, string | number | undefined> = {}) {
    const response = await apiClient.get<ApiPage<Post>>("/posts/", { params });
    return response.data;
  },

  async createPost(payload: PostCreatePayload) {
    const response = await apiClient.post<Post>("/posts/", payload);
    return response.data;
  },

  async deletePost(postId: string) {
    await apiClient.delete(`/posts/${encodeURIComponent(postId)}/`);
  },

  async getComments(postId: string) {
    const response = await apiClient.get<PostComment[]>(`/posts/${encodeURIComponent(postId)}/comments/`);
    return response.data;
  },

  async createComment(postId: string, content: string) {
    const response = await apiClient.post<PostComment>(`/posts/${encodeURIComponent(postId)}/comments/`, { content });
    return response.data;
  },

  async setPostLiked(postId: string, liked: boolean) {
    const url = `/posts/${encodeURIComponent(postId)}/like/`;
    const response = liked ? await apiClient.put(url) : await apiClient.delete(url);
    return response.data as { isLiked: boolean; likesCount: number };
  },

  async setPostBookmarked(postId: string, bookmarked: boolean) {
    const url = `/posts/${encodeURIComponent(postId)}/bookmark/`;
    const response = bookmarked ? await apiClient.put(url) : await apiClient.delete(url);
    return response.data as { isBookmarked: boolean };
  },

  async getDevelopers(params: { search?: string; expertise?: string; page?: number; page_size?: number } = {}) {
    const response = await apiClient.get<ApiPage<User>>("/developers/", { params });
    return response.data;
  },

  async getDeveloper(username: string) {
    const response = await apiClient.get<User>(`/developers/${encodeURIComponent(username)}/`);
    return response.data;
  },

  async setFollowed(username: string, followed: boolean) {
    const url = `/developers/${encodeURIComponent(username)}/follow/`;
    const response = followed ? await apiClient.put(url) : await apiClient.delete(url);
    return response.data as { isFollowed: boolean; followersCount: number };
  },

  async getOrganizations(params: { search?: string; mine?: boolean; sort?: "recent" | "name"; page?: number; page_size?: number } = {}) {
    const response = await apiClient.get<ApiPage<Organization>>("/organizations/", { params });
    return response.data;
  },

  async getOrganization(slug: string) {
    const response = await apiClient.get<Organization & { repositories?: import("@/types").Repository[]; isMember?: boolean; viewerRole?: string | null }>(
      `/organizations/${encodeURIComponent(slug)}/`,
    );
    return response.data;
  },

  async createOrganization(payload: OrganizationCreatePayload) {
    const response = await apiClient.post<Organization>("/organizations/", payload);
    return response.data;
  },

  async joinOrganization(slug: string) {
    const response = await apiClient.post(`/organizations/${encodeURIComponent(slug)}/members/`);
    return response.data as { isMember: boolean; created: boolean };
  },

  async leaveOrganization(slug: string) {
    await apiClient.delete(`/organizations/${encodeURIComponent(slug)}/members/`);
  },

  async setOrganizationMemberRole(slug: string, userId: string, role: "admin" | "member") {
    const response = await apiClient.patch(
      `/organizations/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}/`,
      { role },
    );
    return response.data as { userId: string; role: "admin" | "member" };
  },

  async removeOrganizationMember(slug: string, userId: string) {
    await apiClient.delete(
      `/organizations/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}/`,
    );
  },

  async addOrganizationRepository(slug: string, repositoryId: string) {
    const response = await apiClient.post(`/organizations/${encodeURIComponent(slug)}/repositories/`, { repositoryId });
    return response.data as { repositoryId: string; created: boolean };
  },

  async removeOrganizationRepository(slug: string, repositoryId: string) {
    await apiClient.delete(
      `/organizations/${encodeURIComponent(slug)}/repositories/${encodeURIComponent(repositoryId)}/`,
    );
  },

  async getConversations() {
    const response = await apiClient.get<Conversation[]>("/conversations/");
    return response.data;
  },

  async getOrCreateDirectConversation(username: string) {
    const response = await apiClient.post<Conversation>("/conversations/direct/", { username });
    return response.data;
  },

  async createGroupConversation(name: string, usernames: string[]) {
    const response = await apiClient.post<Conversation>("/conversations/", { name, usernames });
    return response.data;
  },

  async getMessages(conversationId: string) {
    const response = await apiClient.get<import("@/types").Message[]>(
      `/conversations/${encodeURIComponent(conversationId)}/messages/`,
    );
    return response.data;
  },

  async sendMessage(conversationId: string, payload: {
    content: string;
    type?: "text" | "code";
    codeSnippet?: { language: string; code: string };
  }) {
    const response = await apiClient.post<import("@/types").Message>(
      `/conversations/${encodeURIComponent(conversationId)}/messages/`,
      payload,
    );
    return response.data;
  },

  async getNotifications(params: { page?: number; unread?: boolean; page_size?: number } = {}) {
    const response = await apiClient.get<ApiPage<NotificationItem>>("/notifications/", { params });
    return response.data;
  },

  async markNotificationRead(id: string) {
    const response = await apiClient.patch<NotificationItem>(`/notifications/${encodeURIComponent(id)}/`);
    return response.data;
  },

  async markAllNotificationsRead() {
    const response = await apiClient.post<{ updated: number }>("/notifications/read-all/");
    return response.data;
  },

  async deleteNotification(id: string) {
    await apiClient.delete(`/notifications/${encodeURIComponent(id)}/`);
  },
};
