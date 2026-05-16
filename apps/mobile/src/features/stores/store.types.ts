export type StoreStatus =
  | "open"
  | "closed"
  | "relocated"
  | "announced"
  | "temporary";

export type AttributeValue = "yes" | "no" | "unknown";

export type StoreSource = {
  label: string;
  url: string;
  license: string;
};

export type StoreRecord = {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  status: StoreStatus;
  city: string;
  countryCode: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  openedOn: string;
  officialUrl: string;
  architecture: {
    era: string;
    attributes: {
      boardroom: AttributeValue;
      greenWall: AttributeValue;
      forum: AttributeValue;
      glassCube: AttributeValue;
      plaza: AttributeValue;
    };
  };
  sources: StoreSource[];
  lastVerifiedAt: string;
};
