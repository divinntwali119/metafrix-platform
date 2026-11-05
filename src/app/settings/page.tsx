"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import {
  Bell,
  Check,
  Contact,
  Eye,
  Palette,
  Save,
  Shield,
  Smartphone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAfriHubStore } from "@/lib/store";
import { authService } from "@/services/auth.service";
import type { User } from "@/types";

type SettingsTab =
  | "profile"
  | "personal"
  | "security"
  | "notifications"
  | "privacy"
  | "appearance";

const settingsTabs: { id: SettingsTab; label: string; Icon: LucideIcon }[] = [
  { id: "profile", label: "Profil public", Icon: UserRound },
  { id: "personal", label: "Infos personnelles", Icon: Contact },
  { id: "security", label: "Sécurité & 2FA", Icon: Shield },
  { id: "notifications", label: "Notifications", Icon: Bell },
  { id: "privacy", label: "Confidentialité", Icon: Eye },
  { id: "appearance", label: "Affichage & thème", Icon: Palette },
];

const fieldClassName =
  "w-full rounded-lg border border-(--border) bg-(--card) px-3.5 py-2.5 text-sm text-(--primary-text) outline-none transition-colors placeholder:text-(--secondary-text) focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20";

export default function SettingsPage() {
  const { currentUser, hasHydrated } = useAfriHubStore();

  if (!hasHydrated) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8" role="status" aria-busy="true">
        <span className="sr-only">Chargement des paramètres…</span>
        <div className="space-y-3">
          <div className="h-3 w-16 animate-pulse rounded bg-(--muted)" />
          <div className="h-8 w-64 max-w-full animate-pulse rounded bg-(--muted)" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-(--muted)" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <div className="h-12 animate-pulse rounded-lg bg-(--muted) lg:h-64" />
          <div className="h-96 animate-pulse rounded-xl border border-(--border) bg-(--card)" />
        </div>
      </div>
    );
  }

  return <SettingsForm key={currentUser.id} currentUser={currentUser} />;
}

