import { useLocation, useNavigate } from "react-router-dom";

function SectionButton({ active, icon, label, count, onClick }) {
  return (
    <button type="button" className={`sidebar-nav__button ${active ? "sidebar-nav__button--active" : ""}`} onClick={onClick}>
      <span className="sidebar-nav__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="sidebar-nav__label">{label}</span>
      {typeof count === "number" ? <span className="sidebar-nav__count">{count}</span> : null}
    </button>
  );
}

export default function Sidebar({ notesProps, tasksProps, onCreateNote, onCreateTask }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTaskSection = location.pathname.startsWith("/tasks") ? location.pathname.split("/")[2] || "all" : "";

  const noteSections = [
    { id: "all", label: "All Notes", count: notesProps.counts.all, icon: "📝" },
    { id: "favorites", label: "Favorites", count: notesProps.counts.favorites, icon: "📌" },
    { id: "archived", label: "Archived", count: notesProps.counts.archived, icon: "🗂️" },
    { id: "trash", label: "Trash", count: notesProps.counts.trash, icon: "🗑️" }
  ];

  const taskSections = [
    { id: "all", label: "All Tasks", count: tasksProps.counts.all, icon: "✓", path: "/tasks" },
    { id: "today", label: "Today", count: tasksProps.counts.today, icon: "☀️", path: "/tasks/today" },
    { id: "upcoming", label: "Upcoming", count: tasksProps.counts.upcoming, icon: "⏳", path: "/tasks/upcoming" },
    { id: "completed", label: "Completed", count: tasksProps.counts.completed, icon: "✔️", path: "/tasks/completed" }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">☁</div>
        <div>
          <p className="sidebar__eyebrow">Cloud Notepad</p>
          <h1>Workspace</h1>
        </div>
      </div>

      <div className="sidebar__actions">
        <button className="button button--primary" type="button" onClick={onCreateNote}>
          New note
        </button>
        <button className="button button--secondary" type="button" onClick={onCreateTask}>
          New task
        </button>
      </div>

      <section className="sidebar-group">
        <div className="sidebar-group__header">
          <span>Notes</span>
        </div>
        <div className="sidebar-nav">
          {noteSections.map((item) => (
            <SectionButton
              key={item.id}
              active={!location.pathname.startsWith("/tasks") && notesProps.section === item.id}
              icon={item.icon}
              label={item.label}
              count={item.count}
              onClick={() => {
                notesProps.setSection(item.id);
                navigate(notesProps.activeNoteId ? `/notes/${notesProps.activeNoteId}` : "/");
              }}
            />
          ))}
        </div>
      </section>

      <section className="sidebar-group">
        <div className="sidebar-group__header">
          <span>Tasks</span>
          <span className="sidebar-group__meta">
            {tasksProps.progress.completed}/{tasksProps.progress.total}
          </span>
        </div>
        <div className="sidebar-nav">
          {taskSections.map((item) => (
            <SectionButton
              key={item.id}
              active={activeTaskSection === item.id}
              icon={item.icon}
              label={item.label}
              count={item.count}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
      </section>

      <section className="sidebar-group">
        <div className="sidebar-group__header">
          <span>Tags</span>
          <span className="sidebar-group__meta">{notesProps.availableTags.length}</span>
        </div>
        <div className="tag-stack">
          {notesProps.availableTags.length === 0 ? (
            <div className="sidebar-empty">
              <div className="sidebar-empty__dot" />
              <p>Tags will appear here</p>
            </div>
          ) : (
            notesProps.availableTags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip ${notesProps.tagFilter === tag ? "tag-chip--active" : ""}`}
                onClick={() => {
                  notesProps.setTagFilter(notesProps.tagFilter === tag ? "" : tag);
                  if (location.pathname.startsWith("/tasks")) {
                    navigate("/");
                  }
                }}
              >
                #{tag}
              </button>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}

