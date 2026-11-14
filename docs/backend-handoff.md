# État et exploitation du backend — AfriHub

Le dépôt contient maintenant un backend Django REST Framework sous `backend/` et
un backend-for-frontend (BFF) Next.js. Les documents décrivent l’état du code au
moment de leur rédaction; ils ne constituent pas une certification de production.

## Architecture d’authentification

Le navigateur ne reçoit jamais les jetons d’accès ou de renouvellement dans le
JavaScript. Les routes Next `/api/auth/*` et `/api/backend/*` les conservent dans
des cookies `HttpOnly`, `SameSite=Lax` et `Secure` en production, puis les
transmettent à Django en `Authorization: Bearer`. Le proxy renouvelle les jetons
et rejoue une requête après une réponse 401. Les mutations du BFF vérifient
l’origine `Origin` ou `Referer`.

Django SimpleJWT utilise des access tokens de 10 minutes et des refresh tokens
rotatifs de 7 jours avec blacklist. Les routes d’API requièrent une
authentification sauf celles conçues explicitement comme publiques. Les dépôts
privés ne sont pas distinguables des dépôts absents pour les personnes non
autorisées.

## Démarrage local

1. Installer Python 3.14 et Node.js 20.9+.
2. Installer le frontend avec `npm ci`; configurer `.env.local` avec
  `BACKEND_API_URL=http://127.0.0.1:8001`.
3. Créer un environnement Python et installer les paquets :
   `python -m pip install -r backend/requirements.txt`.
4. Copier `backend/.env.example` vers `backend/.env`, puis adapter ses valeurs
   locales de développement.
5. Depuis `backend/`, appliquer les migrations avec `python manage.py migrate`,
  créer éventuellement un administrateur avec `python manage.py createsuperuser`,
  puis démarrer avec `python manage.py runserver 127.0.0.1:8001`.
6. Depuis la racine, lancer `npm run dev`.

L’API est montée sur `/api/`; l’administration Django est sur `/admin/`.
SQLite et le cache mémoire ne sont prévus que pour le développement local.

## Endpoints disponibles

Toutes les routes sont préfixées par `/api`. Les réponses de listes DRF sont
paginées (`count`, `next`, `previous`, `results`).

