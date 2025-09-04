# Système de Design Tokens

Ce système permet de changer facilement les couleurs de l'application de manière centralisée.

## 🎨 Comment changer le thème

### Méthode 1 : Via le composant ThemeSwitcher

Ajoutez le composant `ThemeSwitcher` dans votre interface :

```tsx
import ThemeSwitcher from "@/components/ThemeSwitcher";

// Dans votre composant
<ThemeSwitcher />;
```

### Méthode 2 : Via le code

```tsx
import { applyTheme } from "@/styles/theme-utils";

// Changer vers le thème blue
applyTheme("blue");
```

### Méthode 3 : Via les variables CSS

Modifiez le fichier `src/styles/design-tokens.css` et décommentez le thème souhaité :

```css
/* Thème Blue */
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
}
```

## 🛠 Utilisation dans les composants

### Classes CSS personnalisées

```tsx
// Au lieu de bg-slate-700, utilisez :
<div className="bg-primary-700">

// Au lieu de text-slate-600, utilisez :
<span className="text-primary-600">

// Au lieu de border-slate-300, utilisez :
<div className="border-primary-300">
```

### Classes utilitaires

```tsx
// Gradients
<div className="bg-gradient-primary">

// Ombres
<div className="shadow-primary">

// Hover states
<button className="bg-primary-700 hover:bg-primary-800">
```

## 🎯 Thèmes disponibles

- **Slate** (actuel) : Couleurs grises élégantes
- **Blue** : Couleurs bleues professionnelles
- **Emerald** : Couleurs vertes naturelles
- **Purple** : Couleurs violettes créatives

## 📝 Migration des composants existants

Pour migrer un composant existant :

1. Remplacez `slate-` par `primary-` dans les classes Tailwind
2. Utilisez les classes personnalisées pour les gradients et ombres
3. Testez avec différents thèmes

### Exemple de migration :

```tsx
// Avant
<div className="bg-slate-700 text-white border-slate-300">

// Après
<div className="bg-primary-700 text-white border-primary-300">
```

## 🔧 Ajouter un nouveau thème

1. Ajoutez le thème dans `src/styles/theme-utils.ts` :

```tsx
export const themes: Record<ThemeName, Theme> = {
  // ... thèmes existants
  orange: {
    name: "Orange",
    colors: {
      50: "#fff7ed",
      100: "#ffedd5",
      // ... autres nuances
    },
  },
};
```

2. Ajoutez les variables CSS dans `src/styles/design-tokens.css` :

```css
/* Thème Orange */
:root {
  --color-primary-50: #fff7ed;
  --color-primary-100: #ffedd5;
  // ... autres variables
}
```

3. Mettez à jour le type `ThemeName` dans `theme-utils.ts`

## 💡 Bonnes pratiques

- Utilisez toujours les classes `primary-*` au lieu des couleurs spécifiques
- Testez vos composants avec différents thèmes
- Gardez les couleurs de statut (success, warning, error) inchangées
- Utilisez les classes utilitaires pour les gradients et ombres
