function normalizeApiUrl(value) {
  if (!value) {
    return value;
  }

  const trimmedValue = value.trim().replace(/\/+$/, "");

  if (!trimmedValue) {
    return "";
  }

  return trimmedValue.endsWith("/api") ? trimmedValue : `${trimmedValue}/api`;
}

const API_URL =
  normalizeApiUrl(import.meta.env.VITE_API_URL) ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

async function request(path, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function authHeaders(token) {
  return token
    ? {
        Authorization: `Bearer ${token}`
      }
    : {};
}

export const api = {
  auth: {
    register: (payload) =>
      request("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    login: (payload) =>
      request("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    me: (token) =>
      request("/auth/me", {
        headers: authHeaders(token)
      })
  },
  notes: {
    list: (token, query = {}) => {
      const params = new URLSearchParams();

      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });

      const search = params.toString();
      return request(`/notes${search ? `?${search}` : ""}`, {
        headers: authHeaders(token)
      });
    },
    get: (token, noteId) =>
      request(`/notes/${noteId}`, {
        headers: authHeaders(token)
      }),
    create: (token, payload) =>
      request("/notes", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload)
      }),
    update: (token, noteId, payload) =>
      request(`/notes/${noteId}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(payload)
      }),
    togglePin: (token, noteId) =>
      request(`/notes/pin/${noteId}`, {
        method: "POST",
        headers: authHeaders(token)
      }),
    archive: (token, noteId) =>
      request(`/notes/${noteId}/archive`, {
        method: "POST",
        headers: authHeaders(token)
      }),
    restoreArchive: (token, noteId) =>
      request(`/notes/${noteId}/archive/restore`, {
        method: "POST",
        headers: authHeaders(token)
      }),
    remove: (token, noteId) =>
      request(`/notes/${noteId}`, {
        method: "DELETE",
        headers: authHeaders(token)
      }),
    restoreFromTrash: (token, noteId) =>
      request(`/notes/${noteId}/trash/restore`, {
        method: "POST",
        headers: authHeaders(token)
      }),
    permanentDelete: (token, noteId) =>
      request(`/notes/${noteId}/permanent`, {
        method: "DELETE",
        headers: authHeaders(token)
      }),
    share: (token, noteId) =>
      request(`/notes/${noteId}/share`, {
        method: "POST",
        headers: authHeaders(token)
      }),
    history: (token, noteId, query = {}) => {
      const params = new URLSearchParams();

      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });

      const search = params.toString();
      return request(`/notes/${noteId}/history${search ? `?${search}` : ""}`, {
        headers: authHeaders(token)
      });
    },
    activity: (token, noteId) =>
      request(`/notes/${noteId}/activity`, {
        headers: authHeaders(token)
      }),
    restore: (token, noteId, versionId) =>
      request(`/notes/${noteId}/versions/${versionId}/restore`, {
        method: "POST",
        headers: authHeaders(token)
      }),
    getShared: (shareToken) =>
      request(`/notes/shared/${shareToken}`)
  },
  tasks: {
    create: (token, payload) =>
      request("/tasks/create", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload)
      }),
    list: (token, query = {}) => {
      const params = new URLSearchParams();

      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.set(key, String(value));
        }
      });

      const search = params.toString();
      return request(`/tasks${search ? `?${search}` : ""}`, {
        headers: authHeaders(token)
      });
    },
    update: (token, taskId, payload) =>
      request(`/tasks/${taskId}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(payload)
      }),
    remove: (token, taskId) =>
      request(`/tasks/${taskId}`, {
        method: "DELETE",
        headers: authHeaders(token)
      }),
    toggle: (token, taskId) =>
      request(`/tasks/${taskId}/toggle`, {
        method: "PATCH",
        headers: authHeaders(token)
      })
  }
};
