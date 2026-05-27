import { createGithubIssue } from "@/lib/github";
import { getCurrentProfile } from "../social/socialApi";

export const DEFAULT_PHOTO_LICENSE = "CC-BY-4.0" as const;

export type StoreChangeDraft = {
  storeId?: string | null;
  type?: "store_correction" | "new_store";
  fieldPath?: string;
  proposedValue: string;
  note?: string;
};

export type PhotoSubmissionDraft = {
  storeId: string;
  localUri: string;
  mimeType?: string | null;
  fileName?: string | null;
  caption?: string;
  creditName?: string;
  takenOn?: string;
  license?: typeof DEFAULT_PHOTO_LICENSE;
  peopleVisible: boolean;
};

export async function submitStoreChange(draft: StoreChangeDraft) {
  const profile = await getCurrentProfile();
  const username = profile?.username || "anonymous";
  
  const title = draft.type === "new_store" 
    ? `[NEW STORE] ${draft.proposedValue}`
    : `[CORRECTION] Store ${draft.storeId}`;
    
  const body = `
### Contribution from @${username}

- **Store ID**: ${draft.storeId || "New Store"}
- **Type**: ${draft.type}
- **Field**: ${draft.fieldPath || "N/A"}
- **Proposed Value**: ${draft.proposedValue}
- **Note**: ${draft.note || "None"}
  `.trim();

  await createGithubIssue(title, body, ["contribution", draft.type === "new_store" ? "new-store" : "correction"]);
  return { success: true };
}

export async function submitPhoto(draft: PhotoSubmissionDraft) {
  const profile = await getCurrentProfile();
  const username = profile?.username || "anonymous";
  const license = draft.license ?? DEFAULT_PHOTO_LICENSE;

  const title = `[PHOTO] Store ${draft.storeId}`;
  const body = `
### Photo contribution from @${username}

- **Store ID**: ${draft.storeId}
- **Credit / display name**: ${draft.creditName || username}
- **Caption**: ${draft.caption || "None"}
- **Date Taken**: ${draft.takenOn || "Unknown"}
- **License**: ${license}
- **People Visible**: ${draft.peopleVisible ? "Yes" : "No"}
- **Original file name**: ${draft.fileName || "Unknown"}
- **MIME type**: ${draft.mimeType || "Unknown"}

The photo was selected locally in the app. Atlas no longer stores uploads remotely, so maintainers should request the image file from the contributor before review.
  `.trim();

  await createGithubIssue(title, body, ["contribution", "photo"]);
  return { success: true };
}
