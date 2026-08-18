# Journal des versions

Format inspiré de Keep a Changelog. Les dates correspondent aux dates de mise en production ou, pour la version en cours, à la date de rédaction. Le détail des anomalies corrigées jusqu'au 22/07/2026 figure dans l'annexe D du dossier professionnel BLOC 2 ; les entrées suivantes reprennent uniquement les évolutions visibles à ce niveau.

## [1.1.0] - 2026-08-18

Version de maintenance corrective, préparée dans le cadre de l'audit du dossier professionnel BLOC 4.

### Ajouté

- Sonde de disponibilité `GET /api/health` : vérifie que le processus applicatif répond et que la base MongoDB est joignable (requête `count` via Prisma), avec temps de réponse et durée de fonctionnement. Destinée à un contrôle de supervision externe.

### Corrigé

- Deux tests de la route `app/api/user/profile-image` échouaient depuis la mise à jour de l'environnement de développement vers Node.js 24 : le `File` fourni par l'environnement de test jsdom n'est pas reconnu par le nouvel analyseur multipart interne d'undici, utilisé par `NextRequest` pour reconstituer un formulaire envoyé en corps de requête. Les deux tests concernés ont été réécrits pour ne plus dépendre de cette sérialisation, en s'alignant sur le contournement déjà utilisé par un test voisin de ce même fichier.

### Sécurité

- Neuf vulnérabilités de sévérité élevée corrigées dans l'arbre de dépendances (`brace-expansion`, `js-yaml`, `nanoid`, `postcss`, `sharp`, `undici`) via `npm audit fix`, sans changement cassant.
- Trois vulnérabilités résiduelles subsistent, héritées de la chaîne d'outillage de Prisma (`deepmerge-ts`). Leur correction automatique imposerait une régression de Prisma vers la version 6.12.0 ; elle n'a pas été appliquée. Suivi conservé pour une prochaine version de Prisma.

## [1.0.0] - 2026-07-22

Version de référence du dossier professionnel BLOC 2, après la refonte de l'interface et la mise en place de la chaîne de qualité.

### Ajouté

- Parcours complet : authentification, création et gestion d'événements, invitations, réponses, sondages, gestion des amis, personnalisation de l'affichage.
- Notifications push (protocole VAPID) et installation en tant qu'application progressive (PWA).
- Pipeline CI/CD unifié : analyse statique, vérification de types, tests avec couverture et build, préalables obligatoires au déploiement.

### Sécurité

- Politique de mot de passe renforcée (douze caractères, trois classes), limitation des tentatives de connexion, six en-têtes de sécurité HTTP, journal de sécurité dédié.
- Confinement du service de fichiers contre la traversée de répertoires.

### Corrigé

- Vingt-cinq anomalies détectées, qualifiées et corrigées au cours du développement et de l'audit préparatoire au dossier BLOC 2 (détail en annexe D de ce dossier).

### Accessibilité

- Conformité aux critères vérifiés du RGAA 4.1 / WCAG 2.1 niveau AA sur les sept pages du parcours principal, y compris les pages authentifiées.

## Antérieur à 1.0.0 - développement initial (novembre 2025 - février 2026)

Socle applicatif (Next.js, Prisma, MongoDB, NextAuth), notifications push, thèmes personnalisables, gestion des sondages et des types d'événements, mise en place du harnais de tests initial. Cette période n'a pas fait l'objet d'un versionnage explicite.
