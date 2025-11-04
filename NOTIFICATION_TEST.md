# Test des Notifications Push - Planify

## 🎯 Objectif

Tester le système de notifications push de l'application Planify.

## 📋 Prérequis

1. **HTTPS ou localhost** : Les notifications push nécessitent une connexion sécurisée (HTTPS) ou localhost
2. **Navigateur compatible** : Chrome, Firefox, Edge, Safari (iOS 16.4+)
3. **Service Worker actif** : Le Service Worker doit être enregistré

## 🚀 Comment tester

### Étape 1 : Lancer l'application

```bash
npm run dev
```

### Étape 2 : Accéder à la page de test

1. Se connecter à l'application
2. Aller dans **Paramètres** (⚙️)
3. Descendre jusqu'à la section **"🔔 Test des notifications push"**

### Étape 3 : Autoriser les notifications

1. Cliquer sur le bouton **"Demander la permission"**
2. Accepter la demande de permission dans le navigateur
3. Le statut devrait passer à **"✓ Accordée"**

### Étape 4 : Envoyer une notification de test

1. Cliquer sur le bouton **"Envoyer une notification de test"**
2. Une notification devrait apparaître avec :
   - Titre : "Test de notification"
   - Message : "Ceci est une notification de test depuis Planify ! 🎉"
   - Icône de l'application

## 🔍 Vérifications

### Vérifier que le Service Worker est actif

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet **Application** (ou **Application** dans Chrome)
3. Dans le menu de gauche, cliquer sur **Service Workers**
4. Vérifier que `/sw.js` est enregistré et actif

### Vérifier les logs

Dans la console JavaScript, vous devriez voir :
- `Service Worker enregistré: ...`
- `Permission de notification: granted`
- `Notification envoyée: Test de notification`

## 🎨 Interface utilisateur

La section de test affiche :
- **Statut de la permission** avec un badge coloré :
  - 🟢 Vert : Permission accordée
  - 🔴 Rouge : Permission refusée
  - ⚪ Gris : Permission non demandée
- **Boutons d'action** selon le statut
- **Message d'information** sur l'utilité des notifications

## 🐛 Dépannage

### La permission est refusée

Si vous avez refusé la permission :
1. Cliquer sur l'icône de cadenas dans la barre d'adresse
2. Réinitialiser les permissions pour les notifications
3. Recharger la page
4. Redemander la permission

### Le Service Worker ne s'enregistre pas

1. Vérifier que vous êtes bien sur `localhost` ou `HTTPS`
2. Vérifier les logs dans la console
3. Supprimer le cache et recharger la page (Ctrl+Shift+R)
4. Vérifier dans DevTools > Application > Service Workers

### Les notifications n'apparaissent pas

1. Vérifier que les notifications ne sont pas bloquées au niveau système :
   - **Windows** : Paramètres > Système > Notifications
   - **macOS** : Préférences Système > Notifications
   - **Android** : Paramètres > Applications > Chrome/Firefox > Notifications
2. Vérifier que le mode "Ne pas déranger" n'est pas activé
3. Vérifier dans les paramètres du navigateur que les notifications sont autorisées

## 📱 Test sur mobile

Pour tester sur mobile :
1. Installer l'application (Ajouter à l'écran d'accueil)
2. Ouvrir l'application depuis l'écran d'accueil
3. Aller dans Paramètres et suivre les mêmes étapes

**Note** : Sur iOS, les notifications push nécessitent iOS 16.4+ et que l'application soit installée en mode standalone.

## 🔧 Fichiers modifiés

- `public/sw.js` : Service Worker avec gestion des notifications
- `lib/pwa.ts` : Fonctions utilitaires pour les notifications
- `components/NotificationTest.tsx` : Composant de test
- `app/settings/page.tsx` : Page des paramètres avec le composant de test
- `app/providers.tsx` : Enregistrement du Service Worker

## 🎯 Prochaines étapes

Une fois le test validé, vous pourrez :
1. Créer des notifications pour les rappels d'événements
2. Implémenter des notifications push serveur avec Web Push API
3. Ajouter des actions dans les notifications (accepter/refuser un événement)
4. Personnaliser les notifications par type d'événement
