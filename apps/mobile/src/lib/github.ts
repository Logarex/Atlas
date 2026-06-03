const GITHUB_TOKEN = process.env.EXPO_PUBLIC_GITHUB_TOKEN;
const GITHUB_OWNER = process.env.EXPO_PUBLIC_GITHUB_OWNER || "Logarex";
const GITHUB_REPO = process.env.EXPO_PUBLIC_GITHUB_REPO || "Atlas";
const GITHUB_BRANCH = process.env.EXPO_PUBLIC_GITHUB_BRANCH || "main";

function encodeContentPath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export async function createGithubIssue(title: string, body: string, labels: string[] = ["contribution"]) {
  if (!GITHUB_TOKEN) {
    console.warn("GitHub token not configured. Contribution will not be sent.");
    return null;
  }

  const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      title,
      body,
      labels,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create GitHub issue");
  }

  return response.json();
}

export async function uploadGithubFile(
  path: string,
  contentBase64: string,
  message: string,
  branch = GITHUB_BRANCH
) {
  if (!GITHUB_TOKEN) {
    console.warn("GitHub token not configured. File upload will not be sent.");
    return null;
  }

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeContentPath(path)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        branch,
        content: contentBase64,
        message
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload file to GitHub");
  }

  return response.json();
}
