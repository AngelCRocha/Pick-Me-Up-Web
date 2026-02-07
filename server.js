const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { Profanity } = require("@2toad/profanity");

const app = express();
app.set("trust proxy", true);
const PORT = process.env.PORT || 3000;

// --- Supabase setup ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Profanity filter ---
const profanity = new Profanity();
// Leet-speak variants of profanity
profanity.addWords([
  "nigga", "niggas", "nigg3r", "n1gger", "n1gga", "nigg@",
  "bullshit", "bullsh1t", "b1tch", "btch", "bi+ch",
  "stfu", "gtfo", "lmfao", "wtf",
  "retard", "retarded", "r3tard", "r3tarded", "ret@rd",
  "fck", "fuk", "fuq", "phuck", "phuk", "f*ck", "fvck",
  "sh1t", "sht", "s#it", "sh!t",
  "a$$", "a55", "@ss", "@sshole",
  "d1ck", "d!ck", "c0ck", "c**k",
  "wh0re", "wh0r3", "b!tch", "sl*t", "s1ut",
  // Violent / negative language + leet-speak variants
  "kill", "k1ll", "k!ll", "ki11",
  "murder", "murd3r",
  "die", "dying", "dead", "d1e", "d3ad",
  "suicide", "su1cide", "suic1de",
  "hang", "shoot", "sh00t", "sh0ot", "sho0t",
  "stab", "st@b", "attack", "att@ck",
  "hate", "h8", "h@te",
  "ugly", "stupid", "stup1d", "dumb",
  "idiot", "id1ot", "1diot",
  "loser", "l0ser", "los3r",
  "worthless", "w0rthless", "useless",
  "pathetic", "disgusting", "d1sgusting",
  "horrible", "terrible", "awful",
  "shut up", "kys", "kms"
]);


// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Default messages (fallback) ---
const DEFAULT_MESSAGES = [
  "You are doing great today 🌟",
  "Take a breath — you've got this 💙",
  "Small progress is still progress.",
  "You matter more than you know.",
  "Be proud of yourself for trying.",
  "Your effort counts, even when it's quiet."
];

// --- API Routes ---

// GET /api/messages — return all messages
app.get("/api/messages", async (req, res) => {
  const { data, error } = await supabase
    .from("messages")
    .select("text")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Supabase fetch error:", error.message);
    return res.json(DEFAULT_MESSAGES);
  }

  const dbMessages = data.map((row) => row.text);
  const all = [...dbMessages, ...DEFAULT_MESSAGES];
  res.json(all);
});

// POST /api/messages — submit a new message
app.post("/api/messages", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Message text is required." });
  }

  const trimmed = text.trim();

  if (trimmed.length === 0 || trimmed.length > 200) {
    return res.status(400).json({ error: "Message must be 1–200 characters." });
  }

  if (profanity.exists(trimmed)) {
    return res.status(400).json({ error: "Message contains inappropriate language." });
  }

  // Rate limit: 1 message per IP per 24 hours
  const clientIp = req.ip;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: recent } = await supabase
    .from("messages")
    .select("id")
    .eq("ip", clientIp)
    .gte("created_at", oneDayAgo)
    .limit(1);

  if (recent && recent.length > 0) {
    return res.status(429).json({ error: "You can only submit one message per day. Try again tomorrow!" });
  }

  const { error } = await supabase
    .from("messages")
    .insert({ text: trimmed, ip: clientIp });

  if (error) {
    console.error("Supabase insert error:", error.message);
    return res.status(500).json({ error: "Failed to save message." });
  }

  res.status(201).json({ success: true });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Pick Me Up server running at http://localhost:${PORT}`);
});
