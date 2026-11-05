"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { User } from "@/types";

interface DeveloperSuggestionsCarouselProps {
  users: User[];
  onToggleFollow: (userId: string) => void;
}

export function DeveloperSuggestionsCarousel({
  users,
  onToggleFollow,
}: DeveloperSuggestionsCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const updateScrollState = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    setCanScrollLeft(carousel.scrollLeft > 2);
    setCanScrollRight(maxScrollLeft - carousel.scrollLeft > 2);
  }, []);

  const advanceCarousel = useCallback(() => {
    const carousel = carouselRef.current;
    const firstCard = carousel?.firstElementChild as HTMLElement | null;
    if (!carousel || !firstCard) return;

    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    if (maxScrollLeft <= 2) return;

    const isAtEnd = maxScrollLeft - carousel.scrollLeft <= 2;
    const gap = Number.parseFloat(window.getComputedStyle(carousel).columnGap) || 0;
    const nextPosition = isAtEnd
      ? 0
      : Math.min(carousel.scrollLeft + firstCard.getBoundingClientRect().width + gap, maxScrollLeft);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    carousel.scrollTo({
      left: nextPosition,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, users.length]);

  useEffect(() => {
    if (isHovered || isFocused) return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") advanceCarousel();
    }, 5_000);

    return () => window.clearInterval(interval);
  }, [advanceCarousel, isFocused, isHovered]);

  const scroll = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    carousel.scrollBy({
      left: direction * Math.max(carousel.clientWidth * 0.75, 220),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  if (users.length === 0) return null;

  return (
    <section
      aria-labelledby="developer-suggestions-title"
      className="ui-panel ui-panel-pearl overflow-hidden p-4 sm:p-5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eeebfc] text-[#705bd2]">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="developer-suggestions-title" className="text-sm font-bold text-[#252831] sm:text-base">
              Profils à découvrir
            </h2>
            <p className="mt-0.5 text-xs text-[#656b75]">
              Des développeurs de la communauté MetafriX.
            </p>
          </div>
        </div>

        {(canScrollLeft || canScrollRight) && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Défiler vers la gauche"
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="ui-button ui-button-secondary h-8 w-8 rounded-full p-0 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Défiler vers la droite"
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="ui-button ui-button-secondary h-8 w-8 rounded-full p-0 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={carouselRef}
        role="region"
        aria-label="Profils de développeurs suggérés"
        aria-live="off"
        tabIndex={0}
        onScroll={updateScrollState}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 scrollbar-none focus-visible:outline-none sm:-mx-5 sm:px-5"
      >
        {users.map((user) => (
          <article
            key={user.id}
            className="flex w-24 shrink-0 snap-start flex-col items-center text-center sm:w-28"
          >
            <Link
              href={`/developers/${user.username}`}
              title={`Voir le profil de ${user.name}`}
              className="group flex w-full flex-col items-center rounded-xl"
            >
              <span
                className="mb-2 inline-flex h-21 w-21 rounded-full p-0.75 transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--accent-violet), var(--accent-coral), var(--accent-cyan))",
                }}
              >
                <span className="h-full w-full overflow-hidden rounded-full border-2 border-white bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar}
                    alt=""
                    loading="lazy"
                    className="ui-avatar h-full w-full"
                  />
                </span>
              </span>
              <span className="w-full truncate text-xs font-semibold text-[#252831] transition-colors group-hover:text-[#705bd2] sm:text-sm">
                {user.name}
              </span>
              <span className="w-full truncate text-[11px] text-[#656b75]">
                @{user.username}
              </span>
            </Link>

            <button
              type="button"
              aria-label={`${user.isFollowed ? "Ne plus suivre" : "Suivre"} ${user.name}`}
              aria-pressed={Boolean(user.isFollowed)}
              onClick={() => onToggleFollow(user.id)}
              className={`ui-button mt-2 min-h-8 w-full rounded-full px-2 py-1 text-[11px] sm:text-xs ${
                user.isFollowed ? "ui-button-secondary" : "ui-button-primary"
              }`}
            >
              {user.isFollowed ? "Abonné" : "Suivre"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}