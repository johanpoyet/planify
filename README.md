# Planify

Application web de planification d'événements à calendrier partagé : créer un événement, inviter ses amis, décider ensemble par sondage et recevoir des notifications.

En ligne : [planify.johanpoyet.fr](https://planify.johanpoyet.fr)

## Stack

Next.js 16 · React 19 · TypeScript · Prisma + MongoDB · NextAuth · Tailwind CSS · Vitest

## Prérequis

- Node.js 22
- Une base MongoDB (locale ou Atlas)

## Installation

```bash
npm ci
cp .env.example .env      # puis renseigner les variables
npx prisma generate
```

## Lancer

```bash
npm run dev               # développement
npm run build && npm start  # production
```

## Vérifications

```bash
npm run lint       # analyse statique
npm run typecheck  # vérification des types
npm test           # tests unitaires
```

## Documentation

Le dossier technique complet (architecture, CI/CD, sécurité, accessibilité, cahier de recettes, manuels d'exploitation) se trouve dans [`dossier/`](dossier/).
