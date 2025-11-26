# Guide d'Utilisation - Composants de Formulaire avec Validation

## 📋 Vue d'ensemble

Un système complet de validation de formulaires a été créé avec :
- ✅ Composants réutilisables (`Input`, `Textarea`, `Select`)
- ✅ Validation avec Zod
- ✅ Hook personnalisé `useFormValidation`
- ✅ Schémas de validation prédéfinis

## 🚀 Installation

Tout est déjà configuré ! Les dépendances nécessaires sont déjà installées :
- `zod` pour la validation
- `lucide-react` pour les icônes

## 📦 Composants Disponibles

### 1. Input

Composant d'input texte avec validation intégrée.

```tsx
import { Input } from "@/components/forms";

<Input
  label="Matricule"
  value={formData.matricule}
  onChange={(e) => setValue("matricule", e.target.value)}
  onBlur={() => setFieldTouched("matricule")}
  error={errors.matricule}
  required
  placeholder="Ex: AG001"
  helperText="Le matricule doit être unique"
/>
```

**Props disponibles :**
- `label` : Label du champ
- `error` : Message d'erreur à afficher
- `helperText` : Texte d'aide (affiché si pas d'erreur)
- `required` : Affiche un astérisque rouge
- `fullWidth` : Prend toute la largeur (par défaut: true)
- Toutes les props HTML standard d'un `<input>`

### 2. Textarea

Composant textarea avec validation intégrée.

```tsx
import { Textarea } from "@/components/forms";

<Textarea
  label="Description"
  value={formData.description}
  onChange={(e) => setValue("description", e.target.value)}
  onBlur={() => setFieldTouched("description")}
  error={errors.description}
  rows={4}
  placeholder="Décrivez..."
/>
```

### 3. Select

Composant select avec validation intégrée.

```tsx
import { Select } from "@/components/forms";

<Select
  label="Sexe"
  value={formData.sexe}
  onChange={(e) => setValue("sexe", e.target.value)}
  onBlur={() => setFieldTouched("sexe")}
  error={errors.sexe}
  required
  options={[
    { value: "M", label: "Masculin" },
    { value: "F", label: "Féminin" },
  ]}
  placeholder="Sélectionnez..."
/>
```

## 🎣 Hook useFormValidation

Hook personnalisé pour gérer la validation de formulaires.

```tsx
import { useFormValidation } from "@/hooks/useFormValidation";
import { agentFormSchema } from "@/lib/validation/schemas";

const {
  values,           // Valeurs actuelles du formulaire
  errors,           // Erreurs de validation
  touched,          // Champs qui ont été touchés
  setValue,         // Fonction pour mettre à jour une valeur
  setFieldTouched,  // Marquer un champ comme touché
  validateField,    // Valider un champ spécifique
  validateForm,     // Valider tout le formulaire
  reset,            // Réinitialiser le formulaire
  clearErrors,      // Effacer toutes les erreurs
  getFieldError,    // Obtenir l'erreur d'un champ
  hasFieldError,    // Vérifier si un champ a une erreur
  isValid,          // Vérifier si le formulaire est valide
} = useFormValidation(agentFormSchema, initialValues);
```

## 📝 Exemple Complet

```tsx
"use client";

import { useState } from "react";
import { Input, Textarea, Select } from "@/components/forms";
import { useFormValidation } from "@/hooks/useFormValidation";
import { agentFormSchema, type AgentFormData } from "@/lib/validation/schemas";

export function AgentFormExample() {
  const initialValues: AgentFormData = {
    matricule: "",
    nom_complet: "",
    email: "",
    fonction: "",
    date_naissance: "",
    lieu_naissance: "",
    sexe: "M",
    situationMatrimoniale: "Célibataire",
    adresse: "",
    telephone: "",
    password: "",
  };

  const {
    values,
    errors,
    setValue,
    setFieldTouched,
    validateForm,
  } = useFormValidation(agentFormSchema, initialValues);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Formulaire valide:", values);
      // Envoyer au serveur
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Matricule"
        value={values.matricule}
        onChange={(e) => setValue("matricule", e.target.value)}
        onBlur={() => setFieldTouched("matricule")}
        error={errors.matricule}
        required
      />

      <Input
        type="email"
        label="Email"
        value={values.email}
        onChange={(e) => setValue("email", e.target.value)}
        onBlur={() => setFieldTouched("email")}
        error={errors.email}
      />

      <button type="submit">Soumettre</button>
    </form>
  );
}
```

