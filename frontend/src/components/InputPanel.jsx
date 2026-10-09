import { useState, useRef } from "react";

const SAMPLE_NOTES = `Sync with design on the onboarding flow — Priya said she'd have mockups by Thursday.
Fix the checkout bug ASAP, it's blocking the release. Waiting on prod access from DevOps.
Someone needs to update the API docs, no rush.
Follow up with the vendor about the contract renewal by end of week.`;

const SpeechRecognitionAPI =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function InputPanel({ notes, setNotes, onExtract, loading, error }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  function toggleDictate() {
    if (!SpeechRecognitionAPI) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <section className="input-card">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Paste your notes, or dictate a spoken update..."
        rows={6}
      />
      <div className="input-actions">
        <button className="ghost-button" onClick={() => setNotes(SAMPLE_NOTES)} type="button">
          Load a sample
        </button>
        {SpeechRecognitionAPI && (
          <button
            className={`ghost-button ${listening ? "listening" : ""}`}
            onClick={toggleDictate}
            type="button"
          >
            {listening ? (
              <>
                <span className="listening-dot" /> Stop dictating
              </>
            ) : (
              "🎤 Dictate"
            )}
          </button>
        )}
        <button className="primary-button" onClick={onExtract} disabled={loading} type="button">
          {loading && <span className="spinner" />}
          {loading ? "Extracting…" : "Extract action items"}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
