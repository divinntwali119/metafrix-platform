# MetafriX

MetafriX est une plateforme communautaire pour découvrir des développeurs,
partager des projets et collaborer autour du code. Ce dépôt contient actuellement
le frontend Next.js ; le backend reste à construire.

## État du projet

- Frontend : Next.js 16, React 19, TypeScript, Tailwind CSS 4.
- Données : plusieurs écrans utilisent encore des données de démonstration et le
	store Zustand. L’application n’est pas encore intégrée à un backend complet.
- API : un client Axios et des services de départ existent dans `src/services/`.
- CI : GitHub Actions vérifie le lint et le build sur les pushes de branches et
	les pull requests vers `main`.
- Contrat et tâches de démarrage backend : voir
	[`docs/backend-handoff.md`](docs/backend-handoff.md).

## Démarrage local

Prérequis : Node.js 20.9 ou supérieur et npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

L’application sera disponible sur [http://localhost:3000](http://localhost:3000).
Le backend est configuré par défaut sur `http://localhost:8000/api`.
Pour pointer vers une autre instance, modifiez `NEXT_PUBLIC_API_URL` dans
`.env.local`. Cette variable ne doit contenir qu’une URL publique d’API — jamais
de mot de passe, clé privée ou secret.

Vérifications avant une pull request :

```bash
npm run lint
npm run build
```

## Organisation du code

- `src/app/` : pages et routes de l’application.
- `src/components/` : composants réutilisables.
- `src/services/` : client HTTP et premiers appels API.
- `src/types/index.ts` : types des principales entités frontend.
- `src/lib/mock-data.ts` et `src/lib/store.ts` : données et état de démonstration.

## Contribution

Créez une branche dédiée à votre tâche, ouvrez une issue si le travail n’est pas
déjà suivi, puis soumettez une pull request vers `main`. N’ajoutez jamais de
fichier `.env.local`, secret, jeton ou donnée personnelle au dépôt. Les valeurs
locales sont ignorées par Git ; `.env.example` ne contient que des valeurs
publiables.
