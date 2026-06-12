# Atlas Places

Atlas Places is a mobile application for discovering, tracking, and collecting Apple Stores around the world. It serves as both a worldwide map and a personal notebook for your retail visits.

**Atlas Places is built to last.** This is a 100% open-source, community-driven project. It relies on its users to enrich store details, add missing locations, and share photos. Because the app does not depend on a central paid database, it will live on as long as the community continues to use and update it.

## Features

- **World Map:** Explore hundreds of Apple Stores globally.
- **Track Visits:** Mark stores as visited, add the date, and save personal notes.
- **Store Details:** View historical context, architecture details, and photos.
- **Local First:** All your personal data (visits, private photos, notes) stays on your device. No tracking, no external database.
- **Community Driven:** Propose new stores, suggest edits, or submit photos directly from the app.
- **Export & Import:** Safely back up your visits and personal photos to a local file, and restore them anytime.

## Data & Photos

Store data is open source and managed in this repository under `packages/data/stores/`.
Public photos are hosted using GitHub Releases to keep the app lightweight and fast, without relying on third-party paid services.

## How to run the project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the mobile app:
   ```bash
   npm run mobile:start
   ```

## Contributing

Want to add a missing store or share a photo? Check out the [Contributing Guide](CONTRIBUTING.md) to learn how to help build the dataset.

## License

This project is dual-licensed to protect both the code and the data:

- **Code:** The application source code is licensed under the [GNU General Public License v3.0 (GPLv3)](LICENSE). Anyone is free to use, modify, and distribute the code, provided that all modifications are also released open-source under the GPLv3.
- **Data:** The store dataset (`packages/data`) is licensed under the [Open Data Commons Open Database License (ODbL) v1.0](packages/data/LICENSE-DATA). You are free to copy, distribute, and use the database, provided that you attribute the creators and share any modifications under the same license.
- **Photos:** Individual photos contributed to the project remain under the license specified in the data (usually CC-BY-4.0).

## Disclaimer

This is an unofficial student project. It is not affiliated with, sponsored by, or endorsed by Apple Inc. Apple, the Apple logo, and Apple Store are trademarks of Apple Inc., registered in the U.S. and other countries.
