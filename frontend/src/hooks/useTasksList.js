import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export function useTasksList(options = {}) {
  const { token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [section, setSection] = useState(options.section || "all");
  const [priorityFilter, setPriorityFilter] = useState(options.priority || "");
  const [sortBy, setSortBy] = useState(options.sortBy || "dueDate");
  const [sortOrder, setSortOrder] = useState(options.sortOrder || "asc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: options.limit || 15 });
  const [counts, setCounts] = useState({ all: 0, today: 0, upcoming: 0, completed: 0 });
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const noteId = options.noteId || "";
  const limit = options.limit || 15;

  useEffect(() => {
    if (options.section) {
      setSection(options.section);
    }
  }, [options.section]);

  useEffect(() => {
    setPage(1);
  }, [section, priorityFilter, sortBy, sortOrder, noteId]);

  useEffect(() => {
    let ignore = false;

    async function fetchTasks() {
      setLoading(true);
      setError("");

      try {
        const response = await api.tasks.list(token, {
          section,
          priority: priorityFilter,
          sortBy,
          sortOrder,
          noteId,
          page,
          limit
        });

        if (!ignore) {
          setTasks(response.tasks || []);
          setPagination(response.pagination || { page: 1, totalPages: 1, total: 0, limit });
          setCounts(response.counts || { all: 0, today: 0, upcoming: 0, completed: 0 });
          setProgress(response.progress || { completed: 0, total: 0 });
        }
      } catch (err) {
        if (err.status === 401) {
          logout();
          return;
        }

        if (!ignore) {
          setError(err.message || "Unable to load tasks.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (token) {
      fetchTasks();
    }

    return () => {
      ignore = true;
    };
  }, [token, logout, section, priorityFilter, sortBy, sortOrder, noteId, page, limit, refreshKey]);

  const reloadTasks = () => setRefreshKey((value) => value + 1);

  const mergeTask = (updatedTask) => {
    setTasks((current) => {
      const index = current.findIndex((task) => task.id === updatedTask.id);

      if (index === -1) {
        return current;
      }

      const next = [...current];
      next[index] = updatedTask;
      return next;
    });
  };

  const createTask = async (payload) => {
    try {
      setError("");
      const response = await api.tasks.create(token, payload);
      reloadTasks();
      return response.task;
    } catch (err) {
      setError(err.message || "Unable to create task.");
      throw err;
    }
  };

  const updateTask = async (taskId, payload, options = {}) => {
    try {
      setError("");
      const response = await api.tasks.update(token, taskId, payload);
      mergeTask(response.task);

      if (options.refresh !== false) {
        reloadTasks();
      }

      return response.task;
    } catch (err) {
      setError(err.message || "Unable to update task.");
      throw err;
    }
  };

  const toggleTask = async (taskId) => {
    try {
      setError("");
      const response = await api.tasks.toggle(token, taskId);
      reloadTasks();
      return response.task;
    } catch (err) {
      setError(err.message || "Unable to toggle task.");
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setError("");
      await api.tasks.remove(token, taskId);
      reloadTasks();
    } catch (err) {
      setError(err.message || "Unable to delete task.");
      throw err;
    }
  };

  return {
    tasks,
    section,
    setSection,
    priorityFilter,
    setPriorityFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    pagination,
    counts,
    progress,
    loading,
    error,
    reloadTasks,
    createTask,
    updateTask,
    toggleTask,
    deleteTask
  };
}
