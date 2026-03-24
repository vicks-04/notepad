import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import TaskListPanel from "../components/TaskListPanel";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { useNotesList } from "../hooks/useNotesList";
import { useTasksList } from "../hooks/useTasksList";

export default function Tasks() {
  const navigate = useNavigate();
  const { taskSection } = useParams();
  const { user, logout } = useAuth();
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
        onTrashNote: notesState.trashNote,
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
          searchPlaceholder="Search notes from the task view"
          onLogout={logout}
        />
      }
      onCreateNote={handleCreateNote}
      onCreateTask={handleCreateTask}
    >
      <section className="page page--fade">
        <div className="hero-panel">
          <div>
            <p className="section-label">Tasks</p>
            <h2>Minimal, focused task execution</h2>
            <p>Manage today, upcoming, and completed work with fast inline edits and calm, Google Tasks-style polish.</p>
          </div>
        </div>

        <TaskListPanel title="Tasks" subtitle="Click any item to refine it inline." tasksState={tasksState} />
      </section>
    </AppShell>
  );
}
