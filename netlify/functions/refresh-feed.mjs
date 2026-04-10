import { getStore } from "@netlify/blobs";

const TOPICS = [
  { id: "consultancy" },
  { id: "philosophy"  },
  { id: "creative"    },
  { id: "vibe"        },
  { id: "education"   },
];

const SYSTEM_PROMPT = `You are an expert AI news curator. Return ONLY a valid JSON array. No markdown. No backticks. No explanation. Start with [ end with ].
Each object: title (string), summary (2 sentences), insight (1 sentence why it matters), topic (string), emoji (single emoji), source (publication name), url (real domain like wired.com, theguardian.com, bbc.co.uk, techcrunch.com).`;

const PROMPTS = {
  consultancy: `Generate 3 current AI news stories about AI in digital consultancy, business transformation, or enterprise AI strategy. Date: ${new Date().toDateString()}.`,
  philosophy:  `Generate 3 current AI news stories about AI philosophy, ethics, consciousness, or alignment. Date: ${new Date().toDateString()}.`,
  creative:    `Generate 3 current AI news stories about AI in creative media, generative art, AI music, or video synthesis. Date: ${new Date().toDateString()}.`,
  vibe:        `Generate 3 current AI news stories about vibe coding, AI coding tools, copilots, or agentic development. Date: ${new Date().toDateString()}.`,
  education:   `Generate 3 current AI news stories about AI in education, AI tutoring, or AI classroom policy. Date: ${new Date().toDateString()}.`,
};

async function fetchTopic(topicId) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: PROMPTS[topicId] }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array found for ${topicId}. Got: ${text.slice(0, 200)}`);

  const stories = JSON.parse(match[0]);
  return stories.map(s => ({ ...s, topic: topicId }));
}

export default async function handler(req, context) {
  console.log("[refresh-feed] Starting", new Date().toISOString());

  const store = getStore({ name: "feed-data", consistency: "strong" });
  const allStories = [];
  const errors = [];

  for (const topic of TOPICS) {
    try {
      console.log(`[refresh-feed] Fetching ${topic.id}...`);
      const stories = await fetchTopic(topic.id);
      allStories.push(...stories);
      console.log(`[refresh-feed] ✓ ${topic.id}: ${stories.length} stories`);
      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error(`[refresh-feed] ✗ ${topic.id}:`, err.message);
      errors.push({ topic: topic.id, error: err.message });
    }
  }

  const payload = {
    stories: allStories,
    generatedAt: new Date().toISOString(),
    date: new Date().toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }),
    ...(errors.length > 0 && { errors }),
  };

  try {
    await store.setJSON("latest", payload);
    console.log(`[refresh-feed] Saved ${allStories.length} stories to blob storage`);
  } catch (blobErr) {
    console.error("[refresh-feed] Blob storage error:", blobErr.message);
    return new Response(
      JSON.stringify({ ok: false, error: "Failed to save to blob storage", details: blobErr.message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, count: allStories.length, errors: errors.length > 0 ? errors : undefined }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

export const config = {
  schedule: "0 6 * * *",
};
