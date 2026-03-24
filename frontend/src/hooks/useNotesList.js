import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { useDebouncedValue } from "./useDebouncedValue";

export function useNotesList() {
  const { token, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 12 });
  const [counts, setCounts] = useState({ all: 0, favorites: 0, archived: 0, trash: 0 });
  const [availableTags, setAvailableTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search, 350);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, section, tagFilter, sortBy, sortOrder]);

  useEffect(() => {
    let ignore = false;

    async function fetchNotes() {
      setLoading(true);
      setError("");

      try {
        const response = await api.notes.list(token, {
          q: debouncedSearch,
          section,
          tag: tagFilter,
          sortBy,
          sortOrder,
          page,
          limit: 12
        });

        if (!ignore) {
          setNotes(response.notes);
          setPagination(response.pagination);
          setCounts(response.counts || { all: 0, favorites: 0, archived: 0, trash: 0 });
          setAvailableTags(response.availableTags || []);
        }
      } catch (err) {
        if (err.status === 401) {
          logout();
          return;
        }

        if (!ignore) {
          setError(err.message || "Unable to load notes.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (token) {
      fetchNotes();
    }

    return () => {
      ignore = true;
    };
  }, [token, page, debouncedSearch, section, tagFilter, sortBy, sortOrder, refreshKey, logout]);

  const reloadNotes = () => setRefreshKey((value) => value + 1);

  const handleMutationError = (err, fallbackMessage) => {
    setError(err.message || fallbackMessage);
    throw err;
  };

  const createNote = async (payload) => {
    try {
      setError("");
      const response = await api.notes.create(token, payload);
      reloadNotes();
      return response.note;
    } catch (err) {
      handleMutationError(err, "Unable to create note.");
    }
  };

  const togglePin = async (noteId) => {
    try {
      setError("");
      const response = await api.notes.togglePin(token, noteId);
      reloadNotes();
      return response.note;
    } catch (err) {
      handleMutationError(err, "Unable to update pinned state.");
    }
  };

  const archiveNote = async (noteId) => {
    try {
      setError("");
      const response = await api.notes.archive(token, noteId);
      reloadNotes();
      return response.note;
    } catch (err) {
      handleMutationError(err, "Unable to archive note.");
    }
  };

  const restoreArchivedNote = async (noteId) => {
    try {
      setError("");
      const response = await api.notes.restoreArchive(token, noteId);
      reloadNotes();
      return response.note;
    } catch (err) {
      handleMutationError(err, "Unable to restore archived note.");
    }
  };

  const trashNote = async (noteId) => {
    try {
      setError("");
      const response = await api.notes.remove(token, noteId);
      reloadNotes();
      return response.note;
    } catch (err) {
      handleMutationError(err, "Unable to move note to trash.");
    }
  };

  const restoreFromTrash = async (noteId) => {
    try {
      setError("");
      const response = await api.notes.restoreFromTrash(token, noteId);
      reloadNotes();
      return response.note;
    } catch (err) {
      handleMutationError(err, "Unable to restore note from trash.");
    }
  };

  const permanentlyDeleteNote = async (noteId) => {
    try {
      setError("");
      await api.notes.permanentDelete(token, noteId);
      reloadNotes();
    } catch (err) {
      handleMutationError(err, "Unable to permanently delete note.");
    }
  };

  return {
    notes,
    search,
    setSearch,
    section,
    setSection,
    tagFilter,
    setTagFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    pagination,
    counts,
    availableTags,
    loading,
    error,
    reloadNotes,
    createNote,
    togglePin,
    archiveNote,
    restoreArchivedNote,
    trashNote,
    restoreFromTrash,
    permanentlyDeleteNote
  };
}
