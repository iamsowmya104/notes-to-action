
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MODEL = "gemini-3.8-flash";

function buildPrompt(notes) {
  const today = new Date().toISOString().split("T")[0];

  return `You are an assistant that extracts action items from messy notes or spoken-update transcripts.

Today's date is ${today}. Use it to resolve relative dates like "Friday" or "next week" into real YYYY-MM-DD dates.

Return ONLY valid JSON, without markdown or explanations. Return an array of objects with these exact fields:
- task (string): a clear, concise description of the action item
- owner (string): the person responsible, or "Unassigned" if not mentioned
- priority (string): "High", "Medium", or "Low"
- due_date (string or null): YYYY-MM-DD if a date is mentioned, otherwise null
- blockers (string or null): anything blocking the task, otherwise null
- needs_review (boolean): true if a field required an uncertain guess, otherwise false
- source_excerpt (string): the exact short phrase from the input this task was extracted from

Example input:
"John needs to fix the login bug ASAP, but he is blocked on staging. Someone should update the docs by Friday."

Example output:
[
  {
    "task": "Fix the login bug",
    "owner": "John",
    "priority": "High",
    "due_date": null,
    "blockers": "Blocked on staging",
    "needs_review": false,
    "source_excerpt": "John needs to fix the login bug ASAP, but he is blocked on staging."
  },
  {
    "task": "Update the docs",
    "owner": "Unassigned",
    "priority": "Medium",
    "due_date": "2026-10-16",
    "blockers": null,
    "needs_review": true,
    "source_excerpt": "Someone should update the docs by Friday."
  }
]

Now extract action items from this text:
${notes}`;
}

app.post("/api/extract", async (req, res) => {
  const { notes } = req.body || {};

  if (!notes || typeof notes !== "string" || !notes.trim()) {
    return res.status(400).json({
      error: "Please provide some notes text.",
    });
  }

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing.");

    return res.status(500).json({
      error: "Server configuration error. Please contact the administrator.",
    });
  }

  const requestBody = {
    contents: [
      {
        parts: [{ text: buildPrompt(notes) }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  };

  try {
    let response;
    let lastError = "";

    // Retry temporary Gemini failures up to 3 times.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": GEMINI_API_KEY,
            },
            body: JSON.stringify(requestBody),
          }
        );
      } catch (networkError) {
        lastError = networkError.message;
        console.error(
          `Gemini network error (attempt ${attempt + 1}/3):`,
          lastError
        );

        if (attempt === 2) {
          return res.status(502).json({
            error: "AI is temporarily unavailable. Please try again shortly.",
          });
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1500 * (attempt + 1))
        );

        continue;
      }

      if (response.ok) {
        break;
      }

      lastError = await response.text();

      console.error(
        `Gemini API error: HTTP ${response.status}, attempt ${attempt + 1}/3`,
        lastError
      );

      const temporaryError = [429, 500, 502, 503, 504].includes(
        response.status
      );

      if (!temporaryError || attempt === 2) {
        return res.status(502).json({
          error:
            response.status === 429
              ? "AI request limit reached. Please wait a little and try again."
              : "AI is temporarily unavailable. Please try again shortly.",
        });
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 1500 * (attempt + 1))
      );
    }

    if (!response || !response.ok) {
      return res.status(502).json({
        error: "AI is temporarily unavailable. Please try again shortly.",
      });
    }

    const data = await response.json();

    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let tasks;

    try {
      tasks = JSON.parse(cleaned);

      if (!Array.isArray(tasks)) {
        throw new Error("AI response was not an array.");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", cleaned);

      return res.status(502).json({
        error: "AI returned an unexpected format. Please try again.",
      });
    }

    return res.json({ tasks });
  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Something went wrong on the server. Please try again.",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Notes to Action API is running.");
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
