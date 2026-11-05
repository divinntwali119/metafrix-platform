# Démarrage backend — MetafriX

Ce document donne aux développeurs backend l’état actuel du frontend et les
contrats à coordonner avant l’implémentation. **Aucun backend n’est encore présent
dans ce dépôt.** Le commentaire du client API mentionne Django REST Framework,
mais le choix du framework backend reste à valider avec l’équipe.

## Lancer le frontend contre son environnement local

1. Installer les dépendances du frontend avec `npm ci`.
2. Copier `.env.example` vers `.env.local` et régler `NEXT_PUBLIC_API_URL` sur
   l’URL locale de l’API (par défaut `http://localhost:8000/api`).
3. Lancer le serveur frontend avec `npm run dev`.

Ne partagez pas de secrets dans les fichiers `.env.example` ou `NEXT_PUBLIC_*`.
Les valeurs réelles de développement restent dans `.env.local`, qui est ignoré
par Git.

## API déjà esquissée

Les chemins ci-dessous sont ceux appelés par les services frontend. Ils ne sont
pas encore une spécification complète ; confirmez-les avec l’équipe et publiez
un schéma OpenAPI avant que plusieurs clients en dépendent.

| Méthode | Chemin relatif à `/api` | Réponse attendue par le frontend |
| --- | --- | --- |
| `POST` | `/auth/login/` | `{ "token": "…", "user": User }` |
| `POST` | `/auth/register/` | `{ "token": "…", "user": User }` |
| `POST` | `/auth/password/change/` | Corps : `current_password`, `new_password` |
| `GET` | `/users/me/` | Un objet `User` |
| `GET` | `/repositories/` | Tableau de `Repository` |
| `GET` | `/repositories/{owner}/{name}/` | Un objet `Repository` |
| `GET` | `/repositories/{id}/tree/?path={path}` | Tableau de `FileTreeItem` |
| `GET` | `/repositories/{id}/blob/?path={path}` | `{ "content": "…" }` |
| `GET` | `/repositories/{id}/commits/` | Tableau de `Commit` |
| `GET` | `/repositories/{id}/issues/` | Tableau de `Issue` |
| `GET` | `/repositories/{id}/pulls/` | Tableau de `PullRequest` |

Le client envoie `Authorization: Bearer <token>` si le navigateur contient un
jeton sous la clé `afrihub_token`. Les types détaillés des objets sont dans
`src/types/index.ts`. Les appels de liste actuels attendent des tableaux simples,
pas encore une enveloppe paginée. Les dates sont représentées par des chaînes.

Pour les erreurs, convenez d’un format JSON stable (par exemple `detail` et des
erreurs de validation par champ), des codes HTTP, des règles de pagination et de
la représentation des identifiants avant de brancher les écrans.

## Limites d’intégration à connaître

- La connexion et l’inscription des pages frontend utilisent encore le store et
  une simulation ; elles n’appellent pas encore `authService.login()` ou
  `authService.register()`.
- `authService` attend un token et un utilisateur, mais l’interface de connexion
  ne sauvegarde pas encore ce token. Le renouvellement et l’expiration de session
  ne sont pas définis.
- Les services de dépôt et d’authentification retournent parfois des données de
  démonstration si une requête échoue. Cela peut masquer une erreur API ; prévoyez
  un mode mock explicite ou désactivez ces replis lors de l’intégration réelle.
- Les autres domaines (publications, commentaires, organisations, messagerie,
  notifications, relations entre membres) sont principalement pilotés par
  `src/lib/mock-data.ts` et `src/lib/store.ts`. Leurs endpoints et permissions
  restent à spécifier.
- Les réponses ne sont pas encore paginées côté frontend. Coordonnez la forme
  paginée avant d’ajouter une API de production à grand volume.

## Découpage de travail proposé

1. Valider le framework backend, le schéma OpenAPI, les conventions d’erreur et
   les règles d’authentification avec l’équipe.
2. Définir les modèles et permissions pour utilisateurs et dépôts ; ajouter
   migrations, validations et tests backend.
3. Implémenter les routes de session et `/users/me/`, puis coordonner leur
   intégration frontend (stockage/renouvellement du token, déconnexion et états
   d’erreur).
4. Ajouter les lectures de dépôts, fichiers, commits, issues et pull requests.
5. Spécifier ensuite les organisations et fonctionnalités sociales avant de
   remplacer progressivement leurs données de démonstration.

Travaillez par branche et pull request : une branche par fonctionnalité, des
changements limités et des tests associés. Les changements de contrat doivent
mettre à jour le schéma API et ce document dans la même pull request lorsque
c’est possible.