| Méthode | Chemin | Accès / fonction |
| --- | --- | --- |
| `GET` | `/health/` | Healthcheck non authentifié; vérifie la connexion à la base sans exposer de détails. |
| `POST` | `/auth/register/` | Créer un compte inactif/non vérifié; renvoie `verification_required`, `email_sent` et un message générique, sans session. |
| `POST` | `/auth/login/` | Connexion par username ou e-mail. |
| `POST` | `/auth/email/verify/` | Consommer le jeton à usage unique de confirmation reçu par e-mail. |
| `POST` | `/auth/email/resend-verification/` | Renvoyer le message de confirmation; réponse identique si le compte n’existe pas. |
| `POST` | `/auth/password/reset/` | Demander un lien de récupération; réponse identique si le compte n’existe pas. |
| `POST` | `/auth/password/reset/confirm/` | Valider le lien et changer le mot de passe; révoque les refresh et access tokens précédemment émis. |
| `POST` | `/auth/oauth/exchange/` | Échange interne Next → Django protégé par `X-Auth-Exchange-Key`; ne pas exposer directement au navigateur. |
| `POST` | `/auth/logout/` | Invalider le refresh token courant. |
| `POST` | `/auth/token/refresh/` | Renouvellement SimpleJWT; appelé côté serveur. |
| `POST` | `/auth/password/change/` | Modifier un mot de passe authentifié; révoque les refresh et access tokens précédemment émis. |
| `GET`, `PATCH` | `/users/me/` | Lire le compte courant; modifier nom, bio, localisation et site web. E-mail et champs inconnus sont refusés. |
| `GET`, `POST` | `/repositories/?owner=&search=&page=&page_size=` | Lister/rechercher les dépôts visibles ou créer un dépôt personnel; les dépôts privés ne sortent que pour leur propriétaire. |
| `GET` | `/repositories/{owner}/{name}/` | Lire un dépôt public ou son propre dépôt privé. |
| `PATCH` | `/repositories/{id}/` | Modifier description/visibilité du dépôt; propriétaire uniquement. |
| `GET` | `/repositories/{id}/branches/` | Lire les branches Git locales. |
| `GET` | `/repositories/{id}/tree/?path=&branch=` | Lire l’arborescence d’une branche. |
| `GET` | `/repositories/{id}/blob/?path=&branch=` | Lire un blob UTF-8 texte limité à 1 Mo. |
| `GET` | `/repositories/{id}/commits/?branch=&limit=` | Lire jusqu’à 100 commits. |
| `PUT`, `DELETE` | `/repositories/{id}/star/` | Ajouter ou retirer l’étoile de l’utilisateur authentifié; réponse avec le compteur. |
| `PUT`, `DELETE` | `/repositories/{id}/watch/` | Suivre ou ne plus suivre un dépôt pour l’utilisateur authentifié. |
| `GET`, `POST` | `/repositories/{id}/issues/` | Lire les issues visibles ou créer une issue authentifiée. |
| `GET`, `POST` | `/repositories/{id}/pulls/` | Lire les PR visibles ou créer une PR authentifiée. |
| `GET` | `/developers/?search=&expertise=&page=&page_size=` | Annuaire paginé; les e-mails ne sont pas exposés. |
| `GET` | `/developers/{username}/` | Profil public et compteurs de suivi/dépôts publics. |
| `PUT`, `DELETE` | `/developers/{username}/follow/` | Suivre/ne plus suivre; mutation idempotente et notification à la création. |
| `GET`, `POST` | `/posts/?search=&type=&author=&following=&bookmarked=&page=` | Feed paginé et recherche dans texte, code, langage et nom d’auteur; filtres `type`, `author`, `following`, `bookmarked`; création authentifiée de discussion, code, média URL ou lien de dépôt public. |
| `DELETE` | `/posts/{id}/` | Suppression par l’auteur uniquement. |
| `GET`, `POST` | `/posts/{id}/comments/` | Lire les commentaires et en créer un avec authentification. |
| `PUT`, `DELETE` | `/posts/{id}/like/`, `/posts/{id}/bookmark/` | Réaction et favori persistants, limités au compte courant. |
| `GET`, `POST` | `/organizations/` | Annuaire paginé/recherche et création authentifiée; `mine=true` filtre les organisations de l’utilisateur. |
| `GET`, `PATCH` | `/organizations/{slug}/` | Détail public; modification par propriétaire/administrateur. |
| `POST`, `DELETE` | `/organizations/{slug}/members/` | Rejoindre/quitter; le propriétaire doit transférer son rôle avant de quitter. |
| `PATCH`, `DELETE` | `/organizations/{slug}/members/{user_id}/` | Modifier un rôle ou retirer un membre, selon le rôle de l’acteur. |
| `GET`, `POST` | `/organizations/{slug}/repositories/` | Lister/associer les dépôts publics du gestionnaire; association à un dépôt personnel, pas à un dépôt possédé par l’organisation. |
| `DELETE` | `/organizations/{slug}/repositories/{repository_id}/` | Retirer un dépôt associé, par propriétaire/administrateur. |
| `GET`, `POST` | `/conversations/` | Lister les conversations et créer un groupe (nom et 1 à 19 autres usernames). |
| `POST` | `/conversations/direct/` | Ouvrir ou créer de manière idempotente une conversation directe par username. |
| `GET`, `POST` | `/conversations/{uuid}/messages/` | Lire les 100 derniers messages (marque la conversation comme lue) ou envoyer texte/code; participant uniquement. |
| `GET` | `/notifications/?unread=true&page_size=` | Notifications privées et paginées du compte courant. |
| `POST` | `/notifications/read-all/` | Marquer toutes les notifications du compte courant comme lues. |
| `PATCH`, `DELETE` | `/notifications/{id}/` | Marquer une notification comme lue ou la supprimer, destinataire uniquement. |

