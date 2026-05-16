import type { StoreRecord } from "./store.types";


const appleReferenceLicense = "reference_only";

export const sampleStores: StoreRecord[] = [
  {
    id: "apple-fifth-avenue",
    name: {
      en: "Apple Fifth Avenue",
      fr: "Apple Fifth Avenue"
    },
    status: "open",
    city: "New York",
    region: "New York",
    countryCode: "US",
    countryName: "United States",
    address: "767 Fifth Avenue, New York, NY 10153",
    coordinates: {
      latitude: 40.76383,
      longitude: -73.97298
    },
    openedOn: "2006-05-19",
    closedOn: null,
    officialUrl: "https://www.apple.com/retail/fifthavenue/",
    architecture: {
      era: "Glass Cube Flagship",
      typology: "Urban flagship",
      attributes: {
        boardroom: "unknown",
        forum: "yes",
        geniusBar: "yes",
        glassCube: "yes",
        greenWall: "unknown",
        plaza: "yes",
        videoWall: "yes"
      },
      notes: [
        "Flagship below a public plaza with the distinctive Fifth Avenue glass cube entrance."
      ]
    },
    hours: {
      policy: "official-link-only",
      officialUrl: "https://www.apple.com/retail/fifthavenue/",
      lastVerifiedAt: null,
      note: "Hours change often. Verify on the official Apple page before visiting."
    },
    photos: [],
    sources: [
      {
        type: "apple_official_page",
        label: "Apple official store page",
        url: "https://www.apple.com/retail/fifthavenue/",
        license: appleReferenceLicense,
        fields: ["name", "address", "officialUrl", "hours.officialUrl"],
        verifiedAt: "2026-05-16"
      },
      {
        type: "apple_newsroom",
        label: "Apple Newsroom opening announcement",
        url: "https://www.apple.com/newsroom/2006/05/18The-Apple-Store-Fifth-Avenue-to-Open-on-Friday-May-19/",
        license: appleReferenceLicense,
        fields: ["openedOn", "architecture.attributes.glassCube"],
        verifiedAt: "2026-05-16"
      }
    ],
    lastVerifiedAt: "2026-05-16"
  },
  {
    id: "apple-tysons-corner",
    name: {
      en: "Apple Tysons Corner",
      fr: "Apple Tysons Corner"
    },
    status: "open",
    city: "Tysons",
    region: "Virginia",
    countryCode: "US",
    countryName: "United States",
    address: "1961 Chain Bridge Rd, Tysons, VA 22102",
    coordinates: {
      latitude: 38.917624,
      longitude: -77.221469
    },
    openedOn: "2001-05-19",
    closedOn: null,
    officialUrl: "https://www.apple.com/retail/tysonscorner/",
    architecture: {
      era: "Original Retail",
      typology: "Mall store",
      attributes: {
        boardroom: "unknown",
        forum: "yes",
        geniusBar: "yes",
        glassCube: "no",
        greenWall: "unknown",
        plaza: "no",
        videoWall: "yes"
      },
      notes: ["One of the first two Apple retail stores opened in 2001."]
    },
    hours: {
      policy: "official-link-only",
      officialUrl: "https://www.apple.com/retail/tysonscorner/",
      lastVerifiedAt: null,
      note: "Hours change often. Verify on the official Apple page before visiting."
    },
    photos: [],
    sources: [
      {
        type: "apple_official_page",
        label: "Apple official store page",
        url: "https://www.apple.com/retail/tysonscorner/",
        license: appleReferenceLicense,
        fields: ["name", "address", "officialUrl", "hours.officialUrl"],
        verifiedAt: "2026-05-16"
      }
    ],
    lastVerifiedAt: "2026-05-16"
  },
  {
    id: "apple-champs-elysees",
    name: {
      en: "Apple Champs-Elysees",
      fr: "Apple Champs-Elysees"
    },
    status: "open",
    city: "Paris",
    region: "Ile-de-France",
    countryCode: "FR",
    countryName: "France",
    address: "114 avenue des Champs-Elysees, 75008 Paris",
    coordinates: {
      latitude: 48.872273,
      longitude: 2.301315
    },
    openedOn: "2018-11-18",
    closedOn: null,
    officialUrl: "https://www.apple.com/fr/retail/champs-elysees/",
    architecture: {
      era: "Town Square",
      typology: "Historic urban flagship",
      attributes: {
        avenue: "yes",
        boardroom: "yes",
        forum: "yes",
        geniusBar: "yes",
        glassCube: "no",
        greenWall: "yes",
        historicFacade: "yes",
        plaza: "no",
        videoWall: "yes"
      },
      notes: ["Paris flagship in a restored Haussmann-era building."]
    },
    hours: {
      policy: "official-link-only",
      officialUrl: "https://www.apple.com/fr/retail/champs-elysees/",
      lastVerifiedAt: null,
      note: "Hours change often. Verify on the official Apple page before visiting."
    },
    photos: [],
    sources: [
      {
        type: "apple_official_page",
        label: "Apple official store page",
        url: "https://www.apple.com/fr/retail/champs-elysees/",
        license: appleReferenceLicense,
        fields: ["name", "address", "officialUrl", "hours.officialUrl"],
        verifiedAt: "2026-05-16"
      }
    ],
    lastVerifiedAt: "2026-05-16"
  },
  {
    id: "apple-marina-bay-sands",
    name: {
      en: "Apple Marina Bay Sands",
      fr: "Apple Marina Bay Sands"
    },
    status: "open",
    city: "Singapore",
    region: "Central Region",
    countryCode: "SG",
    countryName: "Singapore",
    address: "2 Bayfront Avenue, B2-06, Singapore 018972",
    coordinates: {
      latitude: 1.283342,
      longitude: 103.857568
    },
    openedOn: "2020-09-10",
    closedOn: null,
    officialUrl: "https://www.apple.com/sg/retail/marinabaysands/",
    architecture: {
      era: "Town Square",
      typology: "Standalone pavilion",
      attributes: {
        boardroom: "yes",
        forum: "yes",
        geniusBar: "yes",
        glassCube: "no",
        greenWall: "unknown",
        historicFacade: "no",
        plaza: "yes",
        videoWall: "yes"
      },
      notes: ["Distinctive spherical store on Marina Bay."]
    },
    hours: {
      policy: "official-link-only",
      officialUrl: "https://www.apple.com/sg/retail/marinabaysands/",
      lastVerifiedAt: null,
      note: "Hours change often. Verify on the official Apple page before visiting."
    },
    photos: [],
    sources: [
      {
        type: "apple_official_page",
        label: "Apple official store page",
        url: "https://www.apple.com/sg/retail/marinabaysands/",
        license: appleReferenceLicense,
        fields: ["name", "address", "officialUrl", "hours.officialUrl"],
        verifiedAt: "2026-05-16"
      },
      {
        type: "apple_newsroom",
        label: "Apple Newsroom opening article",
        url: "https://www.apple.com/newsroom/2020/09/apple-marina-bay-sands-opens-thursday-in-singapore/",
        license: appleReferenceLicense,
        fields: ["openedOn", "architecture.typology"],
        verifiedAt: "2026-05-16"
      }
    ],
    lastVerifiedAt: "2026-05-16"
  }
];
