import { supabase } from "@/lib/supabase";
import { createGithubIssue } from "@/lib/github";
import { getCurrentProfile } from "../social/socialApi";

export type StoreChangeDraft = {
  storeId?: string | null;
  type?: "store_correction" | "new_store";
  fieldPath?: string;
  proposedValue: string;
  sourceUrl: string;
  note?: string;
};

export type PhotoSubmissionDraft = {
  storeId: string;
  localUri: string;
  mimeType?: string | null;
  fileName?: string | null;
  caption?: string;
  takenOn?: string;
  license: "CC-BY-4.0" | "CC0-1.0";
  peopleVisible: boolean;
};

function fileExtension(fileName?: string | null, mimeType?: string | null) {
  const fromName = fileName?.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

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
- **Source**: ${draft.sourceUrl}
- **Note**: ${draft.note || "None"}
  `.trim();

  await createGithubIssue(title, body, ["contribution", draft.type === "new_store" ? "new-store" : "correction"]);
  return { success: true };
}

export async function submitPhoto(draft: PhotoSubmissionDraft) {
  const profile = await getCurrentProfile();
  const username = profile?.username || "anonymous";
  const userId = profile?.id || "anonymous";

  // Still use Supabase Storage for the binary data as it's the most reliable way to send images
  if (!supabase) throw new Error("Supabase not configured");

  const extension = fileExtension(draft.fileName, draft.mimeType);
  const storagePath = `${draft.storeId}/${userId}/${Date.now()}.${extension}`;
  const response = await fetch(draft.localUri);
  const bytes = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("photo-submissions")
    .upload(storagePath, bytes, {
      contentType: draft.mimeType ?? "image/jpeg",
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from("photo-submissions").getPublicUrl(storagePath);

  const title = `[PHOTO] Store ${draft.storeId}`;
  const body = `
### Photo contribution from @${username}

- **Store ID**: ${draft.storeId}
- **Caption**: ${draft.caption || "None"}
- **Date Taken**: ${draft.takenOn || "Unknown"}
- **License**: ${draft.license}
- **People Visible**: ${draft.peopleVisible ? "Yes" : "No"}

**Photo Link**: ${publicUrl}
  `.trim();

  await createGithubIssue(title, body, ["contribution", "photo"]);
  return { success: true };
}
