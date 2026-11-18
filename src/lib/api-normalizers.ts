import type { User } from "@/types";

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function numberOrZero(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function backendMediaOrigin(): string {
  const configuredOrigin = process.env.NEXT_PUBLIC_BACKEND_MEDIA_URL?.trim();
  if (configuredOrigin) return configuredOrigin.replace(/\/+$/, "");
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  return "";
}

function normalizeAvatar(value: unknown): string {
  const avatar = firstString(value);
  if (!avatar) return "";
  if (/^(?:https?:)?\/\//i.test(avatar) || /^(?:data|blob):/i.test(avatar)) {
    return avatar;
  }
  if (avatar === "avatar-placeholder.svg") return `/${avatar}`;
  if (avatar === "/avatar-placeholder.svg") return avatar;

  const isMediaPath = avatar.startsWith("/media/") || avatar.startsWith("media/") || !avatar.startsWith("/");
  if (!isMediaPath) return avatar;

  const mediaPath = avatar.replace(/^\/?media\//, "");
  const path = `/media/${mediaPath}`;
  const origin = backendMediaOrigin();
  return origin ? `${origin}${path}` : path;
}

export function normalizeUser(value: unknown): User {
  const data = isRecord(value) ? value : {};
  const username = firstString(data.username, data.userName, data.login, data.id) ?? "unknown";
  const isEmailUsername = !firstString(data.name) && username.includes("@");
  const accountEmail = firstString(data.email) ?? (isEmailUsername ? username : undefined);
  const firstName = firstString(data.firstName, data.first_name) ?? "";
  const lastName = firstString(data.lastName, data.last_name) ?? "";
  const name = firstString(data.name) ?? ([firstName, lastName].filter(Boolean).join(" ") || (isEmailUsername ? "Développeur" : username));
  const expertise = firstString(
    data.expertiseDomain,
    data.expertise_domain,
    data.expertise,
  );
  const emailVerified = data.emailVerified ?? data.is_email_verified;
  const isFollowed = data.isFollowed ?? data.is_followed;

  return {
    id: String(data.id ?? data.pk ?? username),
    username,
    name,
    email: accountEmail,
    emailVerified: typeof emailVerified === "boolean" ? emailVerified : undefined,
    avatar: normalizeAvatar(
      firstString(data.avatar, data.avatarUrl, data.avatar_url, data.profileImg, data.profile_img),
    ),
    coverImage: firstString(data.coverImage, data.cover_image),
    bio: firstString(data.bio) ?? "",
    location: firstString(data.location),
    website: firstString(data.website, data.siteUrl, data.site_url),
    githubUrl: firstString(data.githubUrl, data.github_url),
    twitterUrl: firstString(data.twitterUrl, data.twitter_url),
    skills: stringArray(data.skills).length
      ? stringArray(data.skills)
      : expertise ? [expertise] : [],
    technologies: stringArray(data.technologies),
    followersCount: numberOrZero(data.followersCount ?? data.followers_count),
    followingCount: numberOrZero(data.followingCount ?? data.following_count),
    repositoriesCount: numberOrZero(data.repositoriesCount ?? data.repositories_count),
    contributionsCount: numberOrZero(data.contributionsCount ?? data.contributions_count),
    isFollowed: typeof isFollowed === "boolean" ? isFollowed : undefined,
    createdAt: firstString(data.createdAt, data.created_at) ?? "",
  };
}

function looksLikeUser(value: ApiRecord): boolean {
  return typeof value.username === "string" && [
    "id",
    "name",
    "firstName",
    "first_name",
    "lastName",
    "last_name",
    "expertiseDomain",
    "expertise_domain",
    "avatar",
    "profileImg",
    "profile_img",
    "followersCount",
    "followers_count",
    "skills",
    "emailVerified",
    "is_email_verified",
  ].some((key) => key in value);
}

function normalizeRecord(value: ApiRecord): ApiRecord {
  const normalized = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, normalizeApiResponse(item)]),
  );

  if (looksLikeUser(normalized)) return normalizeUser(normalized) as unknown as ApiRecord;
  if (typeof normalized.avatar === "string") {
    normalized.avatar = normalizeAvatar(normalized.avatar);
  }

  const isPost =
    typeof normalized.content === "string" &&
    isRecord(normalized.author) &&
    "mediaUrls" in normalized;
  if (isPost) {
    const comments = Array.isArray(normalized.comments) ? normalized.comments : [];
    return {
      ...normalized,
      commentsCount: numberOrZero(normalized.commentsCount ?? comments.length),
    };
  }

  const isPostComment =
    typeof normalized.content === "string" &&
    isRecord(normalized.author) &&
    "postId" in normalized;
  if (isPostComment) {
    return {
      ...normalized,
      likesCount: numberOrZero(normalized.likesCount),
      isLiked: normalized.isLiked === true,
    };
  }

  return normalized;
}

/** Converts backend DTO variants to the stable shapes consumed by the UI. */
export function normalizeApiResponse<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeApiResponse(item)) as T;
  }
  if (!isRecord(value)) return value;
  return normalizeRecord(value) as T;
}
