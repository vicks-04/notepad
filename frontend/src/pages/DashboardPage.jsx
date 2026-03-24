import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAuth } from "../context/AuthContext";
import { useNotesList } from "../hooks/useNotesList";
import { useTasksList } from "../hooks/useTasksList";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notesState = useNotesList();
  const tasksState = useTasksList({ limit: 10 });

  const handleCreate = async () => {
    try {
      const note = await notesState.createNote({
        title: "Untitled note",
        content: ""
      });

      navigate(`/notes/${note.id}`);
    } catch (error) {
      return null;
    }
  };

  const handleTrash = async (noteId) => {
    const confirmed = window.confirm("Move this note to trash?");

    if (!confirmed) return;

    try {
      await notesState.trashNote(noteId);
    } catch (error) {
      return null;
    }
  };

  const handlePermanentDelete = async (noteId) => {
    const confirmed = window.confirm("Delete this note forever?");

    if (!confirmed) return;

    try {
      await notesState.permanentlyDeleteNote(noteId);
    } catch (error) {
      return null;
    }
  };

  return (
    <AppShell
      notesProps={{
        ...notesState,
        activeNoteId: "",
        onCreateNote: handleCreate,
        onTogglePin: notesState.togglePin,
        onArchiveNote: notesState.archiveNote,
        onRestoreArchived: notesState.restoreArchivedNote,
        onTrashNote: handleTrash,
        onRestoreTrash: notesState.restoreFromTrash,
        onPermanentDelete: handlePermanentDelete,
        onLogout: logout
      }}
      tasksProps={tasksState}
    >
      <section className="dashboard">
        <div className="dashboard__hero">
          <div>
            <p className="section-label">Dashboard</p>
            <h2>{user?.name ? `${user.name}'s workspace` : "Your workspace"}</h2>
            <p>
              Manage favorites, archived notes, trash recovery, tags, and shareable read-only links from one workspace.
            </p>
          </div>
          <button className="button button--primary" onClick={handleCreate}>
            Create a note
          </button>
        </div>

        <div className="dashboard__grid">
          <article className="summary-card">
            <p className="section-label">Active Notes</p>
            <strong>{notesState.counts.all}</strong>
            <span>Notes currently visible in your main workspace.</span>
          </article>

          <article className="summary-card">
            <p className="section-label">Favorites</p>
            <strong>{notesState.counts.favorites}</strong>
            <span>Pinned notes stay surfaced at the top for fast access.</span>
          </article>

          <article className="summary-card">
            <p className="section-label">Archived + Trash</p>
            <strong>{notesState.counts.archived + notesState.counts.trash}</strong>
            <span>Archived notes and trash entries remain recoverable when you need them.</span>
          </article>

          <article className="summary-card">
            <p className="section-label">Tasks Progress</p>
            <strong>
              {tasksState.progress.completed}/{tasksState.progress.total}
            </strong>
            <span>Tasks completed across your workspace.</span>
          </article>
        </div>

        <section className="recent-card">
          <div className="recent-card__header">
            <div>
              <p className="section-label">Tags</p>
              <h3>Filter your note library quickly</h3>
            </div>
          </div>

          {notesState.availableTags.length === 0 ? <p>No tags yet. Add tags in the editor to organize your notes.</p> : null}

          {notesState.availableTags.length > 0 ? (
            <div className="recent-list">
              {notesState.availableTags.map((tag) => (
                <button
                  key={tag}
                  className="recent-list__item"
                  onClick={() => notesState.setTagFilter(tag)}
                  type="button"
                >
                  <strong>{tag}</strong>
                  <span>Filter notes tagged with {tag}.</span>
                  <small>Click to apply filter</small>
                </button>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </AppShell>
  );
}
