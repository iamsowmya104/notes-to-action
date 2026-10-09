import { useState } from "react";
import InputPanel from "./components/InputPanel.jsx";
import ReviewPanel from "./components/ReviewPanel.jsx";
import Board from "./components/Board.jsx";

let idCounter = 0;

function nextId() {
  idCounter += 1;
  return `t${idCounter}`;
}

export default function App() {
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removingIds, setRemovingIds] = useState(new Set());

  const EXIT_ANIMATION_MS = 250;

  async function handleExtract() {
    if (!notes.trim()) {
      setError("Paste or dictate some notes first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      const withIds = (data.tasks || []).map((task) => ({
        ...task,
        _id: nextId(),
      }));

      setPending((prev) => [...prev, ...withIds]);
      setNotes("");
    } catch (err) {
      setError(err.message || "Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function updateTask(id, patch) {
    setPending((prev) =>
      prev.map((task) =>
        task._id === id ? { ...task, ...patch } : task
      )
    );
  }

  function confirmTask(id) {
    setRemovingIds((prev) => new Set(prev).add(id));

    setTimeout(() => {
      setPending((prev) => {
        const task = prev.find((item) => item._id === id);

        if (task) {
          setConfirmed((current) => [...current, task]);
        }

        return prev.filter((item) => item._id !== id);
      });

      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, EXIT_ANIMATION_MS);
  }

  function discardTask(id) {
    setRemovingIds((prev) => new Set(prev).add(id));

    setTimeout(() => {
      setPending((prev) =>
        prev.filter((item) => item._id !== id)
      );

      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, EXIT_ANIMATION_MS);
  }

  function confirmAll() {
    const ids = pending.map((task) => task._id);

    setRemovingIds((prev) => new Set([...prev, ...ids]));

    setTimeout(() => {
      setConfirmed((current) => [...current, ...pending]);
      setPending([]);
      setRemovingIds(new Set());
    }, EXIT_ANIMATION_MS);
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Notes to Action</h1>
        <p>Messy updates in. Trackable work out.</p>
      </header>

      <InputPanel
        notes={notes}
        setNotes={setNotes}
        onExtract={handleExtract}
        loading={loading}
        error={error}
      />

      <ReviewPanel
        pending={pending}
        removingIds={removingIds}
        onUpdate={updateTask}
        onConfirm={confirmTask}
        onDiscard={discardTask}
        onConfirmAll={confirmAll}
      />

      <Board tasks={confirmed} />
    </main>
  );
}