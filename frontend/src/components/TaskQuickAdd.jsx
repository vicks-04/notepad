import { useState } from "react";

export default function TaskQuickAdd({ onCreate, noteId = "", compact = false }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onCreate({
        title: title.trim(),
        dueDate: dueDate || null,
        priority,
        noteId: noteId || null
      });

      setTitle("");
      setDueDate("");
      setPriority("medium");
    } catch (err) {
      setError(err.message || "Unable to create task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`task-quick-add ${compact ? "task-quick-add--compact" : ""}`} onSubmit={handleSubmit}>
      <div className="task-quick-add__grid">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={compact ? "Add a task for this note" : "Add a new task"}
        />
        <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <button className="button button--primary" type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add task"}
      </button>
      {error ? <div className="panel-message panel-message--error">{error}</div> : null}
    </form>
  );
}
