"use client";

import { useState } from "react";
/* eslint-disable @next/next/no-img-element */

const FALLBACK_AVATAR = "/avatar-placeholder.svg";

interface AvatarImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  title?: string;
  loading?: "eager" | "lazy";
}

export function AvatarImage({
  src,
  alt,
  className,
  title,
  loading = "lazy",
}: AvatarImageProps) {
  const requestedSrc = src?.trim() || FALLBACK_AVATAR;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = failedSrc === requestedSrc ? FALLBACK_AVATAR : requestedSrc;

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      title={title}
      loading={loading}
      decoding="async"
      onError={() => {
        if (requestedSrc !== FALLBACK_AVATAR) setFailedSrc(requestedSrc);
      }}
    />
  );
}
