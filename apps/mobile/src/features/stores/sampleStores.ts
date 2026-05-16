import type { StoreRecord } from "./store.types";

export const sampleStores: StoreRecord[] = [
  {
    id: "apple-fifth-avenue",
    name: {
      en: "Apple Fifth Avenue",
      fr: "Apple Fifth Avenue"
    },
    status: "open",
    city: "New York",
    countryCode: "US",
    address: "767 Fifth Avenue, New York, NY 10153",
    coordinates: {
      latitude: 40.763831,
      longitude: -73.972981
    },
    openedOn: "2006-05-19",
    officialUrl: "https://www.apple.com/retail/fifthavenue/",
    architecture: {
      era: "glass-cube-flagship",
      attributes: {
        boardroom: "unknown",
        greenWall: "unknown",
        forum: "yes",
        glassCube: "yes",
        plaza: "yes"
      }
    },
    sources: [
      {
        label: "Apple official store page",
        url: "https://www.apple.com/retail/fifthavenue/",
        license: "reference_only"
      },
      {
        label: "Apple Newsroom opening announcement",
        url: "https://www.apple.com/newsroom/2006/05/18The-Apple-Store-Fifth-Avenue-to-Open-on-Friday-May-19/",
        license: "reference_only"
      }
    ],
    lastVerifiedAt: "2026-05-16"
  }
];