## 🔧 Schémas de Validation Disponibles

Tous les schémas sont dans `src/lib/validation/schemas.ts` :

- `agentFormSchema` - Validation pour les agents
- `rubriqueFormSchema` - Validation pour les rubriques
- `sousDossierFormSchema` - Validation pour les sous-dossiers
- `pieceFormSchema` - Validation pour les pièces
- `metadataFormSchema` - Validation pour les métadonnées

### Schémas individuels :

- `emailSchema` - Validation d'email
- `phoneSchema` - Validation de téléphone
- `passwordSchema` - Validation de mot de passe (min 6 caractères)
- `matriculeSchema` - Validation de matricule
- `nameSchema` - Validation de nom
- `dateSchema` - Validation de date
- `urlSchema` - Validation d'URL
- `textSchema` - Validation de texte générique
- `descriptionSchema` - Validation de description

## 🎨 Personnalisation

### Styles personnalisés

Vous pouvez passer des classes CSS personnalisées :

```tsx
<Input
  className="custom-class"
  // ...
/>
```

### Validation personnalisée

Créez vos propres schémas Zod :

```tsx
import { z } from "zod";

const customSchema = z.object({
  champ1: z.string().min(5, "Minimum 5 caractères"),
  champ2: z.number().positive("Doit être positif"),
});

const { values, errors, setValue } = useFormValidation(customSchema, {
  champ1: "",
  champ2: 0,
});
```

## 🔄 Migration des Formulaires Existants

### Avant (validation manuelle)

```tsx
const [errors, setErrors] = useState({});

const validateForm = () => {
  const newErrors = {};
  if (!formData.matricule.trim()) {
    newErrors.matricule = "Le matricule est requis";
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Après (avec Zod)

```tsx
import { useFormValidation } from "@/hooks/useFormValidation";
import { agentFormSchema } from "@/lib/validation/schemas";

const {
  values,
  errors,
  setValue,
  validateForm,
} = useFormValidation(agentFormSchema, initialValues);

// validateForm() est maintenant automatique avec Zod !
```

## ✅ Bonnes Pratiques

1. **Toujours utiliser `onBlur` avec `setFieldTouched`** pour valider quand l'utilisateur quitte le champ
2. **Utiliser `validateForm()` avant la soumission** pour valider tout le formulaire
3. **Afficher les erreurs uniquement pour les champs touchés** (géré automatiquement)
4. **Utiliser les schémas prédéfinis** quand possible pour la cohérence
5. **Ajouter `helperText`** pour guider l'utilisateur

## 🐛 Dépannage

### L'erreur ne s'affiche pas

Vérifiez que vous avez appelé `setFieldTouched` dans `onBlur` :

```tsx
<Input
  onBlur={() => setFieldTouched("champ")}
  // ...
/>
```

### La validation ne fonctionne pas

Vérifiez que vous utilisez le bon schéma :

```tsx
// ✅ Correct
const { values, errors } = useFormValidation(agentFormSchema, initialValues);

// ❌ Incorrect - schéma non défini
const { values, errors } = useFormValidation(undefined, initialValues);
```

### Les types TypeScript ne correspondent pas

Assurez-vous que les types correspondent au schéma :

```tsx
import { agentFormSchema, type AgentFormData } from "@/lib/validation/schemas";

const initialValues: AgentFormData = {
  // ...
};
```

## 📚 Ressources

- [Documentation Zod](https://zod.dev/)
- [React Hook Form avec Zod](https://react-hook-form.com/get-started#SchemaValidation)
- Exemple complet : `src/components/forms/FormExample.tsx`

