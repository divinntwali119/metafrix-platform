# AfriHub / MetafriX — bilan et préparation à la production

**Mise à jour : 14 novembre 2026**
**État : prêt pour une validation en staging, pas encore certifié pour une ouverture publique complète.**

Ce document distingue les fonctionnalités présentes dans le code, celles qui restent à développer et les contrôles d’exploitation à réaliser. Les vérifications locales ne remplacent ni un déploiement de staging, ni un audit, ni la validation de l’infrastructure réelle.

## Résumé exécutif

Le projet dispose d’un socle Next.js + Django, d’une authentification réelle, d’une API de dépôts et d’une première intégration Git. Le feed, l’annuaire et les suivis, les organisations, la messagerie et les notifications disposent maintenant d’API persistantes et d’interfaces raccordées.

La plateforme n’est toutefois pas « complète à 100 % » : les opérations Git de collaboration ne sont pas faites, certaines capacités communautaires (médias hébergés, temps réel, contributions) restent limitées, et l’exploitation réelle (stockage, sauvegardes testées, supervision, staging et revue de sécurité) reste à organiser.

## Réalisé dans le code

### Authentification et protection des requêtes

- Authentification avec inscription, connexion par nom d’utilisateur ou e-mail, déconnexion, renouvellement JWT et changement de mot de passe.
- Inscription en attente jusqu’à confirmation e-mail, vérification à jeton unique, renvoi à réponse générique et récupération/réinitialisation par lien expirant; les changements de mot de passe révoquent les sessions existantes, refresh et access tokens.
- Flux OAuth Authorization Code + PKCE pour Google et Microsoft, validation serveur des ID tokens et politique de non-fusion silencieuse des comptes; nécessite des identifiants fournisseur et callbacks réels.
- Les jetons restent côté serveur dans des cookies `HttpOnly`; le client navigateur ne les lit pas.
- Le proxy Next.js transmet l’identité au backend et vérifie l’origine des mutations.
- Les endpoints sont authentifiés par défaut, avec des routes publiques explicites et des limites de requêtes pour les opérations sensibles.
- Les routes et la sérialisation des données utilisateur évitent de divulguer l’e-mail d’un autre compte.
- Le profil permet de modifier le nom, la bio, la localisation et le site web. L’e-mail n’est pas modifiable sans vérification d’adresse.

Références : [proxy backend](../src/lib/server/backend-proxy.ts), [routes utilisateur](../backend/apps/users/views.py), [sérialisation utilisateur](../backend/apps/users/serializers.py).

### Configuration Django et API

- Configuration de production stricte : secret robuste requis, hôtes exacts, PostgreSQL, Redis, HTTPS, redirection SSL et HSTS.
- Un healthcheck non authentifié vérifie la connexion à la base sans exposer de détails internes.
- Création et lecture de dépôts personnels; lecture des branches, arbres, blobs texte et commits du dépôt Git.
- Validation des chemins Git et limites de taille/nombre pour contenir les lectures.
- Étoiles et suivi de dépôt persistés par l’API, avec mutations idempotentes.
- Modification de la description et de la visibilité réservée au propriétaire.
- Les dépôts privés sont masqués aux utilisateurs non autorisés.

Références : [configuration Django](../backend/config/settings.py), [lecteur Git](../backend/apps/repositories/git_reader.py), [API des dépôts](../backend/apps/repositories/views.py), [API santé](../backend/apps/api/views.py).

### Interface et transparence produit

- Les pages de dépôt utilisent les données Git réelles pour l’arborescence et les commits.
- Les états d’erreur et de dépôt introuvable sont distincts.
- Les actions sans implémentation complète — clone, fork, suppression, renommage, diff et fusion Git — ne sont plus présentées comme si elles fonctionnaient.
- Le feed, l’annuaire et les profils, les organisations, les messages et les notifications utilisent les endpoints persistants hors mode démo; les actions d’écriture exigent une session authentifiée.
- Les listes sont paginées; les erreurs d’accès et les états de chargement/vides sont rendus dans les pages sociales. Les notifications et messages affichent les compteurs issus du serveur.
- La recherche globale couvre les dépôts, les développeurs et les publications; elle ne couvre pas encore les issues, PR, organisations ou messages.
- Les médias de publication sont référencés par URL distante uniquement; l’upload/stockage objet, les flux temps réel et les données de contributions Git ne sont pas implémentés.
- `NEXT_PUBLIC_DEMO_MODE` doit rester désactivé sur tout environnement réel.
- Les images Docker Next/Django, Compose (PostgreSQL, Redis), healthchecks et montages secrets sont fournis pour le démarrage et le staging. Cela ne remplace ni reverse proxy TLS, sauvegardes, stockage média externe, supervision, ni tests du fournisseur OAuth/SMTP sur un domaine réel.

