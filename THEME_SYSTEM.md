# Système de personnalisation du thème

Le système de personnalisation du thème a été ajouté avec succès ! 🎨

## Modifications apportées :

### 1. Base de données
- ✅ Ajout du champ `themeColor` dans le modèle `User` (Prisma)
- Valeurs possibles : `blue`, `purple`, `emerald`, `rose`, `pink`, `orange`, `amber`

### 2. Bibliothèques
- ✅ `/lib/theme.ts` : Configuration des couleurs de thème
- ✅ `/lib/themeContext.tsx` : Context React pour gérer le thème
- ✅ Variables CSS dynamiques dans `globals.css`
- ✅ Classes Tailwind personnalisées dans `tailwind.config.js`

### 3. API
- ✅ `/api/user/theme/route.ts` : API pour sauvegarder et récupérer le thème

### 4. Composants
- ✅ `ThemeSelector` : Interface de sélection de couleur
- ✅ Intégration dans la page Settings
- ✅ ThemeProvider dans le layout

## Prochaines étapes :

⚠️ **IMPORTANT** : Pour que le système fonctionne complètement, il faut :

1. **Redémarrer le serveur dev** pour que Prisma régénère le client avec le nouveau champ
2. **Remplacer les classes Tailwind hardcodées** par les classes dynamiques `bg-theme-primary`, `text-theme-primary-light`, etc.

## Utilisation :

### Dans les composants :
```tsx
import { useTheme } from '@/lib/themeContext';

const { themeColor, primaryColor } = useTheme();

// Avec style inline (pour les couleurs de fond dynamiques)
<button style={{ backgroundColor: primaryColor }}>
  Bouton
</button>

// Ou avec les classes Tailwind personnalisées
<button className="bg-theme-primary hover:bg-theme-primary-hover">
  Bouton
</button>
```

### Couleurs disponibles :
- 🔵 Bleu (blue-600)
- 🟣 Violet (purple-600)
- 🟢 Vert (emerald-600)
- 🌹 Rose (rose-600)
- 💖 Rose vif (pink-600)
- 🟠 Orange (orange-600)
- 🟡 Ambre (amber-600)

## Test :
1. Va dans Settings > Apparence
2. Clique sur une couleur
3. La couleur sera sauvegardée et appliquée !

---

**Note** : Le client Prisma doit être régénéré. Redémarre le serveur avec `npm run dev` après avoir fermé le serveur actuel.
