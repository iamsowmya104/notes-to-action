import { useState } from "react";

const PRIORITY_ORDER = ["High", "Medium", "Low"];

export default function Board({ tasks }) {
  if (tasks.length === 0) return null;

  const grouped = PRIORITY_ORDER.map((priority) => ({
    priority,
    items: tasks.filter((t) => (t.priority || "Medium") === priority),
  }));

  return (
    <section className="board">
      {grouped.map(({ priority, items }) => (
        <div className={`column column-${priority.toLowerCase()}`} key={priority}>
          <h2>{priority}</h2>
          {items.length === 0 && <p className="empty-note">Nothing here</p>}
          {items.map((task, index) => (
            <TaskCard task={task} index={index} key={task._id} />
          ))}
        </div>
      ))}
    </section>
  );
}

function TaskCard({ task, index = 0 }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="task-card" style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}>
      <p className="task-title">{task.task}</p>
      <div className="task-meta">
        <span className="owner">{task.owner || "Unassigned"}</span>
        {task.due_date && <span className="due">{task.due_date}</span>}
      </div>
      {task.blockers && <p className="blocker-note">🚧 {task.blockers}</p>}
      {task.source_excerpt && (
        <button className="source-toggle" onClick={() => setExpanded(!expanded)} type="button">
          {expanded ? "Hide source" : "View source"}
        </button>
      )}
      {expanded && <p className="source-note">"{task.source_excerpt}"</p>}
    </div>
  );
}
