import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Google ships new Gemini versions often. This one is confirmed stable well
// past your hackathon deadline. If Google AI Studio shows you a newer default
// model when you sign up, you can swap this constant — nothing else changes.
const MODEL = "gemini-3.8-flash";

function buildPrompt(notes) {
  const today = new Date().toISOString().split("T")[0];
  return `You are an assistant that extracts action items from messy notes or spoken-update transcripts.
Today's date is ${today} — use it to resolve relative dates like "Friday" or "next week" into real YYYY-MM-DD dates.

Return ONLY valid JSON, no markdown formatting, no explanation - an array of objects with these exact fields:
- task (string): a clear, concise description of the action item
- owner (string): the person responsible, or "Unassigned" if not mentioned
- priority (string): "High", "Medium", or "Low", inferred from urgency language
- due_date (string or null): in YYYY-MM-DD format if a date or relative date is mentioned, otherwise null
- blockers (string or null): anything mentioned as blocking or waiting on this task, otherwise null
- needs_review (boolean): true if you had to guess or infer any field above with low confidence, false if it was stated clearly
- source_excerpt (string): the exact short phrase or sentence from the input this task was extracted from, so a human can trace it back

Example input: "John needs to fix the login bug ASAP, but he's blocked on a staging environment. Someone should update the docs by Friday."
Example output:
[
  {"task": "Fix the login bug", "owner": "John", "priority": "High", "due_date": null, "blockers": "Blocked on staging environment", "needs_review": false, "source_excerpt": "John needs to fix the login bug ASAP, but he's blocked on a staging environment."},
  {"task": "Update the docs", "owner": "Unassigned", "priority": "Medium", "due_date": "2026-09-25", "blockers": null, "needs_review": true, "source_excerpt": "Someone should update the docs by Friday."}
]

Now extract action items from this text:
${notes}`;
}

app.post("/api/extract", async (req, res) => {
  const { notes } = req.body;

  if (!notes || typeof notes !== "string" || !notes.trim()) {
    return res.status(400).json({ error: "Please provide some notes text." });
  }

  if (!GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ error: "Server is missing GEMINI_API_KEY. Add it to backend/.env" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(notes) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return res
        .status(502)
        .json({ error: "AI service error. Check your API key and try again." });
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

    // Defensive parsing: strip markdown fences in case the model adds them anyway
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let tasks;
    try {
      tasks = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse model output:", cleaned);
      return res
        .status(502)
        .json({ error: "AI returned an unexpected format. Try again." });
    }

    res.json({ tasks });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
