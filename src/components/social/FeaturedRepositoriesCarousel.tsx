"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  GitFork,
  Star,
} from "lucide-react";
import type { Repository } from "@/types";

interface FeaturedRepositoriesCarouselProps {
  repositories: Repository[];
}

const wavePalettes = [
  ["#AA99FF", "#72D6E3", "#E94F16"],
  ["#72D6E3", "#E94F16", "#AA99FF"],
  ["#E94F16", "#AA99FF", "#72D6E3"],
];

const wavePaths = [
  "M-24 26C26 26 39 82 90 82s64-56 115-56 64 56 115 56 64-56 115-56",
  "M-24 49C26 49 39 97 90 97s64-48 115-48 64 48 115 48 64-48 115-48",
  "M-24 73C26 73 39 112 90 112s64-39 115-39 64 39 115 39 64-39 115-39",
];

function ProjectWaveArtwork({ index }: { index: number }) {
  const palette = wavePalettes[index % wavePalettes.length];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 360 112"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      {wavePaths.map((path, pathIndex) => (
        <path
          key={path}
          d={path}
          fill="none"
          stroke={palette[pathIndex]}
          strokeOpacity={pathIndex === 1 ? 0.62 : 0.4}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export function FeaturedRepositoriesCarousel({
  repositories,
}: FeaturedRepositoriesCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    setCanScrollLeft(carousel.scrollLeft > 2);
    setCanScrollRight(maxScrollLeft - carousel.scrollLeft > 2);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [repositories.length, updateScrollState]);

  const scroll = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    carousel.scrollBy({
      left: direction * Math.max(carousel.clientWidth * 0.8, 240),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  if (repositories.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-repositories-title"
      className="min-w-0 space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FolderGit2 className="h-5 w-5 shrink-0 text-(--accent)" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="featured-repositories-title" className="text-sm font-extrabold text-white sm:text-base">
              Projets à découvrir
            </h2>
            <p className="mt-0.5 text-xs text-[#b3b6c0]">Des projets open source de la communauté.</p>
          </div>
        </div>

        {(canScrollLeft || canScrollRight) && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Défiler les projets vers la gauche"
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="grid h-8 w-8 place-items-center text-[#b3b6c0] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Défiler les projets vers la droite"
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="grid h-8 w-8 place-items-center text-[#b3b6c0] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={carouselRef}
        role="region"
        aria-label="Projets open source à découvrir"
        aria-live="off"
        tabIndex={0}
        onScroll={updateScrollState}
        className="-mx-1 flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-1 scrollbar-none focus-visible:outline-none sm:gap-8"
      >
        {repositories.map((repository, index) => (
          <Link
            key={repository.id}
            href={`/${repository.owner.username}/${repository.name}`}
            className="feed-featured-card group relative flex min-h-72 w-[min(82vw,19rem)] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-(--border) bg-(--card) transition-colors hover:border-[#454b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:w-72"
          >
            <div className="relative h-24 shrink-0 overflow-hidden bg-[#14171b]">
              <ProjectWaveArtwork index={index} />
              <span className="absolute bottom-3 left-4 text-[11px] font-bold text-white">
                {repository.language}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <div className="flex min-w-0 items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={repository.owner.avatar}
                  alt=""
                  loading="lazy"
                  className="ui-avatar h-8 w-8 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] text-[#aaaeb9]">{repository.owner.username}</p>
                  <h3 className="truncate text-sm font-extrabold text-white transition-colors group-hover:text-(--accent)">
                    {repository.name}
                  </h3>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-[#9da2ae] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-relaxed text-[#c0c3cb]">
                {repository.description}
              </p>

              <div className="mt-auto pt-4">
                <div className="flex items-center gap-4 border-t border-(--border) pt-3 text-[11px] text-[#c7c9d0]">
                  <span className="flex items-center gap-1.5" aria-label={`${repository.starsCount} étoiles`}>
                    <Star className="h-3.5 w-3.5 text-[#f2c477]" aria-hidden="true" />
                    {repository.starsCount}
                  </span>
                  <span className="flex items-center gap-1.5" aria-label={`${repository.forksCount} forks`}>
                    <GitFork className="h-3.5 w-3.5 text-[#9da2ae]" aria-hidden="true" />
                    {repository.forksCount}
                  </span>
                  <span className="ml-auto truncate text-[10px] text-[#9298a3]">
                    {repository.topics.slice(0, 2).map((topic) => `#${topic}`).join(" · ")}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}