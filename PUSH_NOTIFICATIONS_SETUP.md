# Configuration des Notifications Push

Ce guide explique comment configurer les notifications push pour Planify.

## 1. Générer les clés VAPID

Les clés VAPID sont nécessaires pour envoyer des notifications push. Générez-les avec la commande suivante :

```bash
npx web-push generate-vapid-keys
```

Cette commande génère deux clés :
- **Public Key** : à placer dans `VAPID_PUBLIC_KEY`
- **Private Key** : à placer dans `VAPID_PRIVATE_KEY`

## 2. Configurer les variables d'environnement

Ajoutez les clés générées dans votre fichier `.env` :

```bash
VAPID_PUBLIC_KEY="votre_cle_publique"
VAPID_PRIVATE_KEY="votre_cle_privee"
```

## 3. Mettre à jour la base de données

Générez le client Prisma avec le nouveau modèle `PushSubscription` :

```bash
npx prisma generate
npx prisma db push
```

**Note :** Si vous obtenez une erreur de permission lors de `prisma generate`, fermez votre serveur de développement et réessayez.

## 4. Fonctionnement

### Côté utilisateur

1. L'utilisateur active les notifications dans **Paramètres > Notifications**
2. Le navigateur demande la permission d'envoyer des notifications
3. L'abonnement push est enregistré dans la base de données

### Côté serveur

Quand un événement déclenche une notification (demande d'ami ou invitation à un événement) :

1. Le serveur récupère tous les abonnements push de l'utilisateur cible
2. Une notification est envoyée à chaque appareil/navigateur abonné
3. Les abonnements invalides sont automatiquement supprimés

### Types de notifications

- **👋 Demande d'ami** : Notification envoyée quand quelqu'un vous envoie une demande d'ami
  - Clic → redirige vers `/friends`
  
- **📅 Invitation à un événement** : Notification envoyée quand vous êtes invité à un événement
  - Clic → redirige vers `/events/invitations`

## 5. Test en développement

1. Activez les notifications dans les paramètres
2. Ouvrez une fenêtre de navigation privée
3. Connectez-vous avec un autre compte
4. Envoyez une demande d'ami ou invitez à un événement
5. Vous devriez recevoir une notification sur le premier compte

## 6. Service Worker

Le service worker (`public/sw.js`) gère :
- La réception des notifications push
- L'affichage des notifications
- La navigation lors du clic sur une notification

## 7. Navigateurs supportés

Les notifications push sont supportées sur :
- ✅ Chrome (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Edge
- ✅ Safari (macOS 16.4+, iOS/iPadOS 16.4+ en PWA uniquement)
- ❌ Safari iOS (navigation web standard)

## 8. Déploiement en production

### Vercel

Ajoutez les variables d'environnement dans le dashboard Vercel :
1. Allez dans Settings > Environment Variables
2. Ajoutez `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY`
3. Redéployez l'application

### HTTPS requis

Les notifications push nécessitent HTTPS en production (localhost fonctionne en HTTP pour le développement).

## 9. Dépannage

### Les notifications ne s'affichent pas

1. Vérifiez que les clés VAPID sont configurées
2. Vérifiez que les permissions de notification sont accordées dans le navigateur
3. Ouvrez la console du service worker : DevTools > Application > Service Workers
4. Vérifiez les logs dans la console pour voir les erreurs

### Erreur "No subscriptions found"

L'utilisateur n'a pas activé les notifications. Demandez-lui d'aller dans Paramètres > Notifications.

### Les clics sur les notifications ne fonctionnent pas

Vérifiez que le service worker est correctement enregistré et actif.
