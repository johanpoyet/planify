🧱 Fonctionnalités MVP
1. Authentification (NextAuth)

Login / inscription via email + mot de passe.

Possibilité d’ajouter une photo et un pseudo.

Déconnexion + gestion de session.

2. Tableau de bord / calendrier

Vue liste des événements à venir.

Vue calendrier (jour/semaine/mois).

Bouton “+” pour ajouter un événement :

titre, date, description, lieu.

visibilité : public / amis / privé.

3. Gestion des amis

Rechercher un ami par email ou pseudo.

Envoyer une demande d’amitié.

Accepter / refuser une demande.

Voir la liste de ses amis.

4. Partage et visibilité

Si l’utilisateur rend son calendrier public → visible à tous.

Si privé → visible seulement aux amis acceptés.

Sinon → uniquement à lui.

5. PWA installable

manifest.json + service-worker.js

Icône, splashscreen, nom court.

Installation possible depuis Chrome / Safari mobile.



🌐 5. Routes principales (App Router)
Route	Description
/	Page d’accueil (tableau de bord)
/auth/login	Connexion
/auth/register	Inscription
/events	Liste / calendrier des événements
/events/new	Création d’un événement
/events/[id]	Détails d’un événement
/friends	Liste et gestion des amis
/api/events/*	CRUD des événements
/api/friends/*	Ajout / suppression / acceptation d’amis


🧭 6. Roadmap MVP
Étape	Fonctionnalité	Outils clés
1	Auth + User model	NextAuth + Prisma
2	CRUD des événements	Prisma + API routes
3	Gestion des amis	Prisma relations
4	UI responsive + PWA	Tailwind + manifest
5	Finitions UX	Dark mode, icônes, etc.