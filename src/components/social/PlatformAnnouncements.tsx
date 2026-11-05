"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Megaphone } from "lucide-react";

const announcements = [
  {
    title: "Les talents tech africains se retrouvent ici",
    description: "Découvrez des profils, partagez vos idées et faites grandir vos projets.",
    illustration: "/illustrations/announcement-community.svg",
    href: "/developers",
    action: "Découvrir la communauté",
  },
  {
    title: "Un projet peut commencer par une idée",
    description: "Présentez vos dépôts et trouvez des personnes pour contribuer.",
    illustration: "/illustrations/announcement-project.svg",
    href: "/new",
    action: "Présenter un projet",
  },
  {
    title: "Apprendre ensemble, progresser plus loin",
    description: "Posez vos questions et partagez les connaissances de votre domaine.",
    illustration: "/illustrations/announcement-learning.svg",
    href: "/feed",
    action: "Partager une publication",
  },
];

export function PlatformAnnouncements() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const activeAnnouncement = announcements[activeIndex];

  useEffect(() => {
    if (
      isHovered ||
      isFocused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setActiveIndex((index) => (index + 1) % announcements.length);
      }
    }, 6_000);

    return () => window.clearInterval(interval);
  }, [isFocused, isHovered]);

  const showAnnouncement = (index: number) => {
    setActiveIndex((index + announcements.length) % announcements.length);
  };

  return (
    <section
      aria-labelledby="platform-announcements-title"
      className="space-y-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Megaphone className="h-4 w-4 shrink-0 text-(--accent)" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="platform-announcements-title" className="text-sm font-semibold text-[#e6edf3]">
              Annonces MetafriX
            </h2>
            <p className="hidden text-xs text-[#8b949e] sm:block">À découvrir dans la communauté</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Afficher l’annonce précédente"
            onClick={() => showAnnouncement(activeIndex - 1)}
            className="grid h-8 w-8 place-items-center text-[#b3b6c0] transition-colors hover:text-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Afficher l’annonce suivante"
            onClick={() => showAnnouncement(activeIndex + 1)}
            className="grid h-8 w-8 place-items-center text-[#b3b6c0] transition-colors hover:text-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        role="region"
        aria-label="Annonces de la plateforme MetafriX"
        aria-live="off"
        className="space-y-2"
      >
        <div
          key={activeAnnouncement.title}
          role="group"
          aria-roledescription="diapositive"
          aria-label={`Annonce ${activeIndex + 1} sur ${announcements.length}`}
        >
          <Link
            href={activeAnnouncement.href}
            className="group relative isolate flex min-h-56 overflow-hidden rounded-xl border border-(--border) bg-[#181b20] sm:min-h-64"
          >
            <div className="absolute inset-y-0 right-0 w-[58%] overflow-hidden sm:w-[54%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeAnnouncement.illustration}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-full w-full object-contain object-right"
              />
            </div>

            <div className="relative z-10 flex min-h-56 w-[72%] flex-col items-start justify-center py-6 pr-3 pl-5 sm:min-h-64 sm:max-w-[72%] sm:py-8 sm:pl-8">
              <h3 className="max-w-[19ch] text-lg font-bold leading-tight tracking-tight text-white sm:text-2xl">
                {activeAnnouncement.title}
              </h3>
              <p className="mt-2 line-clamp-2 max-w-md text-xs leading-relaxed text-white/75 sm:text-sm">
                {activeAnnouncement.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-white transition-colors group-hover:text-(--accent) sm:text-sm">
                {activeAnnouncement.action}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1" role="group" aria-label="Choisir une annonce">
            {announcements.map((announcement, index) => (
              <button
                key={announcement.title}
                type="button"
                aria-label={`Afficher l’annonce ${index + 1} : ${announcement.title}`}
                aria-pressed={activeIndex === index}
                onClick={() => showAnnouncement(index)}
                className="grid h-8 w-8 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent)"
              >
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full transition-all motion-reduce:transition-none ${
                    activeIndex === index
                      ? "scale-125 bg-(--accent)"
                      : "bg-white/25 hover:bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-xs tabular-nums text-[#8b949e]">
            {activeIndex + 1} <span aria-hidden="true">/</span> {announcements.length}
          </span>
        </div>
      </div>
    </section>
  );
}
