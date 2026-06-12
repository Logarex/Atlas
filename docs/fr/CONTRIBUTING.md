# Contribuer à Atlas

Merci de vouloir apporter votre aide. Ce document couvre tout ce dont vous avez besoin pour ajouter ou mettre à jour les données et les photos des boutiques.

---

## Données des boutiques

Toutes les boutiques se trouvent sous forme de fichiers JSON individuels dans `packages/data/stores/`. Chaque fichier est nommé `apple-[store-id].json`.

### Ajouter ou modifier une boutique

1. Trouvez le fichier existant, ou créez-en un nouveau en utilisant un fichier existant comme référence.
2. Remplissez les champs. Les champs obligatoires sont `id`, `name`, `status`, `city`, `countryCode` et `address`.
3. Exécutez le script de validation depuis la racine du dépôt pour détecter d'éventuelles erreurs :

```bash
npm run data:validate
```

4. Régénérez le bundle mobile pour que l'application prenne en compte vos modifications :

```bash
npm run mobile:generate-stores
```

5. Ouvrez une "pull request". Une courte description de ce que vous avez modifié suffit.

---

## Photos

### Où sont stockées les photos

Les photos publiques des boutiques se trouvent dans `apps/mobile/assets/stores/`. Elles sont servies aux utilisateurs via **GitHub Releases** — téléversez le fichier en tant qu'actif ("asset") d'une "release", puis référencez son URL dans le JSON de la boutique. Cela permet de garder le bundle de l'application léger tout en utilisant le CDN de GitHub (Fastly) pour une distribution rapide.

### Ajouter une photo

1. Prenez ou trouvez une photo qui vous appartient ou qui est sous licence Creative Commons ou équivalente.
2. Exportez-la au format **WebP**, avec une taille d'environ 1200 px sur le côté le plus long. Gardez le fichier sous 500 Ko si possible.
3. Pour une miniature (affichée sur la carte de la boutique avant de cliquer sur les détails), exportez une deuxième version d'environ 400 px de large et nommez-la avec le suffixe `-thumb`.
4. Téléversez les deux fichiers dans la "Release" GitHub [`store-photos`](https://github.com/Logarex/Atlas/releases).
5. Copiez l'URL de téléchargement pour chaque fichier à partir de la liste des actifs de la "release".
6. Ajoutez une entrée pour la photo dans le fichier JSON de la boutique :

```json
{
  "id": "apple-store-name-1",
  "url": "https://github.com/Logarex/Atlas/releases/download/store-photos/apple-store-name-1.webp",
  "thumbUrl": "https://github.com/Logarex/Atlas/releases/download/store-photos/apple-store-name-1-thumb.webp",
  "credit": "Votre nom",
  "license": "CC-BY-4.0",
  "caption": "Courte description de la photo",
  "takenOn": "YYYY-MM-DD"
}
```

7. Exécutez `npm run mobile:generate-stores` et ouvrez une "pull request".

### Directives pour les photos

- Ne soumettez que des photos que vous avez prises vous-même ou qui sont clairement libres de droits.
- Remplissez toujours les champs `credit` et `license`.
- Évitez les photos avec des personnes reconnaissables à moins d'avoir leur consentement — et définissez `"peopleVisible": true` dans le formulaire de contribution de l'application si vous la soumettez via l'application.

---

## Contributions via l'application

L'application intègre des formulaires pour suggérer des corrections et soumettre des photos. Ceux-ci créent des "issues" GitHub que les mainteneurs examinent avant de fusionner quoi que ce soit dans le jeu de données.

---

## Questions

Ouvrez une "issue" GitHub si quelque chose n'est pas clair ou si vous rencontrez un problème.