La lecture Git valide les segments de chemin et ne lit que les objets du dépôt
bare configuré. Les blobs binaires et les fichiers trop grands ne sont pas
renvoyés. L’accès aux endpoints Git passe par le même contrôle de visibilité que
les autres lectures de dépôt.

Les API sociales sont raccordées au frontend et disposent de tests de permissions,
de confidentialité et de persistance. Les modèles et endpoints restent une première
version : les pièces jointes média sont des URL distantes, les commentaires n’ont
pas de réponses/réactions, la messagerie n’est pas temps réel et expose les 100
derniers messages, et les contributions Git ne sont pas agrégées. Les organisations
peuvent associer un dépôt public d’un membre gestionnaire, mais ne possèdent pas
directement leurs propres dépôts; invitations et transfert du propriétaire restent
à implémenter.

Les endpoints de création d’issues et de PR créent uniquement les enregistrements
métier. Les collaborateurs de dépôts, le calcul du diff, la revue, le merge et les
opérations Git Smart HTTP/SSH ne sont pas implémentés. Le renommage et la
suppression coordonnée des dépôts (base et stockage Git) ne sont pas disponibles.
N’activer `NEXT_PUBLIC_DEMO_MODE` que pour une prévisualisation explicite, jamais
pour un déploiement réel.

## Configuration de production

Django en mode production (`DJANGO_DEBUG=False`, valeur par défaut) échoue au
démarrage lorsque les prérequis importants ne sont pas présents. Configurer via
un gestionnaire de secrets et l’environnement de la plateforme :

- `DJANGO_SECRET_KEY` : valeur aléatoire longue d’au moins 50 caractères; ne
  jamais réutiliser celle de CI ou d’un exemple.
- En déploiement Compose, les secrets peuvent être montés en fichiers avec
  `DJANGO_SECRET_KEY_FILE`, `AUTH_EXCHANGE_SECRET_FILE`,
  `DJANGO_EMAIL_HOST_PASSWORD_FILE` et `DATABASE_PASSWORD_FILE`; le fichier de
  PostgreSQL est partagé en lecture seule avec le backend. À défaut, injecter
  les variantes sans suffixe `_FILE` par un gestionnaire de secrets.
- `APP_BASE_URL` : URL publique HTTPS du frontend, utilisée pour composer les
  liens e-mail et OAuth. `AUTH_EXCHANGE_SECRET` doit être un secret partagé
  distinct d’au moins 50 caractères, identique côté Next et Django.
- Connexion Google/Microsoft : définir côté Next `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` et
  au besoin `MICROSOFT_TENANT_ID`. Enregistrer les URI de callback exactes
  `/api/auth/oauth/google/callback` et
  `/api/auth/oauth/microsoft/callback` sur les consoles fournisseurs. Ne jamais
  traiter des boutons OAuth sans ces paramètres comme une connexion active.
- `DJANGO_ALLOWED_HOSTS` : liste exacte des noms d’hôtes, sans wildcard.
- `DJANGO_NUM_PROXIES` : nombre de proxies de confiance représentés dans
  `X-Forwarded-For`; le Compose fourni utilise un seul proxy (le BFF Next). Le
  reverse proxy public doit écraser l’en-tête client avec son adresse réelle.
- `DATABASE_URL` : PostgreSQL (`postgresql://…`), sauvegardé et surveillé.
- `DJANGO_CACHE_URL` : Redis partagé entre processus et instances, de préférence
  TLS (`rediss://`) hors réseau privé de confiance. Il sert notamment au
  throttling DRF.
- HTTPS obligatoire : `DJANGO_SECURE_SSL_REDIRECT=True` et
  `DJANGO_SECURE_HSTS_SECONDS` strictement positif. L’inclusion des sous-domaines
  est désactivée par défaut; activer `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS` et
  `DJANGO_SECURE_HSTS_PRELOAD` uniquement après avoir confirmé que tous les noms
  de domaine concernés sont HTTPS et sous contrôle de l’équipe.