Références : [écran de fonctionnalité indisponible](../src/components/ui/FeatureUnavailable.tsx), [service de dépôt](../src/services/repository.service.ts), [état des fonctionnalités](backend-handoff.md).

### Qualité et intégration continue

- Le workflow [CI GitHub Actions](../.github/workflows/ci.yml) définit les contrôles frontend et backend, avec services PostgreSQL et Redis pour le job backend, ainsi qu’une validation Compose et la construction des deux images conteneur.
- Le README décrit les démarrages locaux et les prérequis production : [README](../README.md).

 Validation de référence antérieure aux derniers changements d’authentification et Docker :

- `npm run lint` : réussi.
- `npm run build` : réussi.
- `python manage.py makemigrations --check --dry-run` : aucune migration manquante.
- `python manage.py test` : 41 tests réussis sur SQLite temporaire.
- `python manage.py check --deploy` : déjà validé dans la CI avec des variables synthétiques; non relancé lors de la dernière validation locale.
- `git diff --check` : réussi.

Le contrôle `check --deploy` avec des valeurs synthétiques ne vérifie pas la disponibilité réelle d’un PostgreSQL, d’un Redis, d’un SMTP, du stockage Git ou des domaines de production. Les tests locaux sur SQLite ne remplacent pas l’exécution CI et les essais sur l’environnement cible.

## Fonctionnalités à terminer pour une plateforme complète

### Priorité 1 — comptes et données personnelles

- Configurer et tester l’envoi SMTP réel, ainsi que les callbacks Google/Microsoft sur un domaine HTTPS vérifié; les contrôles de code seuls ne garantissent pas la délivrabilité ou l’acceptation par les fournisseurs.
- Mettre en place les préférences persistantes de notification et de confidentialité.
- Implémenter réellement la 2FA avant d’offrir une option d’activation.
- Ajouter le stockage sécurisé des avatars et les liens sociaux persistants.
- Définir les procédures de suppression, export et conservation des données de compte.

### Priorité 2 — dépôts et collaboration Git

- Implémenter clone/fetch/push (Smart HTTP ou SSH) avec authentification, autorisations, quotas et journalisation.
- Construire le fork réel et garantir que sa copie Git et ses métadonnées restent cohérentes.
- Ajouter les permissions de collaborateurs et d’organisations.
- Calculer les diffs des pull requests, valider leurs branches, gérer les revues et les états, puis effectuer le merge Git de façon contrôlée.
- Implémenter le renommage et la suppression coordonnée des dépôts en couvrant à la fois la base et le stockage Git.
- Compléter les issues : fermeture, commentaires, assignations et compteurs fiables.
- Calculer les langages, tailles et contributions depuis des données réelles; paginer les historiques volumineux.

Les issues et pull requests actuelles peuvent créer et lire des enregistrements métier, mais ne fournissent pas encore un cycle complet de collaboration Git.

### Priorité 3 — fonctions communautaires

Le périmètre de base est implémenté : feed paginé avec publications/commentaires/réactions/favoris; annuaire et profils publics avec abonnements; organisations avec adhésion, rôles et association de dépôts publics personnels; conversations directes/de groupe et messages texte/code; notifications persistées, lecture et suppression. Des tests API couvrent permissions, confidentialité et persistance.

Restent à terminer : upload et stockage sûr des images/avatars, médias hébergés et modération; recherche globale des issues, PR, organisations et messages (la recherche actuelle couvre dépôts, développeurs et publications); actualisation temps réel ou polling dédié de la messagerie; invitations et transfert de propriété des organisations; dépôts possédés directement par une organisation; notifications d’issues/revues et préférences configurables; métriques de contributions réelles.

### Priorité 4 — qualité produit et conformité

- Tester tous les parcours réels : inscription, vérification, connexion, création de dépôt, permissions, issues, PR et opérations de compte.
- Préparer les pages légales nécessaires aux pays ciblés : conditions, confidentialité, cookies si applicables, signalement et modération.
- Tester l’accessibilité, l’affichage mobile, les erreurs réseau, les limites de débit et les comportements de session expirée.
- Définir les règles anti-spam, de modération et de traitement des signalements avant d’ouvrir les fonctions communautaires.

## Préparation de l’infrastructure réelle

À réaliser avec l’hébergeur et le nom de domaine retenus :

