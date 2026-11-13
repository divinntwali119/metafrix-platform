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
	et configuration de sécurité Django.

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
serveur et ne doit pas être préfixée par `NEXT_PUBLIC_`.

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

## Mise en production

Ne déployez pas cette configuration sans l’adapter à l’hébergeur et aux besoins
de l’exploitation. En production, Django refuse les secrets faibles, les hôtes
wildcard, SQLite, l’absence de Redis, SSL désactivé et HSTS désactivé. Fournissez
un `DJANGO_SECRET_KEY` aléatoire via un gestionnaire de secrets, des
`DJANGO_ALLOWED_HOSTS` exacts, une `DATABASE_URL` PostgreSQL, un
`DJANGO_CACHE_URL` Redis, un stockage persistant pour les dépôts Git et les
médias, un SMTP opérationnel, et `BACKEND_API_URL` dans l’environnement serveur
Next.js. Utilisez HTTPS de bout en bout et configurez le proxy TLS uniquement si
`DJANGO_TRUST_PROXY_SSL_HEADER=True` est nécessaire et que l’en-tête est réécrit
par une infrastructure de confiance.

Avant ouverture au public, prévoir aussi sauvegardes testées/restauration,
stockage objet des médias, supervision/alertes, vérification e-mail et
récupération du mot de passe, tests E2E, audit de sécurité et validation du
staging. Les fonctionnalités listées comme incomplètes ne doivent pas être
présentées comme disponibles.

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
