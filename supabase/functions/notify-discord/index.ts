import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
const reviewBaseUrl = Deno.env.get("ATLAS_REVIEW_URL");

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!webhookUrl) {
    return new Response("DISCORD_WEBHOOK_URL is not configured", { status: 500 });
  }

  const payload = await request.json();
  const record = payload.record ?? payload;
  const submissionType = record.type ?? "photo_submission";
  const storeId = record.store_id ?? "new-store";
  const reviewUrl = reviewBaseUrl
    ? `${reviewBaseUrl.replace(/\/$/, "")}/${record.id ?? ""}`
    : null;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      content: "New Atlas submission",
      embeds: [
        {
          title: `${submissionType}: ${storeId}`,
          color: 15233816,
          url: reviewUrl ?? undefined,
          fields: [
            {
              name: "Status",
              value: record.status ?? "pending",
              inline: true
            },
            {
              name: "Submitted by",
              value: record.submitted_by ?? "unknown",
              inline: true
            },
            {
              name: "Source",
              value: record.source_url ?? "No source URL provided"
            },
            {
              name: "Payload",
              value: `\`\`\`json\n${JSON.stringify(record.payload ?? record, null, 2).slice(0, 900)}\n\`\`\``
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    return new Response(await response.text(), { status: response.status });
  }

  return Response.json({ ok: true });
});
