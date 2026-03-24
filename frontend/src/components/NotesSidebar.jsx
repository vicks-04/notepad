import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useTheme } from "../context/ThemeContext";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function NotesSidebar({
  notes,
  loading,
  error,
  activeNoteId,
  section,
  setSection,
  counts,
  search,
  setSearch,
  tagFilter,
  setTagFilter,
  availableTags,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  pagination,
  page,
  setPage,
  onCreateNote,
  onTogglePin,
  onArchiveNote,
  onRestoreArchived,
  onTrashNote,
  onRestoreTrash,
  onPermanentDelete,
  onLogout,
  tasksProps
}) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const noteSections = [
    { id: "all", label: "All Notes", count: counts.all },
    { id: "favorites", label: "Favorites", count: counts.favorites },
    { id: "archived", label: "Archived", count: counts.archived },
    { id: "trash", label: "Trash", count: counts.trash }
  ];
  const taskSections = [
    { id: "all", label: "All Tasks", count: tasksProps?.counts?.all || 0, path: "/tasks" },
    { id: "today", label: "Today", count: tasksProps?.counts?.today || 0, path: "/tasks/today" },
    { id: "upcoming", label: "Upcoming", count: tasksProps?.counts?.upcoming || 0, path: "/tasks/upcoming" },
    { id: "completed", label: "Completed", count: tasksProps?.counts?.completed || 0, path: "/tasks/completed" }
  ];
  const activeTaskSection = location.pathname.startsWith("/tasks")
    ? location.pathname.split("/")[2] || "all"
    : "";

  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <div>
          <p className="sidebar__eyebrow">Cloud Notepad</p>
          <h1>Your Notes</h1>
        </div>
        <button className="button button--primary" onClick={onCreateNote}>
          New note
        </button>
      </div>

      <div className="sidebar__sections">
        {noteSections.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar__section-button ${section === item.id ? "sidebar__section-button--active" : ""}`}
            onClick={() => {
              setSection(item.id);
              if (location.pathname.startsWith("/tasks")) {
                navigate("/");
              }
            }}
          >
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </button>
        ))}
      </div>

      <div className="sidebar__sections">
        {taskSections.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar__section-button ${activeTaskSection === item.id ? "sidebar__section-button--active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </button>
        ))}
      </div>

      <div className="sidebar__progress">
        <p className="section-label">Task Progress</p>
        <strong>
          {tasksProps?.progress?.completed || 0}/{tasksProps?.progress?.total || 0}
        </strong>
        <span>tasks completed</span>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      <div className="sidebar__filters">
        <label>
          <span>Tag</span>
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="">All tags</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Sort</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="updatedAt">Last updated</option>
            <option value="createdAt">Created date</option>
          </select>
        </label>

        <label>
          <span>Order</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
      </div>

      {error ? <div className="sidebar__feedback sidebar__feedback--error">{error}</div> : null}

      <div className="sidebar__list">
        {loading ? <div className="sidebar__feedback">Loading notes...</div> : null}

        {!loading && notes.length === 0 ? (
          <div className="sidebar__feedback">No notes found for this view yet.</div>
        ) : null}

        {!loading &&
          notes.map((note) => (
            <div key={note.id} className={`note-card ${activeNoteId === note.id ? "note-card--active" : ""}`}>
              <Link className="note-card__link" to={`/notes/${note.id}`}>
                <div className="note-card__title-row">
                  <strong>{note.title}</strong>
                  {note.isPinned ? <span className="note-badge">Pinned</span> : null}
                </div>
                <span>{note.excerpt || "Empty note"}</span>
                {note.tags?.length ? (
                  <div className="note-card__tags">
                    {note.tags.map((tag) => (
                      <span key={tag} className="tag-pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <small>Updated {formatDate(note.updatedAt)}</small>
              </Link>
              <div className="note-card__actions">
                {!note.isDeleted ? (
                  <button className="note-action" type="button" onClick={() => onTogglePin(note.id)}>
                    {note.isPinned ? "Unpin" : "Pin"}
                  </button>
                ) : null}

                {!note.isDeleted && !note.isArchived ? (
                  <button className="note-action" type="button" onClick={() => onArchiveNote(note.id)}>
                    Archive
                  </button>
                ) : null}

                {!note.isDeleted && note.isArchived ? (
                  <button className="note-action" type="button" onClick={() => onRestoreArchived(note.id)}>
                    Restore
                  </button>
                ) : null}

                {!note.isDeleted ? (
                  <button className="note-action note-action--danger" type="button" onClick={() => onTrashNote(note.id)}>
                    Trash
                  </button>
                ) : null}

                {note.isDeleted ? (
                  <button className="note-action" type="button" onClick={() => onRestoreTrash(note.id)}>
                    Restore
                  </button>
                ) : null}

                {note.isDeleted ? (
                  <button
                    className="note-action note-action--danger"
                    type="button"
                    onClick={() => onPermanentDelete(note.id)}
                  >
                    Delete forever
                  </button>
                ) : null}
              </div>
            </div>
          ))}
      </div>

      <div className="sidebar__footer">
        <div className="pagination">
          <button className="button button--ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="button button--ghost"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
        <button className="button button--ghost button--full" onClick={toggleTheme}>
          Theme: {theme === "dark" ? "Dark" : "Light"}
        </button>
        <button className="button button--ghost button--full" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
