import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDueDate(value) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default function TaskItem({ task, onToggle, onSave, onDelete, compact = false, showNoteLink = true }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    dueDate: dateInputValue(task.dueDate),
    priority: task.priority
  });
  const [expanded, setExpanded] = useState(Boolean(task.description || task.dueDate || !compact));
  const [status, setStatus] = useState("");

  useEffect(() => {
    setForm({
      title: task.title,
      description: task.description || "",
      dueDate: dateInputValue(task.dueDate),
      priority: task.priority
    });
  }, [task.title, task.description, task.dueDate, task.priority]);

  const isDirty = useMemo(() => {
    return (
      form.title !== task.title ||
      form.description !== (task.description || "") ||
      form.dueDate !== dateInputValue(task.dueDate) ||
      form.priority !== task.priority
    );
  }, [form, task]);

  const isOverdue = useMemo(() => {
    if (task.completed || !form.dueDate) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return new Date(form.dueDate) < today;
  }, [form.dueDate, task.completed]);

  useEffect(() => {
    if (!isDirty || !form.title.trim()) {
      return undefined;
    }

    setStatus("Saving...");

    const timeoutId = window.setTimeout(async () => {
      try {
        await onSave(
          task.id,
          {
            title: form.title.trim(),
            description: form.description,
            dueDate: form.dueDate || null,
            priority: form.priority,
            noteId: task.noteId || null,
            completed: task.completed,
            order: task.order
          },
          { refresh: false }
        );
        setStatus("Saved");
      } catch (error) {
        setStatus("Error");
      }
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form, isDirty, onSave, task]);

  return (
    <article
      className={`task-item ${task.completed ? "task-item--completed" : ""} ${isOverdue ? "task-item--overdue" : ""}`}
    >
      <div className="task-item__row">
        <label className="task-item__toggle">
          <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} />
          <span className="task-item__checkmark" />
        </label>

        <div className="task-item__content">
          <input
            className="task-item__title"
            type="text"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />

          <div className="task-item__meta">
            <span className={`priority-badge priority-badge--${form.priority}`}>{form.priority}</span>
            <span className={isOverdue ? "task-item__due task-item__due--overdue" : "task-item__due"}>
              {formatDueDate(form.dueDate)}
            </span>
            {status ? <span>{status}</span> : null}
            {showNoteLink && task.noteId ? (
              <Link to={`/notes/${task.noteId}`} className="task-item__note-link">
                {task.noteTitle || "Open note"}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="task-item__buttons">
          <button className="note-action" type="button" onClick={() => setExpanded((current) => !current)}>
            {expanded ? "Hide" : "Edit"}
          </button>
          <button className="note-action note-action--danger" type="button" onClick={() => onDelete(task.id)}>
            Delete
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="task-item__details">
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Add details"
          />
          <div className="task-item__detail-grid">
            <label>
              <span>Due date</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </label>
            <label>
              <span>Priority</span>
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}
    </article>
  );
}

