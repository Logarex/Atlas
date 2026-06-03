import { createGithubIssue, uploadGithubFile } from "@/lib/github";
import * as ImageManipulator from "expo-image-manipulator";
import { getCurrentProfile } from "../social/socialApi";

export const DEFAULT_PHOTO_LICENSE = "CC-BY-4.0" as const;

const maxUploadedPhotoBase64Length = 850_000;
const embeddedPhotoVariants = [
  { maxDimension: 1200, quality: 0.74 },
  { maxDimension: 960, quality: 0.68 },
  { maxDimension: 720, quality: 0.58 },
  { maxDimension: 520, quality: 0.5 }
];

export type StoreChangeDraft = {
  storeId?: string | null;
  type?: "store_correction" | "new_store";
  fieldPath?: string;
  proposedValue: string;
  note?: string;
  contributorName?: string;
};

export type PhotoSubmissionDraft = {
  storeId: string;
  localUri: string;
  mimeType?: string | null;
  fileName?: string | null;
  caption?: string;
  creditName?: string;
  contributorName?: string;
  width?: number | null;
  height?: number | null;
  takenOn?: string;
  license?: typeof DEFAULT_PHOTO_LICENSE;
  peopleVisible: boolean;
};

function cleanContributorName(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "";
}

function contributorLabel(
  providedName: string | null | undefined,
  profile: Awaited<ReturnType<typeof getCurrentProfile>>
) {
  const cleanedName = cleanContributorName(providedName);
  if (cleanedName) return cleanedName;
  if (profile?.displayName) return profile.displayName;
  if (profile?.username) return `@${profile.username}`;
  return "anonymous";
}

function resizeActionForVariant(
  width: number | null | undefined,
  height: number | null | undefined,
  maxDimension: number
): ImageManipulator.Action[] {
  if (!width || !height) {
    return [{ resize: { width: maxDimension } }];
  }

  const largestDimension = Math.max(width, height);
  if (largestDimension <= maxDimension) return [];

  const scale = maxDimension / largestDimension;
  return [
    {
      resize: {
        height: Math.round(height * scale),
        width: Math.round(width * scale)
      }
    }
  ];
}

function sanitizePathPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function createEmbeddedPhotoAttachment(draft: PhotoSubmissionDraft) {
  try {
    for (const variant of embeddedPhotoVariants) {
      const result = await ImageManipulator.manipulateAsync(
        draft.localUri,
        resizeActionForVariant(draft.width, draft.height, variant.maxDimension),
        {
          base64: true,
          compress: variant.quality,
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      if (!result.base64) continue;
      if (result.base64.length > maxUploadedPhotoBase64Length) continue;

      const storeId = sanitizePathPart(draft.storeId) || "unknown-store";
      const originalName = draft.fileName ? sanitizePathPart(draft.fileName.replace(/\.[^.]+$/, "")) : "";
      const path = [
        "contributions",
        "photo-previews",
        `${storeId}-${Date.now()}${originalName ? `-${originalName}` : ""}.jpg`
      ].join("/");
      const upload = await uploadGithubFile(
        path,
        result.base64,
        `[PHOTO] Add preview for ${draft.storeId}`
      );
      const previewUrl = upload?.content?.download_url;

      if (!previewUrl) {
        return `
### Photo preview attachment

Atlas compressed a JPEG preview from the image selected in the app, but the GitHub upload did not return a public preview URL.

- **Preview size**: ${result.width} × ${result.height}
- **Preview format**: JPEG
        `.trim();
      }

      return `
### Photo preview attachment

Atlas uploaded a compressed JPEG preview from the image selected in the app.

- **Preview size**: ${result.width} × ${result.height}
- **Preview format**: JPEG
- **Preview file**: [${path}](${previewUrl})

![Submitted photo preview](${previewUrl})
    `.trim();
    }
  } catch (error) {
    return `
### Photo preview attachment

Atlas could not upload the selected local image as a GitHub preview. The original file name and metadata above are preserved.

- **Upload error**: ${error instanceof Error ? error.message : "Unknown error"}
    `.trim();
  }

  return `
### Photo preview attachment

Atlas tried to upload a compressed preview, but the selected image was still too large for a reliable GitHub issue attachment. The original file name and metadata above are preserved.
  `.trim();
}

export async function submitStoreChange(draft: StoreChangeDraft) {
  const profile = await getCurrentProfile();
  const contributor = contributorLabel(draft.contributorName, profile);
  
  const title = draft.type === "new_store" 
    ? `[NEW STORE] ${draft.proposedValue}`
    : `[CORRECTION] Store ${draft.storeId}`;
    
  const body = `
### Contribution from ${contributor}

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
  const contributor = contributorLabel(draft.contributorName || draft.creditName, profile);
  const license = draft.license ?? DEFAULT_PHOTO_LICENSE;
  const attachment = await createEmbeddedPhotoAttachment(draft);

  const title = `[PHOTO] Store ${draft.storeId}`;
  const body = `
### Photo contribution from ${contributor}

- **Store ID**: ${draft.storeId}
- **Credit / display name**: ${draft.creditName || contributor}
- **Caption**: ${draft.caption || "None"}
- **Date Taken**: ${draft.takenOn || "Unknown"}
- **License**: ${license}
- **People Visible**: ${draft.peopleVisible ? "Yes" : "No"}
- **Original file name**: ${draft.fileName || "Unknown"}
- **MIME type**: ${draft.mimeType || "Unknown"}
- **Original selected locally**: Yes

${attachment}
  `.trim();

  await createGithubIssue(title, body, ["contribution", "photo"]);
  return { success: true };
}
