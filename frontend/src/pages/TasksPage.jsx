import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import TaskListPanel from "../components/TaskListPanel";
import { useAuth } from "../context/AuthContext";
import { useNotesList } from "../hooks/useNotesList";
import { useTasksList } from "../hooks/useTasksList";

export default function TasksPage() {
  const navigate = useNavigate();
  const { taskSection } = useParams();
  const { logout } = useAuth();
  const notesState = useNotesList();
  const tasksState = useTasksList({
    section: taskSection || "all",
    limit: 15,
    sortBy: "dueDate",
    sortOrder: "asc"
  });

  useEffect(() => {
    tasksState.setSection(taskSection || "all");
  }, [taskSection]);

  const handleCreateNote = async () => {
    try {
      const note = await notesState.createNote({
        title: "Untitled note",
        content: "",
        tags: []
      });

      navigate(`/notes/${note.id}`);
    } catch (error) {
      return null;
    }
  };

  const handleTrashNote = async (noteId) => {
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
        onCreateNote: handleCreateNote,
        onTogglePin: notesState.togglePin,
        onArchiveNote: notesState.archiveNote,
        onRestoreArchived: notesState.restoreArchivedNote,
        onTrashNote: handleTrashNote,
        onRestoreTrash: notesState.restoreFromTrash,
        onPermanentDelete: handlePermanentDelete,
        onLogout: logout
      }}
      tasksProps={tasksState}
    >
      <section className="dashboard">
        <div className="dashboard__hero">
          <div>
            <p className="section-label">Tasks</p>
            <h2>Keep work moving like Google Tasks</h2>
            <p>Track today, upcoming, and completed tasks, edit inline, and attach action items directly to notes.</p>
          </div>
        </div>

        <TaskListPanel
          title="Your task list"
          subtitle="Tasks autosave after a short pause while you edit."
          tasksState={tasksState}
        />
      </section>
    </AppShell>
  );
}

