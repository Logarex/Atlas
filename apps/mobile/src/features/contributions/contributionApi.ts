import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import { ensureCommunityProfile } from "../social/socialApi";

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

function assertSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured yet.");
  }

  return supabase;
}

async function notifyDiscord(record: Record<string, unknown>) {
  const client = assertSupabase();
  await client.functions.invoke("notify-discord", {
    body: {
      record
    }
  });
}

function fileExtension(fileName?: string | null, mimeType?: string | null) {
  const fromName = fileName?.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export async function submitStoreChange(draft: StoreChangeDraft) {
  const client = assertSupabase();
  const profile = await ensureCommunityProfile();
  const payload = {
    fieldPath: draft.fieldPath?.trim() ?? "new_store",
    proposedValue: draft.proposedValue.trim()
  };

  const { data, error } = await client
    .from("change_requests")
    .insert({
      store_id: draft.storeId ?? null,
      submitted_by: profile.id,
      type: draft.type ?? "store_correction",
      payload,
      source_url: draft.sourceUrl.trim(),
      note: draft.note?.trim() || null
    })
    .select("id, status, type, store_id, submitted_by, source_url, payload")
    .single();

  if (error) throw error;
  await notifyDiscord(data as Record<string, unknown>);
  return data;
}

export async function submitPhoto(draft: PhotoSubmissionDraft) {
  const client = assertSupabase();
  const profile = await ensureCommunityProfile();
  const extension = fileExtension(draft.fileName, draft.mimeType);
  const storagePath = `${draft.storeId}/${profile.id}/${Date.now()}.${extension}`;
  const response = await fetch(draft.localUri);
  const bytes = await response.arrayBuffer();

  const { error: uploadError } = await client.storage
    .from("photo-submissions")
    .upload(storagePath, bytes, {
      contentType: draft.mimeType ?? "image/jpeg",
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data, error } = await client
    .from("photo_submissions")
    .insert({
      store_id: draft.storeId,
      submitted_by: profile.id,
      storage_path: storagePath,
      license: draft.license,
      caption: draft.caption?.trim() || null,
      taken_on: draft.takenOn || null,
      people_visible: draft.peopleVisible
    })
    .select("id, status, store_id, submitted_by, storage_path, license")
    .single();

  if (error) throw error;
  await notifyDiscord({ ...data, type: "photo_submission" } as Record<string, unknown>);
  return data;
}
