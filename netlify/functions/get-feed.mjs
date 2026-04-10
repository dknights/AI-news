import { getStore } from "@netlify/blobs";

export default async function handler(req, context) {
  const headers = {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=1800",
  };

  try {
    const store = getStore({ name: "feed-data", consistency: "strong" });
    const data = await store.get("latest", { type: "json" });

    if (!data) {
      return new Response(
        JSON.stringify({ error: "No feed data yet — trigger the refresh-feed function first." }),
        { status: 404, headers }
      );
    }

    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (err) {
    console.error("[get-feed] error:", err.message);
    return new Response(
      JSON.stringify({ error: "Failed to load feed", details: err.message }),
      { status: 500, headers }
    );
  }
}

export const config = {
  path: "/api/feed",
};
