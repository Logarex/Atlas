export type VisitVisibility = "private" | "friends" | "public";

export type LocalVisit = {
  id: string;
  storeId: string;
  visitedOn: string;
  note?: string;
  visibility: VisitVisibility;
  createdAt: string;
  updatedAt: string;
};