function SettingsForm({ currentUser }: { currentUser: User }) {
  const { updateProfile, preferences, updatePreferences, theme, setTheme } =
    useAfriHubStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isSaved, setIsSaved] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location || "");
  const [website, setWebsite] = useState(currentUser.website || "");
  const [github, setGithub] = useState(currentUser.githubUrl || "");
  const [twitter, setTwitter] = useState(currentUser.twitterUrl || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Partial<Record<SettingsTab, HTMLButtonElement>>>({});

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setFormError("");
    setIsSaved(false);
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: SettingsTab
  ) => {
    const currentIndex = settingsTabs.findIndex((tab) => tab.id === currentTab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % settingsTabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + settingsTabs.length) % settingsTabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = settingsTabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTab = settingsTabs[nextIndex].id;
    selectTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Sélectionnez un fichier image valide.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError("L'image doit faire moins de 2 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
        setFormError("");
        setIsSaved(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsSaved(false);

    if (activeTab === "security") {
      if (!currentPassword || !newPassword) {
        setFormError("Renseignez le mot de passe actuel et le nouveau mot de passe.");
        return;
      }
      if (newPassword.length < 8) {
        setFormError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
        return;
      }

      setIsSaving(true);
      try {
        await authService.changePassword(currentPassword, newPassword);
        setCurrentPassword("");
        setNewPassword("");
        setIsSaved(true);
        window.setTimeout(() => setIsSaved(false), 2500);
      } catch {
        setFormError(
          "La modification a échoué. Vérifiez le mot de passe actuel ou réessayez lorsque le service est disponible."
        );
      } finally {
        setIsSaving(false);
      }
      return;
    }

    updateProfile({
      name: name.trim(),
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim() || undefined,
      githubUrl: github.trim() || undefined,
      twitterUrl: twitter.trim() || undefined,
      email: email.trim(),
      phone: phone.trim() || undefined,
      avatar,
    });
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:px-8">
      <div className="space-y-6 sm:space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--accent)">
            Compte
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-(--primary-text) sm:text-3xl">
            Paramètres du compte
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-(--secondary-text)">
            Gérez votre profil, vos préférences et la sécurité de votre compte MetafriX.
          </p>
        </header>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
          <nav
            aria-label="Sections des paramètres"
            role="tablist"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {settingsTabs.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  ref={(element) => {
                    tabRefs.current[id] = element || undefined;
                  }}
                  type="button"
                  role="tab"
                  id={`settings-tab-${id}`}
                  aria-selected={isActive}
                  aria-controls="settings-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => selectTab(id)}
                  onKeyDown={(event) => handleTabKeyDown(event, id)}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg border px-3 text-left text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) lg:w-full ${
                    isActive
                      ? "border-(--accent)/30 bg-(--accent)/10 text-(--accent)"
                      : "border-(--border) text-(--secondary-text) hover:bg-(--muted) hover:text-(--primary-text) lg:border-transparent lg:hover:border-(--border)"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </nav>

          <section
            id="settings-panel"
            role="tabpanel"
            aria-labelledby={`settings-tab-${activeTab}`}
            tabIndex={0}
            className="min-w-0 rounded-xl border border-(--border) bg-(--card) p-4 shadow-sm shadow-black/5 outline-none focus-visible:ring-2 focus-visible:ring-(--accent)/40 sm:p-6 lg:p-8"
          >
            <form onSubmit={handleSave} className="space-y-7">
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-(--primary-text)">Profil public</h2>
                    <p className="mt-1 text-sm text-(--secondary-text)">
                      Ces informations sont visibles par les autres développeurs sur MetafriX.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-(--border) bg-(--muted)">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatar}
                        alt={currentUser.name}
                        className="ui-avatar h-full w-full object-cover"
                      />
                    </span>
                    <div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="inline-flex min-h-9 items-center rounded-lg border border-(--border) bg-(--muted) px-3 text-xs font-semibold text-(--primary-text) transition-colors hover:border-(--secondary-text)"
                      >
                        Changer l&apos;avatar
                      </button>
                      <p className="mt-1.5 text-xs text-(--secondary-text)">
                        JPG, PNG ou WebP · 2 Mo maximum
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="settings-name" className="mb-1.5 block text-sm font-medium text-(--primary-text)">
                        Nom complet
                      </label>
                      <input id="settings-name" type="text" value={name} onChange={(event) => setName(event.target.value)} className={fieldClassName} />
                    </div>
                    <div>
                      <label htmlFor="settings-bio" className="mb-1.5 block text-sm font-medium text-(--primary-text)">
                        Bio professionnelle
                      </label>
                      <textarea id="settings-bio" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} className={`${fieldClassName} resize-y`} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="settings-location" className="mb-1.5 block text-sm font-medium text-(--primary-text)">
                          Localisation
                        </label>
                        <input id="settings-location" type="text" value={location} onChange={(event) => setLocation(event.target.value)} className={fieldClassName} />
                      </div>
                      <div>
                        <label htmlFor="settings-website" className="mb-1.5 block text-sm font-medium text-(--primary-text)">
                          Site web
                        </label>
                        <input id="settings-website" type="url" value={website} onChange={(event) => setWebsite(event.target.value)} className={fieldClassName} />
                      </div>
                      <div>
                        <label htmlFor="settings-github" className="mb-1.5 block text-sm font-medium text-(--primary-text)">
                          GitHub
                        </label>
                        <input id="settings-github" type="text" value={github} onChange={(event) => setGithub(event.target.value)} className={fieldClassName} />
                      </div>
                      <div>
                        <label htmlFor="settings-twitter" className="mb-1.5 block text-sm font-medium text-(--primary-text)">
                          Twitter / X
                        </label>
                        <input id="settings-twitter" type="text" value={twitter} onChange={(event) => setTwitter(event.target.value)} className={fieldClassName} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "personal" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-(--primary-text)">Informations personnelles</h2>
                    <p className="mt-1 text-sm text-(--secondary-text)">
                      Coordonnées privées utilisées pour votre compte et les notifications.
                    </p>
                  </div>
                  <div className="max-w-xl space-y-4">
                    <div>
                      <label htmlFor="settings-email" className="mb-1.5 block text-sm font-medium text-(--primary-text)">
                        Adresse e-mail principale
                      </label>
                      <input id="settings-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClassName} />
                    </div>
                    <div>
                      <label htmlFor="settings-phone" className="mb-1.5 block text-sm font-medium text-(--primary-text)">
                        Numéro de téléphone
                      </label>
                      <input id="settings-phone" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+250 788 123 456" className={fieldClassName} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-(--primary-text)">Sécurité & connexion</h2>
                    <p className="mt-1 text-sm text-(--secondary-text)">
                      Renforcez la protection de votre compte et gérez votre mot de passe.
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 rounded-lg border border-(--border) p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-(--muted) text-(--accent)">
                        <Smartphone className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-(--primary-text)">Authentification à deux facteurs (2FA)</p>
                        <p className="mt-1 text-xs leading-relaxed text-(--secondary-text)">
                          Ajoutez une étape de vérification à la connexion.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-label="Authentification à deux facteurs"
                      aria-checked={preferences.twoFactorEnabled}
                      onClick={() => updatePreferences({ twoFactorEnabled: !preferences.twoFactorEnabled })}
                      className={`inline-flex min-h-9 w-fit items-center rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) ${preferences.twoFactorEnabled ? "border-(--accent)/40 bg-(--accent)/10 text-(--accent)" : "border-(--border) text-(--secondary-text) hover:bg-(--muted)"}`}
                    >
                      {preferences.twoFactorEnabled ? "Activée" : "Désactivée"}
                    </button>
                  </div>
                  <div className="max-w-xl space-y-4">
                    <h3 className="text-sm font-semibold text-(--primary-text)">Changer le mot de passe</h3>
                    <div>
                      <label htmlFor="settings-current-password" className="mb-1.5 block text-sm font-medium text-(--primary-text)">
                        Mot de passe actuel
                      </label>
                      <input id="settings-current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={fieldClassName} />
                    </div>
                    <div>
                      <label htmlFor="settings-new-password" className="mb-1.5 block text-sm font-medium text-(--primary-text)">
                        Nouveau mot de passe
                      </label>
                      <input id="settings-new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={fieldClassName} />
                      <p className="mt-1.5 text-xs text-(--secondary-text)">8 caractères minimum.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-(--primary-text)">Préférences de notification</h2>
                    <p className="mt-1 text-sm text-(--secondary-text)">
                      Choisissez les événements pour lesquels vous souhaitez être notifié.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-(--border) p-4 transition-colors hover:bg-(--muted)/40">
                      <span>
                        <span className="block text-sm font-medium text-(--primary-text)">Mentions & citations</span>
                        <span className="mt-1 block text-xs leading-relaxed text-(--secondary-text)">Lorsqu&apos;un développeur vous mentionne (@{currentUser.username})</span>
                      </span>
                      <input type="checkbox" checked={preferences.notifyMentions} onChange={(event) => updatePreferences({ notifyMentions: event.target.checked })} className="h-4 w-4 shrink-0 accent-(--accent)" />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-(--border) p-4 transition-colors hover:bg-(--muted)/40">
                      <span>
                        <span className="block text-sm font-medium text-(--primary-text)">Pull requests & revues de code</span>
                        <span className="mt-1 block text-xs leading-relaxed text-(--secondary-text)">Demandes de fusion et commentaires sur vos dépôts</span>
                      </span>
                      <input type="checkbox" checked={preferences.notifyPRs} onChange={(event) => updatePreferences({ notifyPRs: event.target.checked })} className="h-4 w-4 shrink-0 accent-(--accent)" />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-(--border) p-4 transition-colors hover:bg-(--muted)/40">
                      <span>
                        <span className="block text-sm font-medium text-(--primary-text)">Résumé hebdomadaire par e-mail</span>
                        <span className="mt-1 block text-xs leading-relaxed text-(--secondary-text)">Tendances technologiques et projets populaires</span>
                      </span>
                      <input type="checkbox" checked={preferences.notifyEmailDigest} onChange={(event) => updatePreferences({ notifyEmailDigest: event.target.checked })} className="h-4 w-4 shrink-0 accent-(--accent)" />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-(--primary-text)">Confidentialité</h2>
                    <p className="mt-1 text-sm text-(--secondary-text)">
                      Contrôlez la visibilité de vos données et votre statut en ligne.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-(--border) p-4 transition-colors hover:bg-(--muted)/40">
                      <span>
                        <span className="block text-sm font-medium text-(--primary-text)">Afficher l&apos;adresse e-mail en public</span>
                        <span className="mt-1 block text-xs leading-relaxed text-(--secondary-text)">Permet aux recruteurs et aux pairs de vous contacter par e-mail</span>
                      </span>
                      <input type="checkbox" checked={preferences.publicEmail} onChange={(event) => updatePreferences({ publicEmail: event.target.checked })} className="h-4 w-4 shrink-0 accent-(--accent)" />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-(--border) p-4 transition-colors hover:bg-(--muted)/40">
                      <span>
                        <span className="block text-sm font-medium text-(--primary-text)">Statut en ligne</span>
                        <span className="mt-1 block text-xs leading-relaxed text-(--secondary-text)">Indiquer lorsque vous êtes actif sur la messagerie</span>
                      </span>
                      <input type="checkbox" checked={preferences.onlineStatus} onChange={(event) => updatePreferences({ onlineStatus: event.target.checked })} className="h-4 w-4 shrink-0 accent-(--accent)" />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-(--primary-text)">Affichage & thème</h2>
                    <p className="mt-1 text-sm text-(--secondary-text)">
                      Choisissez le thème qui vous convient. Votre préférence est appliquée immédiatement.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      aria-pressed={theme === "dark"}
                      onClick={() => setTheme("dark")}
                      className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) ${theme === "dark" ? "border-(--accent) bg-(--accent)/5" : "border-(--border) hover:bg-(--muted)/50"}`}
                    >
                      <span className="mb-3 flex h-16 items-end gap-1.5 rounded-md border border-(--border) bg-[#09090B] p-2">
                        <span className="h-8 w-8 rounded bg-[#18181B]" />
                        <span className="mb-1 h-2 w-12 rounded bg-(--accent)" />
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span>
                          <span className="block text-sm font-semibold text-(--primary-text)">Sombre</span>
                          <span className="mt-0.5 block text-xs text-(--secondary-text)">Confortable en faible luminosité</span>
                        </span>
                        {theme === "dark" && <Check className="h-4 w-4 shrink-0 text-(--accent)" aria-hidden="true" />}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={theme === "light"}
                      onClick={() => setTheme("light")}
                      className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) ${theme === "light" ? "border-(--accent) bg-(--accent)/5" : "border-(--border) hover:bg-(--muted)/50"}`}
                    >
                      <span className="mb-3 flex h-16 items-end gap-1.5 rounded-md border border-zinc-300 bg-white p-2">
                        <span className="h-8 w-8 rounded bg-zinc-100" />
                        <span className="mb-1 h-2 w-12 rounded bg-(--accent)" />
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span>
                          <span className="block text-sm font-semibold text-(--primary-text)">Clair</span>
                          <span className="mt-0.5 block text-xs text-(--secondary-text)">Net et lumineux en journée</span>
                        </span>
                        {theme === "light" && <Check className="h-4 w-4 shrink-0 text-(--accent)" aria-hidden="true" />}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-(--border) pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-5 text-xs" aria-live="polite">
                  {isSaved ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-(--success)">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Modifications enregistrées.
                    </span>
                  ) : formError ? (
                    <span role="alert" className="text-(--danger)">{formError}</span>
                  ) : (
                    <span className="text-(--secondary-text)">Vos préférences sont enregistrées automatiquement.</span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-(--action) px-4 text-sm font-semibold text-white transition-colors hover:bg-(--action-hover) disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}