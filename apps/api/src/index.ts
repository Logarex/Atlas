export interface Env {
  GITHUB_TOKEN: string;
  ATLAS_API_KEY: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, x-atlas-api-key",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
    };

    const apiKey = request.headers.get("x-atlas-api-key");
    if (!apiKey || apiKey !== env.ATLAS_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid API Key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let githubUrl = "";
    if (path === "/issues" && request.method === "POST") {
      githubUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/issues`;
    } else if (path.startsWith("/contents/") && request.method === "PUT") {
      const contentPath = path.replace("/contents/", "");
      githubUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${encodeURIComponent(contentPath)}`;
    } else {
      return new Response(JSON.stringify({ error: "Not Found or Method Not Allowed" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!env.GITHUB_TOKEN) {
      return new Response(JSON.stringify({ error: "Server Configuration Error: Missing GITHUB_TOKEN" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const requestBody = await request.text();
      const githubResponse = await fetch(githubUrl, {
        method: request.method,
        headers: {
          Authorization: `token ${env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Atlas-Mobile-App-Proxy",
        },
        body: requestBody,
      });

      const responseData = await githubResponse.text();

      return new Response(responseData, {
        status: githubResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to forward request to GitHub" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
