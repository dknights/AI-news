import { getStore } from "@netlify/blobs";

export default async function handler(req: Request) {
  // Allow the frontend to fetch this
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600", // cache for 1 hour
  };

  try {
    const store = getStore("feed-data");
    const data = await store.get("latest", { type: "json" });

    if (!data) {
      return new Response(
        JSON.stringify({ error: "No feed data yet. The daily refresh may not have run yet." }),
        { status: 404, headers }
      );
    }

    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (err) {
    console.error("get-feed error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to load feed data" }),
      { status: 500, headers }
    );
  }
}

export const config = {
  path: "/api/feed",
};
