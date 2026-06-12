# Atlas

Atlas est une application mobile permettant de découvrir, de suivre et de collectionner les Apple Stores du monde entier. Elle sert à la fois de carte mondiale et de carnet de notes personnel pour vos visites en boutique.

**Atlas est conçu pour durer.** Il s'agit d'un projet 100 % open-source, dirigé par la communauté. Il s'appuie sur ses utilisateurs pour enrichir les détails des boutiques, ajouter les emplacements manquants et partager des photos. Étant donné que l'application ne dépend d'aucune base de données centrale payante, elle continuera d'exister tant que la communauté continuera de l'utiliser et de la mettre à jour.

## Fonctionnalités

- **Carte du monde :** Explorez des centaines d'Apple Stores à travers le monde.
- **Suivi des visites :** Marquez les boutiques comme visitées, ajoutez la date et enregistrez des notes personnelles.
- **Détails des boutiques :** Affichez le contexte historique, les détails architecturaux et des photos.
- **Local First (Local d'abord) :** Toutes vos données personnelles (visites, photos privées, notes) restent sur votre appareil. Aucun suivi, aucune base de données externe.
- **Géré par la communauté :** Proposez de nouvelles boutiques, suggérez des modifications ou soumettez des photos directement depuis l'application.
- **Exportation et Importation :** Sauvegardez en toute sécurité vos visites et vos photos personnelles dans un fichier local, et restaurez-les à tout moment.

## Données et Photos

Les données des boutiques sont open source et gérées dans ce dépôt sous `packages/data/stores/`.
Les photos publiques sont hébergées à l'aide des versions (Releases) GitHub afin de garder l'application légère et rapide, sans dépendre de services tiers payants.

## Comment exécuter le projet

1. Installez les dépendances :
   ```bash
   npm install
   ```

2. Démarrez l'application mobile :
   ```bash
   npm run mobile:start
   ```

## Contribution

Vous souhaitez ajouter une boutique manquante ou partager une photo ? Consultez le [Guide de contribution](../../CONTRIBUTING.md) pour apprendre comment aider à construire le jeu de données.

## Licence

Ce projet est sous double licence pour protéger à la fois le code et les données :

- **Code :** Le code source de l'application est sous licence [GNU General Public License v3.0 (GPLv3)](../../LICENSE). Toute personne est libre d'utiliser, de modifier et de distribuer le code, à condition que toutes les modifications soient également publiées en open-source sous la GPLv3.
- **Données :** Le jeu de données des boutiques (`packages/data`) est sous licence [Open Data Commons Open Database License (ODbL) v1.0](../../packages/data/LICENSE-DATA). Vous êtes libre de copier, distribuer et utiliser la base de données, à condition de mentionner les créateurs et de partager toute modification sous la même licence.
- **Photos :** Les photos individuelles contribuées au projet restent sous la licence spécifiée dans les données (généralement CC-BY-4.0).

## Avertissement

Ceci est un projet étudiant non officiel. Il n'est pas affilié, sponsorisé ou approuvé par Apple Inc. Apple, le logo Apple et Apple Store sont des marques commerciales d'Apple Inc., déposées aux États-Unis et dans d'autres pays.
