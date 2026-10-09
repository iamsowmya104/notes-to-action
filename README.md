# Notes to Action — Hackathon Starter

Turns messy team communication — typed notes or spoken updates — into reliable, trackable work. Built with React (Vite) + a small Node/Express backend that calls the Gemini API.

Problem statement: **Future of Work & Automation**

Flow: **Input** (paste or dictate) → **AI processing** (extract tasks, owners, due dates, blockers, and flag anything low-confidence) → **Review** (correct or confirm each item) → **Board** (confirmed tasks only, each linked back to its source line).

## 1. Get a free Gemini API key
1. Go to https://aistudio.google.com
2. Sign in with your Google account
3. Click "Get API key" → "Create API key"
4. Copy the key

## 2. Set up the backend
```bash
cd backend
npm install
cp .env.example .env
# open .env and paste your key after GEMINI_API_KEY=
npm run dev
```
Backend runs at http://localhost:3001

## 3. Set up the frontend (new terminal tab)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173 — open that in your browser.

## 4. Try it
Click "Load a sample" then "Extract action items" to see the full pipeline work. Then paste your own notes.

## Push to GitHub (do this today — it's required for submission)
```bash
git init
git add .
git commit -m "Initial scaffold: Gemini extraction + board UI"
# create an empty repo on github.com, then:
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```
Commit again after each day's work — a visible history is a small but real signal to judges that this was actually built during the hackathon.

## Submission checklist (from the hackathon rules)
- [ ] Project Description — see the pitch in this conversation, adapt freely
- [ ] GitHub Repository — public, this code plus everything you add
- [ ] Demo Video — screen-record the "paste notes → board appears" flow
- [ ] Live Demo (optional but strengthens Presentation & Demo score) — deploy frontend to Vercel, backend to Render or Railway

## What's already handled
- Voice dictation (browser Web Speech API) alongside pasted text — `components/InputPanel.jsx`
- The Gemini call, prompt, and JSON parsing, with today's date injected so relative dates ("by Friday") resolve correctly
- Extraction now includes blockers, a `needs_review` confidence flag, and a `source_excerpt` for traceability
- A review stage where every extracted item can be edited, discarded, or confirmed before it's a real task — `components/ReviewPanel.jsx`
- A priority-based board of confirmed tasks only, each with a "View source" toggle back to the original line — `components/Board.jsx`
- Basic error states (empty input, API errors, malformed AI output, unsupported browser for dictation)

## What's still yours to build
- Deployment
- Edge case polish (very long notes, rapid-fire dictation) + your demo script
- Optional: drag-and-drop reordering on the board, if you have spare time after everything else is solid

## Note on the model
Uses `gemini-2.5-flash`, confirmed stable well past your deadline. If Google AI Studio shows a newer default model when you sign up, swap the `MODEL` constant in `backend/server.js` — nothing else changes.
