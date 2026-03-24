import TaskItem from "./TaskItem";
import TaskQuickAdd from "./TaskQuickAdd";

export default function TaskListPanel({
  title,
  subtitle,
  tasksState,
  noteId = "",
  compact = false,
  showControls = true,
  showNoteLink = true
}) {
  const handleDelete = async (taskId) => {
    const confirmed = window.confirm("Delete this task?");

    if (!confirmed) return;

    await tasksState.deleteTask(taskId);
  };

  return (
    <section className={`task-panel ${compact ? "task-panel--compact" : ""}`}>
      <div className="task-panel__header">
        <div>
          <p className="section-label">Tasks</p>
          <h3>{title}</h3>
          {subtitle ? <p className="task-panel__subtitle">{subtitle}</p> : null}
        </div>
        {!compact ? (
          <div className="task-panel__progress">
            <strong>
              {tasksState.progress.completed}/{tasksState.progress.total}
            </strong>
            <span>tasks done</span>
          </div>
        ) : null}
      </div>

      {showControls ? <TaskQuickAdd onCreate={tasksState.createTask} noteId={noteId} compact={compact} /> : null}

      {!compact ? (
        <div className="task-panel__controls">
          <label>
            <span>Priority</span>
            <select value={tasksState.priorityFilter} onChange={(event) => tasksState.setPriorityFilter(event.target.value)}>
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            <span>Sort</span>
            <select value={tasksState.sortBy} onChange={(event) => tasksState.setSortBy(event.target.value)}>
              <option value="dueDate">Due date</option>
              <option value="priority">Priority</option>
              <option value="createdAt">Created date</option>
            </select>
          </label>
        </div>
      ) : null}

      {tasksState.error ? <div className="panel-message panel-message--error">{tasksState.error}</div> : null}
      {tasksState.loading ? (
        <div className="skeleton-list">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : null}

      {!tasksState.loading && tasksState.tasks.length === 0 ? (
        <div className="empty-state empty-state--compact">
          <div className="empty-state__art empty-state__art--small" />
          <p>No tasks yet in this view.</p>
        </div>
      ) : null}

      {!tasksState.loading && tasksState.tasks.length > 0 ? (
        <div className="task-list">
          {tasksState.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={tasksState.toggleTask}
              onSave={tasksState.updateTask}
              onDelete={handleDelete}
              compact={compact}
              showNoteLink={showNoteLink}
            />
          ))}
        </div>
      ) : null}

      {!compact ? (
        <div className="pagination">
          <button className="button button--ghost" disabled={tasksState.page <= 1} onClick={() => tasksState.setPage(tasksState.page - 1)}>
            Prev
          </button>
          <span>
            Page {tasksState.pagination.page} of {tasksState.pagination.totalPages}
          </span>
          <button
            className="button button--ghost"
            disabled={tasksState.page >= tasksState.pagination.totalPages}
            onClick={() => tasksState.setPage(tasksState.page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