- [ ] Provisionner des environnements séparés de staging et production; limiter les accès administrateurs.
- [ ] Créer PostgreSQL avec chiffrement, sauvegardes, supervision et capacité de restauration documentée.
- [ ] Créer Redis partagé et sécurisé (TLS ou réseau privé de confiance).
- [ ] Générer les secrets en production et les conserver dans un gestionnaire de secrets; ne jamais réutiliser les valeurs de CI ou d’exemple.
- [ ] Configurer les hôtes autorisés, DNS, certificats TLS, terminaison HTTPS et en-têtes du reverse proxy.
- [ ] Configurer `DJANGO_NUM_PROXIES` et vérifier que le reverse proxy écrase `X-Forwarded-For`; ne jamais faire confiance aux valeurs envoyées directement par le navigateur.
- [ ] Configurer `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DATABASE_URL`, `DJANGO_CACHE_URL`, `BACKEND_API_URL` et `NEXT_PUBLIC_DEMO_MODE=false`.
- [ ] Garder `DJANGO_SECURE_SSL_REDIRECT=True` et un HSTS positif. N’activer `includeSubDomains` ou `preload` qu’après validation de tous les sous-domaines concernés.
- [ ] Configurer `DJANGO_TRUST_PROXY_SSL_HEADER=True` uniquement si le proxy de confiance retire puis réécrit l’en-tête correspondant.
- [ ] Configurer le SMTP, son expéditeur, les secrets et la délivrabilité; tester réception et gestion des rebonds.
- [ ] Configurer `APP_BASE_URL`, `AUTH_EXCHANGE_SECRET`, les secrets montés de Django/PostgreSQL/SMTP et, si activés, les identifiants client OAuth.
- [ ] Enregistrer et tester les callbacks OAuth Google/Microsoft sur le domaine HTTPS de staging; garder les fournisseurs désactivés tant que leurs secrets ne sont pas provisionnés.
- [ ] Vérifier `docker compose config`, les builds finaux, les healthchecks et l’exécution des migrations avec les versions et secrets de staging.
- [ ] Mettre les médias et dépôts Git sur un stockage persistant, privé, surveillé et sauvegardé. Évaluer le stockage objet pour les médias.
- [ ] Déployer les assets statiques avec `python manage.py collectstatic --noinput`.
- [ ] Tester migrations, démarrage, healthcheck, redémarrage, montée en charge horizontale et restauration à partir d’une sauvegarde.
- [ ] Vérifier qu’aucun fichier `.env`, secret, jeton ou donnée personnelle n’est livré dans le dépôt ou les artefacts.

Le healthcheck HTTP Django teste la base de données seulement; le Compose ajoute des contrôles de conteneur séparés pour Redis et Next.js. Aucun d’eux ne valide SMTP, Git, la sauvegarde, la délivrabilité des e-mails ou la disponibilité des domaines OAuth.

## Observabilité et réponse aux incidents

- [ ] Centraliser les erreurs frontend/backend et les journaux sans y enregistrer mots de passe, jetons ou données personnelles inutiles.
- [ ] Mettre en place des métriques et alertes pour disponibilité, erreurs 5xx, latence, saturation DB/Redis, espace disque et tâches en échec.
- [ ] Définir qui reçoit les alertes, les délais de réponse et les procédures d’incident.
- [ ] Définir la rotation des secrets, les correctifs de dépendances, la conservation des journaux et la gestion des vulnérabilités.
- [ ] Vérifier les sauvegardes et exécuter périodiquement une restauration complète dans un environnement isolé.

## Tests et critères d’autorisation de lancement

Avant la mise en ligne publique :

- [ ] Exécuter la CI complète sur la branche de release avec PostgreSQL et Redis.
- [ ] Faire passer une suite E2E sur staging avec les principaux parcours utilisateur et les permissions.
- [ ] Réaliser les tests de sécurité et de charge adaptés au trafic prévu; faire effectuer une revue de sécurité autorisée.
- [ ] Tester les sauvegardes et la restauration, y compris les objets Git et médias, puis mesurer le temps de reprise.
- [ ] Vérifier les domaines, HTTPS, cookies Secure, HSTS, erreurs, monitoring, alertes et contact d’astreinte.
- [ ] Confirmer que les parcours non implémentés sont masqués, désactivés ou explicitement annoncés comme indisponibles.
- [ ] Faire valider le staging et signer la décision de lancement par les responsables produit et exploitation.

Le lancement n’est acceptable que si les fonctions incluses dans le périmètre sont réellement persistantes, les données privées restent accessibles uniquement aux personnes autorisées, les procédures de sauvegarde/restauration sont testées et l’équipe peut détecter et traiter les incidents.
