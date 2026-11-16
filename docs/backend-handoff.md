# Frontend handoff — AfriHub API

Ce document décrit le contrat exposé par les URLConf actuellement montés dans
`backend/apps/api/urls.py`. C’est le code qui fait foi : une URL présente dans
un module mais absente de cet agrégateur n’est pas disponible sous `/api/`.

## Conventions générales

- Préfixe de base : `/api/`. Utiliser les routes avec leur slash final.
- Envoyer et recevoir du JSON (`Content-Type: application/json`) sauf les
  transferts de fichiers, qui nécessitent `multipart/form-data`.
- Les routes privées utilisent un en-tête `Authorization` avec l’access token
  JWT, côté serveur/BFF. Dans le parcours
  navigateur de ce projet, les JWT sont conservés dans des cookies `HttpOnly`
  par le BFF Next : le client ne doit pas les stocker dans `localStorage` ni
  appeler directement le point d’échange OAuth.
- Les UUID et les clés de dépôts (slugs) sont des chaînes côté JSON; les clés
  auto-incrémentées restent numériques. Les références suivent le type de clé
  primaire de la ressource liée.
- Les dates sont des chaînes ISO, sauf les champs explicitement formatés
  `YYYY-MM-DD HH:mm` dans les sérialiseurs utilisateurs. Les dates seules sont
  `YYYY-MM-DD`.
- Les listes paginées DRF ont la forme
  `{ "count": number, "next": string | null, "previous": string | null, "results": T[] }`.
  Le `page_size` par défaut est 20; les endpoints qui le permettent peuvent
  définir une limite différente.
- Une erreur de validation DRF ressemble généralement à
  `{ "nomDuChamp": ["message"] }`; une erreur générale utilise `detail`.
  Les ressources privées absentes et celles auxquelles l’appelant n’a pas accès
  peuvent toutes deux répondre 404.

## Authentification

Les demandes d’authentification publiques sont limitées en fréquence :
connexion 10/h, inscription 5/h, vérification/réenvoi 5/h, réinitialisation
5/h et échange OAuth 30/min. Le backend émet un access token de 10 minutes et un
refresh token rotatif de 7 jours. Le frontend web utilise les routes BFF pour
gérer les jetons.

| Méthode et route | Accès | Entrée | Réponse / comportement |
| --- | --- | --- | --- |
| `POST /auth/register/` | Public | `{ name: string, username: string, email: string, password: string }` | `201`: `{ verification_required: true, email_sent: boolean, detail: string }`. Le mot de passe doit faire 10 à 128 caractères; le compte reste inactif jusqu’à confirmation. |
| `POST /auth/login/` | Public | `{ email: string, password: string }` | La valeur `email` accepte un e-mail **ou** un username. Succès : `{ access: string, refresh: string, user: User }`. Un e-mail non confirmé répond 403. |
| `POST /auth/email/verify/` | Public | `{ token: string }` | Confirme et active le compte; réponse `{ detail: string }`. Le lien est à usage unique et expire. |
| `POST /auth/email/resend-verification/` | Public | `{ email: string }` | Réponse générique `{ detail: string }`, même si aucun compte en attente ne correspond. |
| `POST /auth/password/reset/` | Public | `{ email: string }` | Réponse générique `{ detail: string }`; ne révèle pas l’existence du compte. |
| `POST /auth/password/reset/confirm/` | Public, lien valide requis | `{ uid: string, token: string, new_password: string }` | Change le mot de passe, révoque les sessions existantes; `{ detail: string }`. Mot de passe de 10 à 128 caractères et validé par Django. |
| `POST /auth/password/change/` | Authentifié | `{ current_password: string, new_password: string }` | Vérifie le mot de passe actuel et révoque les sessions; `{ detail: string }`. |
| `POST /auth/logout/` | Authentifié | `{ refresh: string }` | Blackliste le refresh token appartenant à l’utilisateur; `204` sans corps. |
| `POST /auth/token/refresh/` | Refresh token | `{ refresh: string }` | Endpoint SimpleJWT standard : retourne un nouvel access token et, selon la configuration de rotation, un refresh token. À appeler depuis le BFF. |
| `POST /auth/oauth/exchange/` | BFF uniquement | Header `X-Auth-Exchange-Key`; JSON `{ provider: "google" \| "microsoft", subject: string, email: string, email_verified: boolean, name?: string }` | Même enveloppe `{ access, refresh, user }` quand l’échange aboutit. `202` avec `verification_required` si l’e-mail doit être vérifié; `409` si un autre compte utilise déjà l’adresse. Ne jamais exposer le secret d’échange au navigateur. |

