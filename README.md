# MetafriX

MetafriX est une plateforme communautaire pour découvrir des développeurs,
partager des projets et collaborer autour du code. Le dépôt contient une
application Next.js et une API Django REST Framework ; les fonctions sociales
de base sont persistées, tandis que certaines fonctions avancées et opérations
de collaboration restent à développer.

## État du projet

- Frontend : Next.js 16, React 19, TypeScript, Tailwind CSS 4.
- Backend : Django REST Framework, PostgreSQL en production, Redis requis pour
	le cache/throttling distribué, JWT court stocké dans des cookies HttpOnly par
	le proxy Next.js same-origin.
- Authentification : confirmation d’adresse e-mail, récupération/réinitialisation
	par e-mail, cookies HttpOnly et flux OAuth Google/Microsoft configurables.
- Déploiement conteneurisé : images multi-stage Next.js/Django non-root,
	Compose avec PostgreSQL, Redis, volumes persistants, contrôles de santé et
	secrets montés depuis des fichiers. Voir « Déploiement Docker » ci-dessous.
- Fonctionnalités persistées : authentification, profil de base, annuaire et
	suivi des développeurs, publications/commentaires/réactions/favoris,
	organisations/membres/rôles/associations de dépôts publics, conversations et
	messages, notifications, dépôts Git personnels et lectures Git.
	- Fonctions encore incomplètes : import d’images/avatars, médias hébergés,
		temps réel de la messagerie, recherche globale d’issues/PR/organisations,
		heatmap/contributions,
		préférences persistantes et 2FA, invitations et transfert du propriétaire,
		dépôts réellement possédés par une organisation, clone/push Git et fusion
		effective des pull requests. Voir
	[docs/backend-handoff.md](docs/backend-handoff.md) pour le périmètre exact.
- Les données de démonstration ne sont utilisées que lorsque
	`NEXT_PUBLIC_DEMO_MODE=true`. Gardez cette variable désactivée en staging et
	en production; les fonctions sociales réelles requièrent un compte connecté.
- Le bilan des travaux, fonctionnalités restantes et étapes de lancement est
	disponible dans [docs/production-readiness.md](docs/production-readiness.md).
- CI : GitHub Actions vérifie lint/build frontend et checks, migrations, tests
	et configuration de sécurité Django, valide Compose avec des secrets
	temporaires et construit les images frontend/backend.

## Démarrage local

Prérequis : Node.js 20.9 ou supérieur et npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

