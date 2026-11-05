import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Code2,
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";

export const metadata: Metadata = {
  title: "À propos et politiques | MetafriX",
  description:
    "Découvrez MetafriX, sa mission, sa charte de communauté et les principes de confidentialité et d’utilisation de la plateforme.",
};

const pageSections = [
  { id: "mission", label: "Notre mission" },
  { id: "communaute", label: "Communauté" },
  { id: "confidentialite", label: "Confidentialité" },
  { id: "conditions", label: "Conditions d’utilisation" },
  { id: "propriete", label: "Contenus & licences" },
  { id: "mentions", label: "Mentions légales" },
];

const principles: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Code2,
    title: "Partager le code",
    description: "Des dépôts pour documenter, expérimenter et bâtir à plusieurs.",
  },
  {
    icon: Users,
    title: "Rencontrer sa communauté",
    description: "Des échanges pour apprendre et trouver de nouveaux partenaires.",
  },
  {
    icon: HeartHandshake,
    title: "Faire grandir les idées",
    description: "Un espace pour transformer les initiatives en projets durables.",
  },
];

const communityGuidelines = [
  {
    title: "Respect et bienveillance",
    description:
      "Échangez avec respect. Le harcèlement, les propos discriminatoires, les menaces et les attaques personnelles n’ont pas leur place ici.",
  },
  {
    title: "Contributions authentiques",
    description:
      "Présentez honnêtement votre travail, créditez les autres contributeurs et évitez le spam ou l’usurpation d’identité.",
  },
  {
    title: "Sécurité avant tout",
    description:
      "Ne publiez pas de mots de passe, clés privées, jetons d’accès, données personnelles ou code que vous n’êtes pas autorisé à partager.",
  },
  {
    title: "Utilisation responsable",
    description:
      "N’utilisez pas MetafriX pour enfreindre la loi, perturber le service, contourner les contrôles d’accès ou porter atteinte aux droits d’autrui.",
  },
];

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3.5 sm:mb-6">
      <Icon className="mt-1 h-4.5 w-4.5 shrink-0 text-(--accent)" aria-hidden="true" />
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-(--primary-text) sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-(--secondary-text)">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-9 lg:px-8">
      <div className="space-y-8 sm:space-y-11">
        <header className="relative isolate overflow-hidden py-6 sm:py-9 lg:py-12">
          <svg
            className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[45%] text-(--accent) opacity-[0.1] sm:block"
            viewBox="0 0 320 320"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="metafrix-geometric-pattern"
                width="56"
                height="56"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M28 2 54 28 28 54 2 28Z M28 12 44 28 28 44 12 28Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                />
                <path
                  d="M0 0 28 28M56 0 28 28M0 56 28 28M56 56 28 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.6"
                  opacity="0.65"
                />
                <circle cx="28" cy="28" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="320" height="320" fill="url(#metafrix-geometric-pattern)" />
          </svg>

          <div className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 sm:block lg:right-8">
            <BrandMark size={220} className="h-44 w-44 opacity-20 lg:h-52 lg:w-52" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-(--secondary-text)">
              MetafriX <span className="mx-1.5 text-(--accent)">/</span> À propos & politiques
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-(--primary-text) sm:text-4xl lg:text-[2.75rem]">
              Le code nous rapproche.
              <span className="block text-(--accent)">Construisons ensemble.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-(--secondary-text) sm:text-base">
              MetafriX réunit projets, développeurs et organisations pour faire
              avancer les idées et la technologie en Afrique et ailleurs.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#mission"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-(--action) px-4 text-sm font-semibold text-white transition-colors hover:bg-(--action-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              >
                Découvrir notre mission
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#communaute"
                className="inline-flex min-h-10 items-center rounded-lg border border-(--border) bg-(--background)/50 px-4 text-sm font-medium text-(--primary-text) transition-colors hover:bg-(--muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              >
                Lire la charte
              </Link>
            </div>
          </div>
        </header>

        <div className="grid min-w-0 gap-7 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
          <aside className="min-w-0 self-start lg:sticky lg:top-28">
            <p className="mb-3 hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-(--secondary-text) lg:block">
              Dans cette page
            </p>
            <nav
              aria-label="Sommaire des informations"
              className="-mx-4 flex gap-x-4 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:block lg:space-y-2 lg:overflow-visible lg:px-0 lg:pb-0"
            >
              {pageSections.map((section, index) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  className="inline-flex min-h-8 shrink-0 items-center gap-2 text-xs text-(--secondary-text) transition-colors hover:text-(--accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) lg:min-h-7 lg:w-full"
                >
                  <span className="font-mono text-[10px] text-(--accent)/80">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.label}
                </Link>
              ))}
            </nav>
          </aside>

          <article className="min-w-0 space-y-9 sm:space-y-11">
            <section id="mission" className="scroll-mt-24">
              <SectionHeading
                icon={Code2}
                title="Un espace pour faire grandir les idées"
                description="Nous voulons rendre la collaboration technique plus accessible : du premier dépôt aux communautés qui développent des outils pour répondre à des besoins concrets."
              />
              <div className="grid gap-x-7 gap-y-5 sm:grid-cols-3">
                {principles.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-(--accent)" aria-hidden="true" />
                    <div>
                      <h3 className="text-sm font-semibold text-(--primary-text)">{title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-(--secondary-text)">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="communaute" className="scroll-mt-24">
              <SectionHeading
                icon={HeartHandshake}
                title="Charte de la communauté"
                description="Chaque membre contribue à garder MetafriX utile, accueillant et sûr. En utilisant la plateforme, vous vous engagez à suivre ces règles."
              />
              <ol className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {communityGuidelines.map((guideline) => (
                  <li key={guideline.title} className="py-2">
                    <div>
                      <h3 className="text-sm font-semibold text-(--primary-text)">
                        {guideline.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-(--secondary-text)">
                        {guideline.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-(--secondary-text)">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--success)" aria-hidden="true" />
                Les contenus qui mettent la communauté en danger ou enfreignent
                ces règles peuvent faire l’objet d’un signalement et d’une modération.
              </p>
            </section>

            <section id="confidentialite" className="scroll-mt-24">
              <SectionHeading
                icon={LockKeyhole}
                title="Confidentialité et données"
                description="Comprenez quelles informations vous partagez et choisissez avec soin ce qui est public."
              />
              <div className="space-y-3 text-sm leading-relaxed text-(--secondary-text)">
                <p>
                  Un profil peut contenir un nom, un identifiant, une biographie,
                  un avatar, une localisation et des liens. Les publications,
                  dépôts et informations d’organisation que vous choisissez de
                  rendre visibles peuvent être consultés par d’autres membres.
                  Ne publiez que ce que vous souhaitez partager.
                </p>
                <p>
                  Dans le prototype actuel, certaines données de démonstration,
                  de profil, d’organisation, de dépôt et de préférences sont
                  conservées dans le stockage local de votre navigateur. Les
                  paramètres du compte permettent de régler plusieurs préférences
                  d’affichage et de confidentialité.
                </p>
              </div>
              <div className="mt-5">
                <p className="text-xs font-semibold text-(--primary-text)">
                  À préciser avant la mise en production
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-(--secondary-text)">
                  Les données réellement collectées côté serveur, leur durée de
                  conservation, les éventuels prestataires, les modalités de
                  suppression et le contact responsable des demandes relatives
                  aux données devront être documentés pour le service final.
                </p>
              </div>
              <Link
                href="/settings"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-(--accent) hover:underline"
              >
                Gérer les paramètres de confidentialité
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </section>

            <section id="conditions" className="scroll-mt-24">
              <SectionHeading
                icon={ShieldCheck}
                title="Un usage responsable de MetafriX"
                description="En créant un compte ou en utilisant la plateforme, vous acceptez de respecter les autres membres, leurs droits et le bon fonctionnement du service."
              />
              <ul className="space-y-3">
                {[
                  "Vous êtes responsable des informations et contenus publiés depuis votre compte.",
                  "Vous devez disposer des droits nécessaires pour partager un dépôt, un texte, une image ou toute autre contribution.",
                  "Il est interdit de tenter d’accéder sans autorisation aux comptes, données ou systèmes d’autres personnes, ou de perturber le service.",
                  "Vous pouvez cesser d’utiliser la plateforme à tout moment. Les modalités techniques de fermeture et d’effacement doivent être précisées pour le service final.",
                ].map((condition) => (
                  <li key={condition} className="text-sm leading-relaxed text-(--secondary-text)">
                    {condition}
                  </li>
                ))}
              </ul>
            </section>

            <section id="propriete" className="scroll-mt-24">
              <SectionHeading
                icon={BookOpen}
                title="Contenus, code et licences"
                description="Les auteurs conservent leurs droits sur les contenus qu’ils créent, sous réserve des licences qu’ils choisissent d’appliquer."
              />
              <div className="space-y-3 text-sm leading-relaxed text-(--secondary-text)">
                <p>
                  Publier un projet sur MetafriX ne le place pas automatiquement
                  sous une licence open source. Ajoutez une licence explicite à
                  vos dépôts si vous souhaitez autoriser leur réutilisation, et
                  respectez les licences des dépendances et contributions tierces.
                </p>
                <p>
                  En partageant du contenu avec une audience, vous autorisez son
                  affichage dans le cadre des fonctionnalités de la plateforme.
                  Vous restez responsable de ne pas y inclure de code
                  confidentiel, de secrets ou de données que vous n’avez pas le
                  droit de diffuser.
                </p>
              </div>
            </section>

            <section id="mentions" className="scroll-mt-24">
              <SectionHeading
                icon={Users}
                title="Mentions légales et contact"
              />
              <div className="relative max-w-3xl overflow-hidden">
                <div className="pointer-events-none absolute -right-2 -bottom-8 flex gap-2 opacity-20" aria-hidden="true">
                  <span className="h-10 w-10 rotate-45 border border-(--accent)" />
                  <span className="-ml-7 mt-2 h-10 w-10 rotate-45 border border-(--accent)" />
                  <span className="-ml-7 mt-4 h-10 w-10 rotate-45 border border-(--accent)" />
                </div>
                <p className="text-sm leading-relaxed text-(--secondary-text)">
                  <span className="font-semibold text-(--primary-text)">À compléter avant l’ouverture publique. </span>
                    MetafriX est en cours de développement. Cette page devra
                    recevoir l’identité légale de l’éditeur, ses coordonnées, le
                    pays d’établissement, les informations d’hébergement et un
                    canal de contact officiel. Ces règles constituent une base
                    de présentation et doivent être validées et adaptées au
                    service réellement déployé.
                </p>
              </div>
            </section>

            <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <BrandMark size={30} className="h-7 w-7 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-(--primary-text)">
                    Le prochain projet peut commencer ici.
                  </p>
                  <p className="mt-1 text-xs text-(--secondary-text)">
                    Merci de contribuer à une communauté technique ouverte et respectueuse.
                  </p>
                </div>
              </div>
              <Link
                href="/organizations"
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 text-sm font-semibold text-(--accent) transition-colors hover:text-(--primary-text)"
              >
                Explorer les organisations
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}