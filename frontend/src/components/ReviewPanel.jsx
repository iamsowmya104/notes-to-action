export default function ReviewPanel({ pending, removingIds, onUpdate, onConfirm, onDiscard, onConfirmAll }) {
  if (pending.length === 0) return null;

  return (
    <section className="review-panel">
      <div className="review-header">
        <h2>Review before adding to board ({pending.length})</h2>
        <button className="primary-button" onClick={onConfirmAll} type="button">
          Confirm all
        </button>
      </div>

      {pending.map((task, index) => (
        <div
          className={`review-card ${task.needs_review ? "flagged" : ""} ${
            removingIds?.has(task._id) ? "exiting" : ""
          }`}
          style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
          key={task._id}
        >
          {task.needs_review && <span className="flag-badge">⚠ low confidence — check this one</span>}

          <input
            className="edit-field"
            value={task.task}
            onChange={(e) => onUpdate(task._id, { task: e.target.value })}
          />

          <div className="review-row">
            <input
              className="edit-field small"
              value={task.owner || ""}
              onChange={(e) => onUpdate(task._id, { owner: e.target.value })}
              placeholder="Owner"
            />
            <select
              className="edit-field small"
              value={task.priority || "Medium"}
              onChange={(e) => onUpdate(task._id, { priority: e.target.value })}
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <input
              className="edit-field small"
              type="date"
              value={task.due_date || ""}
              onChange={(e) => onUpdate(task._id, { due_date: e.target.value || null })}
            />
          </div>

          {task.blockers && <p className="blocker-note">🚧 {task.blockers}</p>}
          {task.source_excerpt && <p className="source-note">from: "{task.source_excerpt}"</p>}

          <div className="review-actions">
            <button className="ghost-button" onClick={() => onDiscard(task._id)} type="button">
              Discard
            </button>
            <button className="primary-button" onClick={() => onConfirm(task._id)} type="button">
              Confirm
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