`User` dans la réponse de session est résumé par les champs décrits dans
[Compte et profil](#compte-et-profil). Les champs e-mail sensibles ne doivent
pas être réutilisés comme données de profil public.

## Compte et profil

Toutes les routes de ce groupe sont privées. Le queryset des routes utilisateur
est filtré sur le compte connecté; l’URL ne permet donc pas de lire ou modifier
le compte d’un autre utilisateur.

| Méthode et route | Entrée | Réponse / règle |
| --- | --- | --- |
| `GET /users/{username}/` | — | Profil de compte sérialisé. `{username}` doit être le username du compte connecté. |
| `PUT`, `PATCH /users/{username}/` | Champs modifiables de `User` | Mise à jour du compte courant uniquement. Les champs calculés sont en lecture seule. |
| `GET /profile/` | — | Profil courant, ses e-mails et comptes sociaux. |
| `PUT`, `PATCH /profile/` | Champs éditables de profil | Modifie le profil courant; les collections imbriquées sont en lecture seule ici. L’image se transmet en multipart. |
| `GET`, `POST /social-accounts/` | Création : `{ link: string }` | Liste/ajoute un lien appartenant au profil courant. |
| `GET`, `PUT`, `PATCH`, `DELETE /social-accounts/{id}/` | Update : `{ link: string }` | Détail ou mutation d’un compte social appartenant au compte courant. |
| `GET`, `POST /contact-emails/` | Création : `{ email: string, type: ContactEmailType }` | Liste/ajoute un e-mail au profil courant. |
| `PUT`, `PATCH`, `DELETE /contact-emails/{id}/` | Update : `{ email?: string, type?: ContactEmailType }` | Ressource limitée au propriétaire. |
| `GET /settings/` | — | Paramètres du compte et dépôts ignorés en lecture seule imbriquée. |
| `PUT`, `PATCH /settings/` | Champs de `Settings` (ci-dessous) | Met à jour les paramètres du compte courant. `defaultNotifEmail` ne peut référencer qu’un e-mail de ce compte. |
| `GET`, `POST /ignored-repositories/` | Création : `{ repo: string }` | Liste/ajoute un dépôt ignoré; le backend impose le compte Settings courant. `repo` est la clé primaire slug du dépôt. |
| `PUT`, `PATCH`, `DELETE /ignored-repositories/{id}/` | Update : `{ repo?: string }` | Ressource limitée au compte propriétaire. `userSettings` et `createdAt` sont en lecture seule. |

### Types JSON compte/profil

```ts
type User = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  expertiseDomain: string;
  avatar: string;
  createdAt: string; // "YYYY-MM-DD HH:mm"
  repositoriesCount: number;
  contributionsCount: number;
  followersCount: number;
  followingCount: number;
};

type ContactEmailType = "primary" | "publiic" | "private" | "displayed";

type ContactEmail = {
  email: string;
  type: ContactEmailType;
  createdAt: string; // "YYYY-MM-DD HH:mm"
};

type SocialAccount = { link: string };

type Profile = {
  bio: string | null;
  profileImg: string | null; // réponse URL de fichier; entrée multipart
  siteUrl: string | null;
  location: string | null;
  updatedAt: string; // "YYYY-MM-DD HH:mm"
  socialAccounts: SocialAccount[];
  contactEmails: ContactEmail[];
};

type NotificationChannel = "metafrix" | "email" | "both";

type Settings = {
  narratorEnabled: boolean;
  videoPostsSubtitles: boolean;
  voiceCommander: boolean;
  voiceCommanderShortcut: string; // max 5 caractères
  defaultNotifEmail: number | null; // identifiant ContactEmail
  watchingRepos: NotificationChannel;
  followingUsers: NotificationChannel;
  mentions: NotificationChannel;
  invitations: NotificationChannel;
  recruting: NotificationChannel;
  securityAlertsNotif: string; // e-mail
  updatedAt: string | null;
  ignoredRepos: IgnoredRepository[];
};

type IgnoredRepository = {
  repo: string; // slug Repository
  userSettings: number; // lecture seule
  createdAt: string; // "YYYY-MM-DD HH:mm"
};
```

Le compte est une ressource distincte du profil. Les sérialiseurs du compte
exposent `username`, `email`, `firstName`, `lastName` et `expertiseDomain`;
`avatar`, `createdAt` et les compteurs sont calculés/en lecture seule. Les
domaines d’expertise correspondent aux valeurs `User.Domain` définies par le
backend.

## Organisations et collaboration

Les organisations peuvent être consultées publiquement. Les opérations
collaboratives exigent une appartenance à l’organisation. Dans les viewsets de
teams/boards/cartes, les permissions actuelles distinguent l’appartenance mais
pas les rôles : tout membre de l’organisation peut lire et modifier les objets
de collaboration visibles dans son organisation.

| Méthode et route | Accès | Entrée / filtres | Réponse / notes |
| --- | --- | --- | --- |
| `GET /organizations/?search=&mine=&sort=&page=&page_size=` | Public; `mine=true` exige une session | Recherche nom, slug, description, localisation; `sort=name` trie par nom | Page d’organisations. Les membres et détails sensibles sont réduits pour un visiteur anonyme. |
| `POST /organizations/` | Authentifié | `{ name: string, slug?: string, description?: string, website?: string, location?: string }` | `201 Organisation`; l’utilisateur devient `owner`. Slug peut être généré si absent/vide. |
| `GET /organizations/{slug}/` | Public | — | Détail Organisation; membres et rôle de l’utilisateur sont filtrés selon la session. |
| `PATCH /organizations/{slug}/` | Owner ou admin uniquement | Sous-ensemble éditable : `name`, `description`, `website`, `location` | Organisation mise à jour. `slug`, `id`, collections et compteurs ne sont pas modifiables par cette route. |
| `POST`, `DELETE /organizations/{slug}/members/` | Authentifié | Aucun corps pour rejoindre/quitter | Rejoindre renvoie `{ isMember: true, created: boolean }`; `DELETE` retire l’utilisateur courant. Le propriétaire doit transférer son rôle avant de quitter. |
| `PATCH`, `DELETE /organizations/{slug}/members/{user_id}/` | Owner/admin | `PATCH { role: "admin" \| "member" }` | Modifier un rôle ou retirer le membre. Seul le propriétaire peut nommer un admin; le propriétaire ne peut pas être retiré/modifié ici; un admin ne peut pas retirer un autre admin. |
| `GET /organizations/{slug}/repositories/` | Public | — | Liste non paginée des dépôts publics associés. |
| `POST /organizations/{slug}/repositories/` | Owner/admin | `{ repositoryId: string }` | Associe un dépôt public possédé par l’utilisateur; `{ repositoryId, created }`. |
| `DELETE /organizations/{slug}/repositories/{repository_id}/` | Owner/admin | — | Retire l’association, `204`. Voir la limite d’identifiant numérique ci-dessous. |
| `GET`, `POST /teams/` | Membre requis pour l’organisation | Création : `{ name: string, organisationSlug: string, createdById?: string \| null, imageProfile?: File }` | Liste des teams auxquelles l’appelant appartient ou crée une team. `slug` est généré. |
| `GET`, `PUT`, `PATCH`, `DELETE /teams/{slug}/` | Membre de l’organisation de la team | Update via champs Team | CRUD filtré par appartenance. Les détails membres/boards dépendent de la session et du serializer. |
| `GET`, `POST /boards/` | Membre de l’organisation de la team | Création : `{ name: string, teamSlug: string, repoSlug: string, deadline?: string \| null }` | `repoSlug` et `teamSlug` sont des slugs; réponse inclut le dépôt et les champs imbriqués quand disponibles. |
| `GET`, `PUT`, `PATCH`, `DELETE /boards/{id}/` | Membre de l’organisation de la team | `id` UUID | CRUD filtré par appartenance. |
| `GET`, `POST /notes/` | Membre de l’organisation du board | Création : `{ title: string, description?: string \| null, boardId: string, authorId?: string \| null, color?: NoteColor }` | Création/réponse Note; `authorId` est l’identifiant UUID d’un `Member`, pas un username. |
| `GET`, `PUT`, `PATCH`, `DELETE /notes/{id}/` | Membre de l’organisation du board | `id` UUID | CRUD sur la note. |
| `GET`, `POST /attachments/` | Membre de l’organisation du board | Multipart : `file`, `boardId: UUID`, `uploadedById: UUID` (Member) | Métadonnées de pièce jointe et URL/nom du fichier selon stockage. |
| `GET`, `PUT`, `PATCH`, `DELETE /attachments/{id}/` | Membre de l’organisation du board | `id` UUID; upload multipart | CRUD de pièce jointe. |
| `GET`, `POST /todo-lists/` | Membre de l’organisation du board | Création : `{ title, description?, boardId: UUID, assignedToId?: UUID \| null, deadline?: "YYYY-MM-DD" \| null, completed?: boolean }` | ToDoList; comprend `tasks` et `assignedTo` en réponse. |
| `GET`, `PUT`, `PATCH`, `DELETE /todo-lists/{id}/` | Membre de l’organisation du board | `id` UUID | CRUD filtré par appartenance. |
| `GET`, `POST /tasks/` | Membre de l’organisation du board de la todo-list | Création : `{ title, description?, todoListId: UUID, completed?: boolean }` | Task créée/rendue. |
| `GET`, `PUT`, `PATCH`, `DELETE /tasks/{id}/` | Membre de l’organisation liée | `id` UUID | CRUD filtré par appartenance. |

`NoteColor` vaut `"red" | "green" | "blue" | "yellow" | "orange" | "purple" | "grey"`.
Les identifiants des organisations, boards, notes, attachments, todo-lists et
tasks sont des UUID au format chaîne. Le slug de team est une chaîne.
`boardId`/`todoListId` sont des UUID; `teamSlug`, `organisationSlug` et
`repoSlug` sont des slugs. `createdById` est le username (clé User),
`authorId`, `uploadedById` et `assignedToId` sont des UUID de `Member`.
Ces références sont acceptées en écriture et ne sont pas incluses dans la
réponse sous ces mêmes clés. Les clés de réponse correspondantes sont
`createdBy`, `author`, `uploadedBy` et `assignedTo`.

Le modèle d’organisation expose principalement :

```ts
type Organisation = {
  id: string; // UUID
  name: string;
  slug: string;
  description: string;
  website: string;
  location: string;
  avatar: string;
  membersCount: number;
  repositoriesCount: number;
  repositoryIds: string[];
  members: Array<{ user: User; role: "owner" | "admin" | "member" }>;
  repositories: Repository[];
  isMember: boolean;
  viewerRole: "owner" | "admin" | "member" | null;
  createdAt: string;
};
```

Les champs `teams` ne font pas partie des `fields` de la réponse
`OrganisationSerializer`, même si une méthode de sérialisation existe.

```ts
type Team = {
  slug: string;
  name: string;
  createdAt: string;
  createdBy: User | null;
  imageProfile: string | null;
  organisation: { name: string; slug: string; imageProfile: string | null } | null;
  members: Array<{
    user: User;
    role: string;
    tag: string | null;
    joinedAt: string;
  }>;
  boards: Board[];
};

type Board = {
  id: string; // UUID
  repo: Repository | null;
  name: string;
  teamId: string; // slug de Team
  createdAt: string;
  updatedAt: string | null;
  deadline: string | null; // YYYY-MM-DD
  notes: Note[];
  attachments: Attachment[];
  todoLists: TodoList[];
};

type Note = {
  id: string;
  title: string;
  description: string | null;
  author: User | null;
  createdAt: string;
  updatedAt: string | null;
  color: NoteColor;
};

type Attachment = {
  id: string;
  file: string;
  uploadedBy: User;
  uploadedAt: string;
};

type TodoList = {
  id: string;
  title: string;
  description: string | null;
  assignedTo: User | null;
  createdAt: string;
  updatedAt: string | null;
  deadline: string | null;
  completed: boolean;
  tasks: Task[];
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
  completed: boolean;
};
```

### Limites d’accès et d’identifiants à connaître

- Le routeur des collaborations contraint `user_id` des membres à des chiffres,
  alors que la clé primaire User est le username (chaîne). Une route membre ne
  pourra donc pas résoudre la plupart des usernames.
- Le retrait d’un dépôt d’organisation contraint `repository_id` à des chiffres,
  alors que la clé primaire Repository est un slug. Le détail des dépôts utilise
  donc un type de clé incompatible avec cette route de retrait.
- Les permissions CRUD des ressources team/board/note/attachment/todo/task
  vérifient l’appartenance à l’organisation, pas le rôle `owner/admin/member`.
  Pour les créations, le backend vérifie le lien via `organisationSlug`,
  `teamSlug`, `boardId` ou `todoListId`.
- Les champs de référence `authorId`, `uploadedById`, `assignedToId` et
  `createdById` sont résolus par le serializer, mais la permission ne garantit
  pas que le membre/utilisateur transmis appartienne à la même équipe ou
  organisation. N’envoyer que des références cohérentes.

## Dépôts, Git, issues et pull requests

Les dépôts ont une clé primaire slug (chaîne), par exemple
`alice__mon-projet`. `isPrivate` est un booléen dans l’API, même si le modèle
stocke une valeur textuelle. Un dépôt privé est volontairement indistinguable
d’un dépôt absent pour un non-propriétaire.

| Méthode et route | Accès | Entrée / query | Réponse / comportement |
| --- | --- | --- | --- |
| `GET /repositories/?owner=&search=&page=&page_size=` | Public | Recherche par nom, username propriétaire, description ou langage; `page_size` max 100 | Liste paginée des dépôts publics et des dépôts privés du compte connecté. |
| `POST /repositories/` | Authentifié | `{ name: string, description?: string, isPrivate?: boolean, language?: string, topics?: string[], license?: string \| null, initializeReadme?: boolean, ... }` | Crée dépôt Git et settings; `201 Repository`. Nom 1–120 caractères alphanumériques, `.`, `_`, `-`; max 20 topics de 40 caractères. |
| `GET /repositories/{owner}/{name}/` | Public ou propriétaire | — | Détail Repository; `404` pour dépôt privé non autorisé. |
| `PATCH /repositories/{repository_id}/` | Propriétaire authentifié | `{ description?: string \| null, isPrivate?: boolean }` | Modifie uniquement description/visibilité. **Route numériquement contrainte, incompatible avec les slugs courants** (voir limites). |
| `GET /repositories/{repository_id}/branches/` | Public ou propriétaire | — | `{ results: string[] }` branches Git. |
| `GET /repositories/{repository_id}/tree/?path=&branch=` | Public ou propriétaire | `path`, `branch` facultatifs | `{ results: ... }` entrée d’arborescence. |
| `GET /repositories/{repository_id}/blob/?path=&branch=` | Public ou propriétaire | `path`, `branch` facultatifs | Contenu texte; chemin invalide 400, fichier absent 404, blob trop volumineux 413, binaire 415. |
| `GET /repositories/{repository_id}/commits/?branch=&limit=` | Public ou propriétaire | `limit` entier (défaut 100) | `{ results: Commit[] }`; limite invalide 400. |
| `PUT`, `DELETE /repositories/{repository_id}/star/` | Authentifié; dépôt visible | — | Ajoute/retire l’étoile. `{ isStarred: boolean, starsCount: number }`. |
| `PUT`, `DELETE /repositories/{repository_id}/watch/` | Authentifié; dépôt visible | — | Ajoute/retire le suivi. `{ isWatching: boolean, watchersCount: number }`. |
| `GET`, `POST /repositories/{repository_id}/issues/` | Lecture publique si dépôt visible; création authentifiée | Création : `{ title: string, body: string, labels?: string[] }` | Page d’issues ou `201 Issue`. La création est refusée si les issues du dépôt sont désactivées. |
| `GET`, `POST /repositories/{repository_id}/pulls/` | Lecture publique si dépôt visible; création authentifiée | Création : `{ title: string, body: string, sourceBranch: string, targetBranch: string }` | Page de PR ou `201 PullRequest`. La création est refusée si les PR sont désactivées. |

```ts
type Repository = {
  id: string; // slug, pas un nombre
  name: string;
  owner: User;
  description: string | null;
  isPrivate: boolean;
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  watchersCount: number;
  isStarred: boolean;
  isWatching: boolean;
  issuesCount: number;
  pullsCount: number;
  language: string;
  languageColor: string;
  size: string; // chaîne formatée, ex. "1.2 KB"
  license: string | null;
  topics: string[];
  createdAt: string;
  updatedAt: string;
};

type Issue = {
  id: string;
  repositoryId: string;
  number: number;
  title: string;
  body: string;
  status: "open" | "closed";
  labels: string[];
  author: User;
  assignees: User[]; // actuellement []
  commentsCount: number; // actuellement 0
  createdAt: string;
  updatedAt: string;
};

type PullRequest = {
  id: string;
  repositoryId: string;
  number: number;
  title: string;
  body: string;
  author: User;
  status: "open" | "merged" | "closed";
  sourceBranch: string;
  targetBranch: string;
  additions: number; // actuellement 0
  deletions: number; // actuellement 0
  changedFilesCount: number; // actuellement 0
  createdAt: string;
  updatedAt: string;
};
```

**Blocage important :** les routes Git, metadata, star, watch, issues et pulls
utilisent `<int:repository_id>`, alors que `Repository.pk`/`Repository.id` est
un slug tel que `username__name`. Elles sont bien déclarées mais ne peuvent pas
résoudre les IDs renvoyés par `Repository`. Utiliser `GET
/repositories/{owner}/{name}/` pour le détail en attendant que les converters
soient alignés; les autres routes nécessitent une correction backend.

## Notifications

Les notifications ne sont visibles que par leur destinataire; aucun utilisateur
ne peut marquer ou supprimer la notification d’un autre.

| Méthode et route | Entrée | Réponse |
| --- | --- | --- |
| `GET /notifications/?unread=true&page=&page_size=` | Query optionnelle `unread=true`; défaut 50, max 100 par page | Page `Notification[]` du compte connecté. |
| `POST /notifications/read-all/` | Aucun corps | `{ updated: number }` nombre de notifications non lues modifiées. |
| `PATCH /notifications/{id}/` | Aucun champ requis | Marque l’élément du destinataire comme lu; renvoie `Notification`. |
| `DELETE /notifications/{id}/` | — | Supprime la notification du destinataire; `204`. |

```ts
type NotificationType =
  | "comment"
  | "reaction"
  | "follow"
  | "message"
  | "collab_invite"
  | "mention"
  | "issue_assigned"
  | "pr_review";

type Notification = {
  id: string;
  type: NotificationType;
  actor: User;
  message: string;
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
};
```

## Déclaré dans le dépôt mais non monté sous `/api/`

Les modules suivants ont des URLConf, mais ne figurent pas dans
`backend/apps/api/urls.py`; ils ne sont donc pas exposés par la configuration
actuelle :

- Posts : `apps/posts/api/urls.py` (commentaires/réactions/publications).
- Messagerie : `apps/messaging/api/urls.py` (conversations/messages).
- Découverte utilisateurs : `apps/users/urls.py` (`/users/me/`, `/developers/`,
  détail et suivi développeur).
- La racine `/health/` n’est pas incluse non plus dans l’agrégateur actuel.

Ne pas brancher ces fonctionnalités frontend sur les chemins ci-dessus avant
leur inclusion et la validation de leurs vues/imports. Le fichier
`apps/repositories/api/routers.py` est vide et non monté.

## Provisionnement et vérifications à faire avant intégration

- Les flows d’inscription et OAuth créent l’utilisateur, mais le code actuel ne
  crée pas automatiquement son `Profile` ni ses `Settings`. `/profile/` et
  `/settings/` supposent ces objets présents; ils peuvent répondre 404 tant que
  leur provisionnement n’est pas ajouté. Prévoir ce cas côté UI.
- `/ignored-repositories/` crée avec `request.user.setting`; si les settings
  manquent, cette création échoue au lieu de créer implicitement les settings.
- `User.avatar` est actuellement le nom de fichier du profil, alors que
  `Profile.profileImg` est rendu par le champ image. Le frontend ne doit pas
  supposer que `avatar` est une URL absolue.
- `RepositorySettingsSerializer` existe, mais aucun endpoint de lecture ou
  d’écriture des paramètres du dépôt n’est enregistré.
- Les endpoints Issue/Pull Request créent seulement des enregistrements métier :
  pas de commentaires/assignations d’issue, diff, revue ou merge.
- Le contrôle Django `manage.py check` échoue actuellement sur
  `posts.ReelReaction` : sa contrainte de modèle réfère à un champ `type`
  inexistant. Cela doit être corrigé avant une certification backend complète.

### Contrôles de contrat vérifiés

L’URLConf actif a été résolu via Django pour les routes d’authentification,
profil/paramètres, listes et détails des ressources users, teams et dépôts. Les
méthodes `GET/POST/PUT/PATCH/DELETE` des routeurs users sont enregistrées selon
les tables ci-dessus. Ces vérifications prouvent l’enregistrement des routes,
pas le bon fonctionnement d’une requête métier contre une base migrée.
