export type StoreStatus =
  | "open"
  | "closed"
  | "relocated"
  | "announced"
  | "temporary";

export type AttributeValue = "yes" | "no" | "unknown";

export type ArchitectureAttribute =
  | "avenue"
  | "boardroom"
  | "forum"
  | "geniusBar"
  | "glassCube"
  | "greenWall"
  | "historicFacade"
  | "plaza"
  | "videoWall";

export type StoreSource = {
  type?: string;
  label: string;
  url: string;
  license: string;
  fields?: string[];
  verifiedAt?: string;
};

export type StoreHours = {
  policy: "official-link-only" | "community-verified";
  officialUrl: string;
  lastVerifiedAt?: string | null;
  note?: string;
};

export type StorePhoto = {
  id: string;
  url: string;
  credit: string;
  license: string;
  caption?: string;
  takenOn?: string | null;
};

export type StoreRecord = {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  status: StoreStatus;
  city: string;
  region?: string;
  countryCode: string;
  countryName?: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  openedOn: string | null;
  closedOn?: string | null;
  officialUrl: string;
  architecture: {
    era: string;
    typology?: string;
    attributes: {
      [key in ArchitectureAttribute]?: AttributeValue;
    };
    notes?: string[];
  };
  hours: StoreHours;
  photos?: StorePhoto[];
  sources: StoreSource[];
  lastVerifiedAt: string;
};
