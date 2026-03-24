import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import DashboardCard from "../components/DashboardCard";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { useNotesList } from "../hooks/useNotesList";
import { useTasksList } from "../hooks/useTasksList";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notesState = useNotesList();
  const tasksState = useTasksList({ limit: 8 });

  const handleCreateNote = async () => {
    try {
      const note = await notesState.createNote({ title: "Untitled note", content: "", tags: [] });
      navigate(`/notes/${note.id}`);
    } catch (error) {
      return null;
    }
  };

  const handleCreateTask = async () => {
    try {
      await tasksState.createTask({ title: "New task", priority: "medium" });
    } catch (error) {
      return null;
    }
  };

  const handleTrashNote = async (noteId) => {
    if (!window.confirm("Move this note to trash?")) return;
    await notesState.trashNote(noteId);
  };

  return (
    <AppShell
      user={user}
      notesProps={{
        ...notesState,
        activeNoteId: "",
        onCreateNote: handleCreateNote,
        onTogglePin: notesState.togglePin,
        onArchiveNote: notesState.archiveNote,
        onRestoreArchived: notesState.restoreArchivedNote,
        onTrashNote: handleTrashNote,
        onRestoreTrash: notesState.restoreFromTrash,
        onPermanentDelete: notesState.permanentlyDeleteNote,
        onLogout: logout
      }}
      tasksProps={tasksState}
      topbar={
        <Topbar
          user={user}
          searchValue={notesState.search}
          onSearchChange={notesState.setSearch}
          searchPlaceholder="Search notes, tags, and recent ideas"
          onLogout={logout}
        />
      }
      onCreateNote={handleCreateNote}
      onCreateTask={handleCreateTask}
    >
      <section className="page page--fade">
        <div className="hero-panel">
          <div>
            <p className="section-label">Command Center</p>
            <h2>{user?.name ? `${user.name}'s premium workspace` : "Premium workspace"}</h2>
            <p>Draft notes, track action items, and organize everything with the speed of a modern SaaS interface.</p>
          </div>
          <div className="hero-panel__actions">
            <button className="button button--primary" type="button" onClick={handleCreateNote}>
              Create note
            </button>
            <button className="button button--secondary" type="button" onClick={handleCreateTask}>
              Quick task
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          <DashboardCard eyebrow="Notes" value={notesState.counts.all} label="Active notes in your workspace." />
          <DashboardCard eyebrow="Favorites" value={notesState.counts.favorites} label="Pinned notes ready to open." accent="blue" />
          <DashboardCard
            eyebrow="Task Progress"
            value={`${tasksState.progress.completed}/${tasksState.progress.total}`}
            label="Completed tasks across all sections."
          />
          <DashboardCard eyebrow="Upcoming" value={tasksState.counts.upcoming} label="Tasks scheduled beyond today." accent="blue" />
        </div>

        <div className="dashboard-columns">
          <section className="surface-card">
            <div className="surface-card__header">
              <div>
                <p className="section-label">Recent Notes</p>
                <h3>Continue writing</h3>
              </div>
            </div>

            {notesState.loading ? (
              <div className="skeleton-list">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
                <div className="skeleton-card" />
              </div>
            ) : null}

            {!notesState.loading && notesState.notes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__art" />
                <h4>No notes yet</h4>
                <p>Create your first note to start building your workspace.</p>
              </div>
            ) : null}

            {!notesState.loading && notesState.notes.length > 0 ? (
              <div className="quick-list">
                {notesState.notes.slice(0, 4).map((note) => (
                  <button key={note.id} className="quick-list__item" type="button" onClick={() => navigate(`/notes/${note.id}`)}>
                    <strong>{note.title}</strong>
                    <span>{note.excerpt || "Empty note"}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="surface-card">
            <div className="surface-card__header">
              <div>
                <p className="section-label">Tags</p>
                <h3>Organize faster</h3>
              </div>
            </div>

            {notesState.availableTags.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-state__art empty-state__art--small" />
                <p>Add tags to notes and they will appear here.</p>
              </div>
            ) : (
              <div className="tag-cloud">
                {notesState.availableTags.map((tag) => (
                  <button key={tag} className="tag-chip" type="button" onClick={() => notesState.setTagFilter(tag)}>
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </AppShell>
  );
}

