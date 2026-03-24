import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import NoteActivityLog from "../components/NoteActivityLog";
import NoteCard from "../components/NoteCard";
import NoteEditorForm from "../components/NoteEditorForm";
import NoteHistory from "../components/NoteHistory";
import TaskListPanel from "../components/TaskListPanel";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { useNotesList } from "../hooks/useNotesList";
import { useTasksList } from "../hooks/useTasksList";
import { api } from "../lib/api";

export default function Notes() {
  const navigate = useNavigate();
  const { noteId } = useParams();
  const { user, token, logout } = useAuth();
  const notesState = useNotesList();
  const tasksState = useTasksList({ limit: 10 });
  const noteTasksBase = useTasksList({ noteId, limit: 8, sortBy: "dueDate", sortOrder: "asc" });
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 5 });
  const [restoringVersionId, setRestoringVersionId] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  useEffect(() => {
    setHistoryPage(1);
  }, [noteId]);

  useEffect(() => {
    let ignore = false;

    async function fetchNote() {
      setLoading(true);
      setError("");

      try {
        const response = await api.notes.get(token, noteId);

        if (ignore) return;

        setNote(response.note);
        setTitle(response.note.title);
        setContent(response.note.content);
        setTagsInput((response.note.tags || []).join(", "));
        setSaveMessage(`Updated ${new Date(response.note.updatedAt).toLocaleString()}`);
        setActionMessage("");
      } catch (err) {
        if (err.status === 401) {
          logout();
          return;
        }

        if (err.status === 404) {
          navigate("/", { replace: true });
          return;
        }

        if (!ignore) {
          setError(err.message || "Unable to load note.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (noteId) {
      fetchNote();
    }

    return () => {
      ignore = true;
    };
  }, [noteId, token, logout, navigate]);

  useEffect(() => {
    let ignore = false;

    async function fetchHistory() {
      setHistoryLoading(true);

      try {
        const response = await api.notes.history(token, noteId, { page: historyPage, limit: 5 });

        if (!ignore) {
          setHistory(response.versions);
          setHistoryPagination(response.pagination);
        }
      } catch (err) {
        if (err.status === 401) {
          logout();
        }
      } finally {
        if (!ignore) {
          setHistoryLoading(false);
        }
      }
    }

    if (noteId) {
      fetchHistory();
    }

    return () => {
      ignore = true;
    };
  }, [noteId, token, historyPage, historyRefreshKey, logout]);

  useEffect(() => {
    let ignore = false;

    async function fetchActivity() {
      setActivityLoading(true);

      try {
        const response = await api.notes.activity(token, noteId);

        if (!ignore) {
          setActivityLog(response.activityLog || []);
        }
      } catch (err) {
        if (!ignore && err.status !== 401) {
          setError(err.message || "Unable to load activity.");
        }
      } finally {
        if (!ignore) {
          setActivityLoading(false);
        }
      }
    }

    if (noteId) {
      fetchActivity();
    }

    return () => {
      ignore = true;
    };
  }, [noteId, token, activityRefreshKey]);

  const parsedTags = useMemo(() => {
    return [...new Set(tagsInput.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
  }, [tagsInput]);

  const isDirty = useMemo(() => {
    if (!note) return false;
    return (
      title !== note.title ||
      content !== note.content ||
      JSON.stringify(parsedTags) !== JSON.stringify(note.tags || [])
    );
  }, [title, content, parsedTags, note]);

  const syncNote = (nextNote, nextActionMessage = "") => {
    setNote(nextNote);
    setTitle(nextNote.title);
    setContent(nextNote.content);
    setTagsInput((nextNote.tags || []).join(", "));
    setSaveMessage(`Updated ${new Date(nextNote.updatedAt).toLocaleString()}`);
    setActionMessage(nextActionMessage);
    notesState.reloadNotes();
    setHistoryRefreshKey((value) => value + 1);
    setActivityRefreshKey((value) => value + 1);
  };

  const persistNote = async (mode = "manual") => {
    if (!note || note.isDeleted) return;
    if (!title.trim()) {
      if (mode === "manual") setError("Title is required.");
      return;
    }

    mode === "manual" ? setSaving(true) : setAutosaving(true);
    setError("");

    try {
      const response = await api.notes.update(token, noteId, { title, content, tags: parsedTags });
      syncNote(response.note, mode === "auto" ? "Autosaved" : "Saved");
    } catch (err) {
      setError(err.message || "Unable to save note.");
    } finally {
      mode === "manual" ? setSaving(false) : setAutosaving(false);
    }
  };

  useEffect(() => {
    if (!note || note.isDeleted || !isDirty || saving || autosaving) return undefined;

    const timeoutId = window.setTimeout(() => {
      void persistNote("auto");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [title, content, tagsInput, note, isDirty, saving, autosaving]);

  const handleCreateNote = async () => {
    try {
      const nextNote = await notesState.createNote({ title: "Untitled note", content: "", tags: [] });
      navigate(`/notes/${nextNote.id}`);
    } catch (err) {
      setError(err.message || "Unable to create note.");
    }
  };

  const handleCreateTask = async () => {
    try {
      await tasksState.createTask({ title: "New task", priority: "medium", noteId: noteId || null });
      noteTasksBase.reloadTasks();
    } catch (err) {
      return null;
    }
  };

  const handleTrashNote = async (selectedNoteId) => {
    if (!window.confirm("Move this note to trash?")) return;

    try {
      const updatedNote = await notesState.trashNote(selectedNoteId);

      if (selectedNoteId === noteId) {
        syncNote(updatedNote, "Moved to trash");
      }
    } catch (err) {
      setError(err.message || "Unable to move note to trash.");
    }
  };

  const handleRestore = async (versionId) => {
    if (!window.confirm("Restore this older version? Your current note will be kept as a new snapshot.")) return;

    setRestoringVersionId(versionId);
    setError("");

    try {
      const response = await api.notes.restore(token, noteId, versionId);
      syncNote(response.note, "Version restored");
      setHistoryPage(1);
    } catch (err) {
      setError(err.message || "Unable to restore version.");
    } finally {
      setRestoringVersionId("");
    }
  };

  const handleTogglePin = async (selectedNoteId = noteId) => {
    try {
      const updatedNote = await notesState.togglePin(selectedNoteId);
      if (selectedNoteId === noteId) syncNote(updatedNote, updatedNote.isPinned ? "Pinned" : "Unpinned");
    } catch (err) {
      setError(err.message || "Unable to update pinned state.");
    }
  };

  const handleArchiveToggle = async (selectedNoteId = noteId) => {
    try {
      const updatedNote =
        note?.isArchived && selectedNoteId === noteId
          ? await notesState.restoreArchivedNote(selectedNoteId)
          : await notesState.archiveNote(selectedNoteId);

      if (selectedNoteId === noteId) syncNote(updatedNote, updatedNote.isArchived ? "Archived" : "Restored from archive");
    } catch (err) {
      setError(err.message || "Unable to update archive state.");
    }
  };

  const handleShare = async () => {
    try {
      const response = await api.notes.share(token, noteId);
      syncNote(response.note, "Share link ready");

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(response.shareUrl);
        setActionMessage("Copied share link");
      }
    } catch (err) {
      setError(err.message || "Unable to share note.");
    }
  };

  const handleRestoreFromTrash = async () => {
    try {
      const updatedNote = await notesState.restoreFromTrash(noteId);
      syncNote(updatedNote, "Restored from trash");
    } catch (err) {
      setError(err.message || "Unable to restore note.");
    }
  };

  const handlePermanentDelete = async () => {
    if (!window.confirm("Delete this note forever?")) return;

    try {
      await notesState.permanentlyDeleteNote(noteId);
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to permanently delete note.");
    }
  };

  const noteTasksState = {
    ...noteTasksBase,
    createTask: async (payload) => {
      const task = await noteTasksBase.createTask({ ...payload, noteId });
      tasksState.reloadTasks();
      return task;
    },
    updateTask: async (taskId, payload, options) => {
      const task = await noteTasksBase.updateTask(taskId, payload, options);
      if (options?.refresh !== false) tasksState.reloadTasks();
      return task;
    },
    toggleTask: async (taskId) => {
      const task = await noteTasksBase.toggleTask(taskId);
      tasksState.reloadTasks();
      return task;
    },
    deleteTask: async (taskId) => {
      await noteTasksBase.deleteTask(taskId);
      tasksState.reloadTasks();
    }
  };

  return (
    <AppShell
      user={user}
      notesProps={{
        ...notesState,
        activeNoteId: noteId,
        onCreateNote: handleCreateNote,
        onTogglePin: handleTogglePin,
        onArchiveNote: handleArchiveToggle,
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
          searchPlaceholder="Search notes, tags, and knowledge"
          onLogout={logout}
        />
      }
      onCreateNote={handleCreateNote}
      onCreateTask={handleCreateTask}
    >
      <section className="page page--fade notes-workspace">
        <section className="surface-card notes-panel">
          <div className="surface-card__header">
            <div>
              <p className="section-label">Notes</p>
              <h3>Browse your library</h3>
            </div>
            <div className="panel-controls">
              <select value={notesState.sortBy} onChange={(event) => notesState.setSortBy(event.target.value)}>
                <option value="updatedAt">Last updated</option>
                <option value="createdAt">Created date</option>
              </select>
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
              <h4>No notes in this view</h4>
              <p>Create a note or change your filters to see more results.</p>
            </div>
          ) : null}

          {!notesState.loading && notesState.notes.length > 0 ? (
            <div className="notes-browser">
              {notesState.notes.map((item) => (
                <NoteCard
                  key={item.id}
                  note={item}
                  active={item.id === noteId}
                  onPinToggle={handleTogglePin}
                  onArchiveToggle={handleArchiveToggle}
                  onTrash={handleTrashNote}
                />
              ))}
            </div>
          ) : null}

          <div className="pagination">
            <button className="button button--ghost" disabled={notesState.page <= 1} onClick={() => notesState.setPage(notesState.page - 1)}>
              Prev
            </button>
            <span>
              Page {notesState.pagination.page} of {notesState.pagination.totalPages}
            </span>
            <button
              className="button button--ghost"
              disabled={notesState.page >= notesState.pagination.totalPages}
              onClick={() => notesState.setPage(notesState.page + 1)}
            >
              Next
            </button>
          </div>
        </section>

        <section className="notes-editor-column">
          {loading ? <div className="surface-card editor-loading">Loading note…</div> : null}
          {!loading && error ? <div className="panel-message panel-message--error">{error}</div> : null}

          {!loading && note ? (
            <>
              <NoteEditorForm
                note={note}
                title={title}
                content={content}
                tagsInput={tagsInput}
                onTitleChange={setTitle}
                onContentChange={setContent}
                onTagsChange={setTagsInput}
                onSave={() => persistNote("manual")}
                onTogglePin={() => handleTogglePin(noteId)}
                onArchiveToggle={() => handleArchiveToggle(noteId)}
                onTrash={() => handleTrashNote(noteId)}
                onRestoreFromTrash={handleRestoreFromTrash}
                onPermanentDelete={handlePermanentDelete}
                onShare={handleShare}
                isSaving={saving}
                isAutosaving={autosaving}
                isDirty={isDirty}
                saveMessage={saveMessage}
                actionMessage={actionMessage}
              />

              <TaskListPanel
                title="Tasks linked to this note"
                subtitle="Inline tasks that stay connected to this note."
                tasksState={noteTasksState}
                noteId={noteId}
                compact
                showNoteLink={false}
              />

              <div className="notes-editor-grid">
                <NoteHistory
                  versions={history}
                  loading={historyLoading}
                  pagination={historyPagination}
                  page={historyPage}
                  setPage={setHistoryPage}
                  onRestore={handleRestore}
                  restoringVersionId={restoringVersionId}
                />
                <NoteActivityLog activityLog={activityLog} loading={activityLoading} />
              </div>
            </>
          ) : null}
        </section>
      </section>
    </AppShell>
  );
}
