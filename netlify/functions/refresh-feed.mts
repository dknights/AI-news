import { getStore } from "@netlify/blobs";

const TOPICS = [
  { id: "consultancy", label: "Consultancy" },
  { id: "philosophy",  label: "Philosophy"  },
  { id: "creative",    label: "Creative Media" },
  { id: "vibe",        label: "Vibe Coding" },
  { id: "education",   label: "Education"   },
];

const SYSTEM_PROMPT = `You are an expert AI news curator with deep knowledge of the latest AI developments.
Your job is to generate fresh, real, grounded AI news stories for today.
Always return ONLY a valid JSON array. No markdown. No backticks. No explanation.
Your entire response must start with [ and end with ].
Each story object must have exactly these fields:
- title: string (punchy headline)
- summary: string (2 sentences, factual and specific)
- insight: string (1 sentence on why this matters practically)
- topic: string (the topic id provided)
- emoji: string (single relevant emoji)
- source: string (publication or website name)
- url: string (a plausible URL - use real domains like bbc.co.uk, theguardian.com, wired.com, techcrunch.com, nature.com, etc.)`;

function buildPrompt(topic) {
  const prompts = {
    consultancy: `Generate 3 fresh AI news stories specifically about AI in digital consultancy, business transformation, enterprise AI strategy, or consulting workflows. Today's date is ${new Date().toDateString()}. Make them feel current and specific.`,
    philosophy:  `Generate 3 fresh AI news stories about AI philosophy, ethics, consciousness, alignment, or the societal implications of AI. Today's date is ${new Date().toDateString()}. Make them thought-provoking and substantive.`,
    creative:    `Generate 3 fresh AI news stories about AI in creative media: generative art, AI music, video synthesis, creative tools for artists, AI in film or storytelling. Today's date is ${new Date().toDateString()}.`,
    vibe:        `Generate 3 fresh AI news stories about vibe coding, AI-assisted development, coding copilots, agentic coding tools, prompt engineering for code, or AI IDEs. Today's date is ${new Date().toDateString()}.`,
    education:   `Generate 3 fresh AI news stories about AI in education: how teachers and students are using AI, policy developments, AI tutoring, and the future of AI in learning. Today's date is ${new Date().toDateString()}.`,
  };
  return prompts[topic] || `Generate 3 fresh AI news stories about ${topic}. Today's date is ${new Date().toDateString()}.`;
}

async function fetchStoriesForTopic(topic) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(topic.id) }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status} for topic ${topic.id}`);
  }

  const data = await response.json();
  const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`No JSON array in response for ${topic.id}`);

  const stories = JSON.parse(match[0]);
  // Ensure topic field is set correctly
  return stories.map(s => ({ ...s, topic: topic.id }));
}

export default async function handler() {
  console.log("🗞 refresh-feed: starting daily refresh", new Date().toISOString());

  const store = getStore("feed-data");
  const allStories = [];
  const errors = [];

  for (const topic of TOPICS) {
    try {
      console.log(`Fetching stories for: ${topic.id}`);
      const stories = await fetchStoriesForTopic(topic);
      allStories.push(...stories);
      console.log(`✓ Got ${stories.length} stories for ${topic.id}`);
      // Small delay between API calls to be kind to rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`✗ Failed for ${topic.id}:`, err.message);
      errors.push({ topic: topic.id, error: err.message });
    }
  }

  const payload = {
    stories: allStories,
    generatedAt: new Date().toISOString(),
    date: new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    errors: errors.length > 0 ? errors : undefined,
  };

  await store.setJSON("latest", payload);
  console.log(`✓ Saved ${allStories.length} stories to blob storage`);

  return new Response(JSON.stringify({ ok: true, count: allStories.length, errors }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = {
  schedule: "0 6 * * *",
};