- `BACKEND_API_URL` : URL serveur du backend utilisée par Next; ne jamais la
  publier comme variable `NEXT_PUBLIC_*`.
- `DJANGO_EMAIL_BACKEND`, `DJANGO_EMAIL_HOST`, `DJANGO_EMAIL_PORT`,
  `DJANGO_EMAIL_HOST_USER`, `DJANGO_EMAIL_HOST_PASSWORD` et
  `DJANGO_DEFAULT_FROM_EMAIL` : SMTP réel et secrets gérés.
- `DJANGO_MEDIA_ROOT` et `GIT_REPOSITORY_ROOT` : volumes persistants privés,
  avec politiques de sauvegarde et de restauration testées.
- `DJANGO_TRUST_PROXY_SSL_HEADER=True` uniquement derrière un proxy de confiance
  qui supprime puis réécrit correctement `X-Forwarded-Proto`.

Déployer les assets avec `python manage.py collectstatic --noinput`. Les fichiers
médias sont encore sur stockage système de fichiers; aucun stockage objet/CDN,
serveur Git public ni rotation automatisée de clés n’est fourni. La vérification
d’adresse et la récupération du mot de passe sont implémentées par e-mail; leur
fonctionnement en production dépend du SMTP et des URL HTTPS réellement configurés.

## Tests et contrôles

La CI GitHub Actions exécute ESLint et le build Next, puis installe les
requirements backend avec PostgreSQL et Redis de test, vérifie les migrations,
exécute les tests et lance `python manage.py check --deploy`.

L’endpoint `/api/health/` est un test de vivacité basique avec requête DB; il ne
teste pas SMTP, Git, Redis, le stockage média ou les dépendances externes.

Vérifications locales frontend : `npm run lint`, puis `npm run build`.

Vérifications locales backend depuis `backend/` :

- `python manage.py check`
- `python manage.py makemigrations --check --dry-run`
- `python manage.py test`
- `python manage.py check --deploy` (avec les variables de production adéquates)

La suite ne remplace pas des tests E2E multi-navigateurs, une revue de menace,
un audit d’intrusion autorisé, un test de charge, un contrôle des sauvegardes,
une procédure d’astreinte ou une validation de staging avant mise en production.

## Travail restant avant disponibilité complète

- Connexion Google/Microsoft vérifiée côté serveur lorsque les identifiants client, domaines et callbacks OAuth sont configurés; ces identifiants et un test avec les comptes fournisseurs réels restent à fournir pour le déploiement.
- Avatar/liens sociaux et préférences persistantes (notification, confidentialité, 2FA).
- Import de médias et d’avatars, temps réel de la messagerie, recherche globale
  d’issues/PR/organisations/messages (les dépôts, développeurs et publications
  sont actuellement recherchables),
  contributions Git, réponses aux commentaires et modération.
- Invitations et transfert du propriétaire des organisations; dépôts possédés
  directement par une organisation et permissions de collaborateurs de dépôt.
- Notifications d’issues/revues complètes et préférences persistantes.
- Collaborateurs et permissions par dépôt/organisation, ainsi que les forks.
- Renommage et suppression sécurisée des dépôts avec nettoyage cohérent du stockage Git.
- Clone/fetch/push Git, authentification Git, fusion des pull requests et revue.
- Calcul/persistance fiable de la taille et du langage, pagination des commits et
  attribution des contributions.
- Stockage objet pour médias, politique de sauvegarde restaurable, monitoring,
  alertes, logs structurés et procédure de réponse aux incidents.
- Tests fonctionnels/E2E, tests d’accessibilité et sécurité, et répétition de
  déploiement/restauration dans un staging proche de la production.

Tant que ces éléments ne sont pas couverts ou explicitement retirés du périmètre,
le produit n’est pas à considérer comme « prêt à 100 % » pour une mise en
production complète.
