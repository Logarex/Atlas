const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export async function createGithubIssue(title: string, body: string, labels: string[] = ["contribution"]) {
  if (!API_URL || !API_KEY) {
    throw new Error("Contributions are not configured on this build. Please contact the maintainer.");
  }

  const response = await fetch(`${API_URL}/issues`, {
    method: "POST",
    headers: {
      "x-atlas-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      body,
      labels,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create contribution issue");
  }

  return response.json();
}

export async function uploadGithubFile(
  path: string,
  contentBase64: string,
  message: string
) {
  if (!API_URL || !API_KEY) {
    throw new Error("Contributions are not configured on this build. Please contact the maintainer.");
  }

  const response = await fetch(
    `${API_URL}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        "x-atlas-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: contentBase64,
        message
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload file");
  }

  return response.json();
}