L’application sera disponible sur [http://localhost:3000](http://localhost:3000).
Le proxy Next appelle AfriHub Django sur `http://127.0.0.1:8001` par défaut,
pour éviter les conflits avec d’autres projets Django utilisant le port 8000. Configurez
`BACKEND_API_URL` dans `.env.local` si nécessaire; cette variable reste côté
serveur et ne doit pas être préfixée par `NEXT_PUBLIC_`. Pour afficher les
avatars et images renvoyés sous `/media/...`, le frontend utilise en local le
même hostname sur le port Django 8001. Si le serveur média a une autre origine,
définissez `NEXT_PUBLIC_BACKEND_MEDIA_URL` sur son origine publique; les URL
d’image absolues renvoyées par l’API sont utilisées telles quelles.

## Démarrage du backend local

Prérequis : Python 3.14 et Git. Depuis le répertoire du projet :

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
cd backend
python manage.py migrate
python manage.py runserver 127.0.0.1:8001
```

Le backend est disponible sur `http://127.0.0.1:8001/api/`. Pour créer un
administrateur local, lancez `python manage.py createsuperuser`; l’interface
admin est disponible sous `/admin/`.

En développement, Django utilise le backend e-mail console : les messages de
confirmation et de réinitialisation (avec leurs liens) sont imprimés dans le
terminal du backend. Les exemples racine et backend contiennent la même clé
d’échange locale; si vous la modifiez, gardez `AUTH_EXCHANGE_SECRET` identique
des deux côtés. Les boutons OAuth affichent un message de configuration tant
que des identifiants réels ne sont pas fournis; en local, enregistrez les callbacks
`http://localhost:3000/api/auth/oauth/google/callback` et
`http://localhost:3000/api/auth/oauth/microsoft/callback` chez les fournisseurs.

Vérifications avant une pull request :

```bash
npm run lint
npm run build
```

Backend :

```bash
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
```

## Déploiement Docker

Prérequis : Docker Engine avec `docker compose`, un domaine déjà dirigé vers le
serveur, un reverse proxy HTTPS géré par l’exploitation et un compte SMTP
authentifié. La stack expose Next.js uniquement sur `127.0.0.1:3000`; le proxy
TLS externe doit router le domaine public vers ce port. L’API Django, PostgreSQL
et Redis ne publient aucun port sur l’hôte. Si le port 3000 est déjà utilisé,
changez `WEB_PORT` dans la configuration Compose.

1. Copier `.env.docker.example` en `.env.docker`, puis définir l’URL publique
	HTTPS, les hôtes Django, le compte SMTP, son expéditeur vérifié et les autres
	paramètres non secrets :

	```bash
	cp .env.docker.example .env.docker
	```
2. Créer le répertoire de secrets à accès restreint et produire des secrets
	indépendants pour PostgreSQL, Django et l’échange serveur OAuth :

	```bash
	mkdir -p .secrets
	chmod 700 .secrets
	openssl rand -hex 32 > .secrets/postgres_password
	openssl rand -hex 64 > .secrets/django_secret_key
	openssl rand -hex 64 > .secrets/auth_exchange_secret
	touch .secrets/smtp_password .secrets/google_client_secret .secrets/microsoft_client_secret
	chmod 600 .secrets/*
	```

	Renseignez le mot de passe SMTP fourni par le prestataire dans
	`.secrets/smtp_password`. Les secrets OAuth peuvent rester vides si ces
	fournisseurs ne sont pas activés; pour les activer, placez leurs secrets
	client dans les fichiers dédiés et configurez les identifiants client dans
	`.env.docker`. Le répertoire `.secrets/` est ignoré par Git. Sur un serveur,
	préférez la distribution de ces fichiers depuis un gestionnaire de secrets;
	les secrets locaux Compose sont des montages de fichiers en lecture seule,
	pas un coffre-fort chiffré. Après avoir renseigné ces fichiers, rendez-les
	lisibles par l’UID non-root des conteneurs (`chmod 444 .secrets/*`) et gardez
	le répertoire hôte protégé (`chmod 700 .secrets`).
3. Démarrer la pile (les migrations et `collectstatic` s’exécutent avant Django) :

	```bash
	docker compose --env-file .env.docker config --quiet
	docker compose --env-file .env.docker up --build -d
	docker compose --env-file .env.docker ps
	docker compose --env-file .env.docker logs -f frontend backend migrate
	```

	`APP_BASE_URL` doit être en HTTPS en production. La terminaison TLS doit
	transmettre vers Next.js; le BFF définit les en-têtes d’hôte/protocole de
	confiance avant d’appeler Django. Le contrôle d’origine du BFF utilise
	`APP_BASE_URL` comme origine canonique; faites servir le site sur ce domaine
	(ou redirigez les alias vers lui). Configurez le reverse proxy pour remplacer
	`X-Forwarded-For` par l’adresse réelle du client (et fournir `X-Real-IP`),
	sans conserver un header fourni par le navigateur : Django fait confiance à
	un seul proxy via `DJANGO_NUM_PROXIES=1` pour appliquer ses limites de débit.
	Le trafic BFF→Django est HTTP sur le réseau Docker privé d’un même hôte; si
	vos conteneurs traversent un réseau non fiable, chiffrez aussi ce segment.
	N’exposez jamais le port 8000 du backend directement à Internet. Ne mettez
	pas `AUTH_COOKIE_SECURE=false` en production.
4. Pour mettre à jour le code, récupérer la version voulue puis exécuter de
	nouveau `docker compose --env-file .env.docker up --build -d`; contrôlez les
	logs et les healthchecks après la migration. Pour arrêter sans supprimer les
	données :

	```bash
	docker compose --env-file .env.docker down
	```

	`down -v` supprime PostgreSQL, les médias, les dépôts Git et les assets
	statiques : ne l’utilisez pas pour une opération d’arrêt ordinaire.
5. Vérifier le point d’entrée via le proxy HTTPS et consulter l’état des
	conteneurs. Les healthchecks testent Next.js et Django/DB; Redis a son propre
	contrôle. Configurez les callbacks exacts chez les fournisseurs OAuth :
	`https://<domaine>/api/auth/oauth/google/callback` et
	`https://<domaine>/api/auth/oauth/microsoft/callback`. Google/Microsoft
	n’acceptent de véritables connexions que lorsque leurs identifiants et
	secrets sont provisionnés. Sans SMTP valide, les boutons d’inscription,
	confirmation et récupération ne peuvent pas délivrer leurs e-mails.

Les données PostgreSQL, médias, dépôts Git et statiques résident dans des
volumes Docker nommés. Établissez des sauvegardes chiffrées et hors hôte pour la
base, les volumes média et Git, puis testez régulièrement leur restauration.
Les médias sont encore servis depuis le système de fichiers applicatif : pour
une exposition publique, ajoutez un service/proxy média ou un stockage objet
avec les contrôles d’accès adéquats. La tâche Celery d’encodage vidéo n’est pas
encore raccordée à un endpoint ni à une file; aucun worker Celery n’est donc
lancé par Compose. `ffmpeg` est présent dans l’image backend, sans que cela
constitue une fonctionnalité vidéo opérationnelle.

## Application mobile (PWA)

MetafriX fournit un manifeste installable, des icônes Android/iOS et un service worker avec une page de secours hors connexion. Pour préserver les données de compte, les réponses d’API, pages privées et contenus utilisateurs ne sont pas mis en cache : les fonctions de l’application nécessitent toujours internet.

Le service worker est activé dans les builds de production, pas avec `npm run dev`. Testez l’installation localement avec `npm run build` puis `npm run start`; en production, servez le site en HTTPS.

## Mise en production
Ne déployez pas cette configuration sans l’adapter à l’hébergeur et aux besoins
de l’exploitation. En production, Django refuse les secrets faibles, les hôtes
wildcard, SQLite, l’absence de Redis, SSL désactivé et HSTS désactivé. Fournissez
un `DJANGO_SECRET_KEY` aléatoire via un gestionnaire de secrets, des
`DJANGO_ALLOWED_HOSTS` exacts, `DJANGO_NUM_PROXIES` correspondant à la chaîne
de proxies réellement de confiance, une `DATABASE_URL` PostgreSQL, un
`DJANGO_CACHE_URL` Redis, un stockage persistant pour les dépôts Git et les
médias, un SMTP opérationnel, et `BACKEND_API_URL` dans l’environnement serveur
Next.js. Utilisez HTTPS de bout en bout et configurez le proxy TLS uniquement si
`DJANGO_TRUST_PROXY_SSL_HEADER=True` est nécessaire et que l’en-tête est réécrit
par une infrastructure de confiance.

Avant ouverture au public, prévoir aussi sauvegardes testées/restauration,
stockage objet des médias, supervision/alertes, tests E2E, audit de sécurité et
validation du staging. La vérification e-mail et la récupération du mot de passe
sont implémentées, mais exigent SMTP et domaine HTTPS correctement configurés;
les connexions Google/Microsoft exigent en plus les secrets et callbacks des
fournisseurs. Les fonctionnalités listées comme incomplètes ne doivent pas être
présentées comme disponibles.

## Étapes restantes avant l’ouverture au public

Le lancement de Compose fournit une base de déploiement, mais ne valide pas à lui
seul la sécurité, la délivrabilité des e-mails, la restauration des données ni
les parcours réels. Ne passez pas en production avant d’avoir clôturé les points
applicables ci-dessous et validé le staging.

### Infrastructure et sécurité

- [ ] Créer des environnements séparés de staging et de production et limiter les
	accès administratifs.
- [ ] Provisionner PostgreSQL chiffré et Redis partagé sur un réseau privé ou
	protégé par TLS; mettre en place des sauvegardes hors hôte et tester leur
	restauration, y compris pour les médias et dépôts Git.
- [ ] Configurer DNS, certificats HTTPS et reverse proxy; faire remplacer les
	en-têtes client par le proxy de confiance, puis régler `DJANGO_NUM_PROXIES` et
	les hôtes autorisés en conséquence.
- [ ] Générer des secrets propres à chaque environnement et les distribuer via
	un gestionnaire de secrets; ne jamais réutiliser les valeurs d’exemple ou de
	CI ni publier de fichier `.env`.
- [ ] Vérifier HTTPS, cookies sécurisés, HSTS et les paramètres Django de
	production; ne faire confiance aux en-têtes proxy que si l’infrastructure les
	réécrit.
- [ ] Configurer un SMTP opérationnel (expéditeur, authentification,
	délivrabilité et traitement des rebonds), puis tester la réception des
	confirmations et liens de récupération.
- [ ] Enregistrer et tester les callbacks OAuth Google/Microsoft exacts sur le
	domaine HTTPS de staging; garder un fournisseur désactivé tant que ses
	identifiants et secrets ne sont pas provisionnés.
- [ ] Vérifier le stockage persistant, les permissions et la capacité des médias
	et dépôts Git; choisir un stockage objet pour les médias si nécessaire.
- [ ] Centraliser journaux sans secrets ni données personnelles inutiles,
	métriques et alertes pour disponibilité, erreurs, latence, saturation des
	services et espace disque; définir les procédures d’incident, la conservation
	des journaux, la rotation des secrets, les correctifs de dépendances, le
	traitement des vulnérabilités et les responsables d’astreinte.

### Qualification et décision de lancement

- [ ] Passer la CI complète sur la branche de release avec PostgreSQL et Redis,
	exécuter `python manage.py check --deploy`, puis valider la configuration
	Compose, les images, les migrations et les healthchecks sur le staging avec
	les versions prévues pour la production.
- [ ] Exécuter des tests E2E des parcours d’inscription, vérification e-mail,
	connexion, OAuth, récupération de compte, permissions, dépôts et collaboration
	réellement disponibles.
- [ ] Tester erreurs réseau, sessions expirées, limites de débit, affichage
	mobile et accessibilité; réaliser les tests de charge et une revue de sécurité
	autorisée adaptés au trafic prévu.
- [ ] Restaurer une sauvegarde dans un environnement isolé et vérifier les
	délais de reprise, y compris pour PostgreSQL, médias et dépôts Git; contrôler
	redémarrages, migrations, alertes, espace disque et montée en charge
	horizontale.
- [ ] Préparer les pages légales et les procédures de confidentialité,
	conservation/suppression des données, modération, signalement et anti-spam.
- [ ] Faire valider le staging par les responsables produit et exploitation;
	garder `NEXT_PUBLIC_DEMO_MODE=false` et masquer ou annoncer clairement les
	fonctions non disponibles.

### Fonctionnalités produit encore à terminer

- [ ] Terminer les comptes : préférences de notification et de confidentialité
	persistantes, authentification à deux facteurs, upload sécurisé et modération
	des avatars/médias, liens sociaux et procédures d’export, suppression et
	conservation des données.
- [ ] Terminer la collaboration Git : clone/fetch/push sécurisés, fork réel,
	permissions de collaborateurs et d’organisations, cycle complet des issues et
	pull requests (diff, revue et fusion), fermeture/commentaires/assignation des
	issues, renommage et suppression cohérents, historiques paginés et métriques
	réelles de langages, tailles et contributions.
- [ ] Terminer les fonctions communautaires : temps réel de la messagerie,
	recherche des issues/PR/organisations/messages, invitations et transfert de
	propriété des organisations, dépôts appartenant aux organisations,
	notifications d’issues/revues configurables et autres statistiques de
	contributions réelles.

La checklist exhaustive d’exploitation et les critères de lancement figurent
dans [docs/production-readiness.md](docs/production-readiness.md); le détail des
fonctions backend restantes est dans [docs/backend-handoff.md](docs/backend-handoff.md).

## Organisation du code

- `src/app/` : pages et routes de l’application.
- `src/components/` : composants réutilisables.
- `src/services/` : client HTTP et premiers appels API.
- `src/types/index.ts` : types des principales entités frontend.
- `src/lib/mock-data.ts` et `src/lib/store.ts` : données explicitement réservées
	au mode démo et état frontend.
- `backend/apps/` : applications Django, endpoints API, modèles et tests.

## Contribution

Créez une branche dédiée à votre tâche, ouvrez une issue si le travail n’est pas
déjà suivi, puis soumettez une pull request vers `main`. N’ajoutez jamais de
fichier `.env.local`, secret, jeton ou donnée personnelle au dépôt. Les valeurs
locales sont ignorées par Git ; `.env.example` ne contient que des valeurs
publiables.
