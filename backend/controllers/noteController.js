import mongoose from "mongoose";
import crypto from "crypto";
import Note from "../models/Note.js";
import NoteVersion from "../models/NoteVersion.js";
import Task from "../models/Task.js";

const MAX_LIMIT = 50;
const MAX_ACTIVITY_ITEMS = 60;
const MAX_VERSION_REFERENCES = 200;

function buildPagination(rawPage, rawLimit) {
  const page = Math.max(parseInt(rawPage || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(rawLimit || "20", 10), 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function normalizeTags(rawTags) {
  const source = Array.isArray(rawTags) ? rawTags : typeof rawTags === "string" ? rawTags.split(",") : [];

  return [...new Set(source.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
}

function appendActivity(note, action, details) {
  note.activityLog.unshift({
    action,
    details,
    createdAt: new Date()
  });
  note.activityLog = note.activityLog.slice(0, MAX_ACTIVITY_ITEMS);
}

function buildShareUrl(shareToken) {
  if (!shareToken) {
    return "";
  }

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `${clientUrl.replace(/\/$/, "")}/shared/${shareToken}`;
}

function serializeNote(note) {
  return {
    id: note._id,
    title: note.title,
    content: note.content,
    excerpt: note.content.slice(0, 160),
    tags: note.tags || [],
    isPinned: note.isPinned,
    isArchived: note.isArchived,
    isDeleted: note.isDeleted,
    shareToken: note.shareToken || "",
    shareUrl: buildShareUrl(note.shareToken),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    archivedAt: note.archivedAt || null,
    deletedAt: note.deletedAt || null
  };
}

async function createVersionSnapshot(note, reason = "update") {
  const version = await NoteVersion.create({
    note: note._id,
    user: note.user,
    title: note.title,
    content: note.content,
    tags: note.tags || [],
    snapshotUpdatedAt: note.updatedAt,
    reason
  });

  note.versions.unshift(version._id);
  note.versions = note.versions.slice(0, MAX_VERSION_REFERENCES);

  return version;
}

function buildListFilter(userId, query) {
  const filter = {
    user: userId
  };

  switch (query.section) {
    case "favorites":
      filter.isPinned = true;
      filter.isArchived = false;
      filter.isDeleted = false;
      break;
    case "archived":
      filter.isArchived = true;
      filter.isDeleted = false;
      break;
    case "trash":
      filter.isDeleted = true;
      break;
    default:
      filter.isArchived = false;
      filter.isDeleted = false;
      break;
  }

  if (query.tag) {
    filter.tags = query.tag;
  }

  if (query.favoritesOnly && query.section !== "favorites") {
    filter.isPinned = true;
  }

  if (query.searchTerm) {
    filter.$text = { $search: query.searchTerm };
  }

  return filter;
}

function buildSort(query) {
  const sortField = query.sortBy === "createdAt" ? "createdAt" : "updatedAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  if (query.searchTerm) {
    return {
      score: { $meta: "textScore" },
      isPinned: -1,
      [sortField]: sortOrder
    };
  }

  return {
    isPinned: -1,
    [sortField]: sortOrder
  };
}

async function getSectionCounts(userId) {
  const [all, favorites, archived, trash] = await Promise.all([
    Note.countDocuments({ user: userId, isDeleted: false, isArchived: false }),
    Note.countDocuments({ user: userId, isDeleted: false, isArchived: false, isPinned: true }),
    Note.countDocuments({ user: userId, isDeleted: false, isArchived: true }),
    Note.countDocuments({ user: userId, isDeleted: true })
  ]);

  return { all, favorites, archived, trash };
}

async function createShareToken() {
  while (true) {
    const candidate = crypto.randomBytes(18).toString("hex");
    const exists = await Note.exists({ shareToken: candidate });

    if (!exists) {
      return candidate;
    }
  }
}

function mapVersion(version) {
  return {
    id: version._id,
    title: version.title,
    content: version.content,
    tags: version.tags || [],
    reason: version.reason,
    snapshotUpdatedAt: version.snapshotUpdatedAt,
    createdAt: version.createdAt
  };
}

function mapActivityItem(item) {
  return {
    action: item.action,
    details: item.details,
    createdAt: item.createdAt
  };
}

function noteNotFound(next, res, message = "Note not found.") {
  res.status(404);
  return next(new Error(message));
}

export async function listNotes(req, res, next) {
  try {
    const { q = "", page, limit, section = "all", tag = "", sortBy = "updatedAt", sortOrder = "desc" } = req.query;
    const { page: currentPage, limit: currentLimit, skip } = buildPagination(page, limit);
    const query = {
      section,
      tag: tag.trim().toLowerCase(),
      sortBy,
      sortOrder,
      favoritesOnly: req.query.favoritesOnly === "true",
      searchTerm: q.trim()
    };
    const filter = buildListFilter(req.user._id, query);
    const projection = query.searchTerm ? { score: { $meta: "textScore" } } : {};
    const sort = buildSort(query);

    const [notes, total, availableTags, counts] = await Promise.all([
      Note.find(filter, projection).sort(sort).skip(skip).limit(currentLimit).lean(),
      Note.countDocuments(filter),
      Note.distinct("tags", { user: req.user._id, isDeleted: false }),
      getSectionCounts(req.user._id)
    ]);

    res.json({
      notes: notes.map(serializeNote),
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.max(Math.ceil(total / currentLimit), 1)
      },
      filters: {
        section: query.section,
        tag: query.tag,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      },
      availableTags: availableTags.sort(),
      counts
    });
  } catch (error) {
    next(error);
  }
}

export async function getNoteById(req, res, next) {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    }).lean();

    if (!note) {
      return noteNotFound(next, res);
    }

    res.json({
      note: serializeNote(note)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}

export async function createNote(req, res, next) {
  try {
    const { title, content = "", tags = [] } = req.body;

    if (!title || !title.trim()) {
      res.status(400);
      throw new Error("Title is required.");
    }

    const note = await Note.create({
      user: req.user._id,
      title: title.trim(),
      content,
      tags: normalizeTags(tags),
      activityLog: [
        {
          action: "created",
          details: "Note created."
        }
      ]
    });

    res.status(201).json({
      note: serializeNote(note)
    });
  } catch (error) {
    next(error);
  }
}

export async function updateNote(req, res, next) {
  try {
    const { title, content = "", tags = [] } = req.body;

    if (!title || !title.trim()) {
      res.status(400);
      throw new Error("Title is required.");
    }

    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!note) {
      return noteNotFound(next, res);
    }

    if (note.isDeleted) {
      res.status(400);
      throw new Error("Restore this note from trash before editing it.");
    }

    const nextTitle = title.trim();
    const nextTags = normalizeTags(tags);
    const hasChanged =
      note.title !== nextTitle ||
      note.content !== content ||
      JSON.stringify(note.tags || []) !== JSON.stringify(nextTags);

    if (!hasChanged) {
      return res.json({
        note: serializeNote(note)
      });
    }

    await createVersionSnapshot(note, "update");

    note.title = nextTitle;
    note.content = content;
    note.tags = nextTags;
    appendActivity(note, "updated", "Note updated.");
    await note.save();

    res.json({
      note: serializeNote(note)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}

export async function togglePinNote(req, res, next) {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!note) {
      return noteNotFound(next, res);
    }

    if (note.isDeleted) {
      res.status(400);
      throw new Error("You cannot pin a note in trash.");
    }

    note.isPinned = !note.isPinned;
    appendActivity(note, note.isPinned ? "pinned" : "unpinned", note.isPinned ? "Note pinned." : "Note unpinned.");
    await note.save();

    res.json({
      message: note.isPinned ? "Note pinned successfully." : "Note unpinned successfully.",
      note: serializeNote(note)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}

export async function archiveNote(req, res, next) {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!note) {
      return noteNotFound(next, res);
    }

    if (note.isDeleted) {
      res.status(400);
      throw new Error("You cannot archive a note that is in trash.");
    }

    note.isArchived = true;
    note.archivedAt = new Date();
    appendActivity(note, "archived", "Note archived.");
    await note.save();

    res.json({
      message: "Note archived successfully.",
      note: serializeNote(note)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}

export async function restoreArchivedNote(req, res, next) {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!note) {
      return noteNotFound(next, res);
    }

    note.isArchived = false;
    note.archivedAt = null;
    appendActivity(note, "unarchived", "Note restored from archive.");
    await note.save();

    res.json({
      message: "Note restored from archive.",
      note: serializeNote(note)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}

export async function deleteNote(req, res, next) {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!note) {
      return noteNotFound(next, res);
    }

    if (!note.isDeleted) {
      note.isDeleted = true;
      note.deletedAt = new Date();
      note.isArchived = false;
      note.archivedAt = null;
      appendActivity(note, "deleted", "Note moved to trash.");
      await note.save();
    }

    res.json({
      message: "Note moved to trash.",
      note: serializeNote(note)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}

export async function restoreNoteFromTrash(req, res, next) {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!note) {
      return noteNotFound(next, res);
    }

    note.isDeleted = false;
    note.deletedAt = null;
    appendActivity(note, "restored_from_trash", "Note restored from trash.");
    await note.save();

    res.json({
      message: "Note restored from trash.",
      note: serializeNote(note)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}

export async function permanentlyDeleteNote(req, res, next) {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!note) {
      return noteNotFound(next, res);
    }

    if (!note.isDeleted) {
      res.status(400);
      throw new Error("Move the note to trash before permanently deleting it.");
    }

    await Promise.all([
      Note.deleteOne({ _id: note._id }),
      NoteVersion.deleteMany({ note: note._id, user: req.user._id }),
      Task.updateMany({ noteId: note._id, userId: req.user._id }, { $set: { noteId: null } })
    ]);

    res.json({ message: "Note permanently deleted." });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}

export async function getNoteHistory(req, res, next) {
  try {
    const { page, limit } = req.query;
    const { page: currentPage, limit: currentLimit, skip } = buildPagination(page, limit);

    const noteExists = await Note.exists({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!noteExists) {
      return noteNotFound(next, res);
    }

    const [versions, total] = await Promise.all([
      NoteVersion.find({
        note: req.params.noteId,
        user: req.user._id
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(currentLimit)
        .lean(),
      NoteVersion.countDocuments({
        note: req.params.noteId,
        user: req.user._id
      })
    ]);

    res.json({
      versions: versions.map(mapVersion),
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.max(Math.ceil(total / currentLimit), 1)
      }
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}

export async function restoreNoteVersion(req, res, next) {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!note) {
      return noteNotFound(next, res);
    }

    const version = await NoteVersion.findOne({
      _id: req.params.versionId,
      note: note._id,
      user: req.user._id
    });

    if (!version) {
      res.status(404);
      throw new Error("Version not found.");
    }

    await createVersionSnapshot(note, "restore");

    note.title = version.title;
    note.content = version.content;
    note.tags = version.tags || [];
    appendActivity(note, "restored_version", "Older version restored.");
    await note.save();

    res.json({
      message: "Version restored successfully.",
      note: serializeNote(note)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res, "Version not found.");
    }

    next(error);
  }
}

export async function shareNote(req, res, next) {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    });

    if (!note) {
      return noteNotFound(next, res);
    }

    if (note.isDeleted) {
      res.status(400);
      throw new Error("Restore this note from trash before sharing it.");
    }

    if (!note.shareToken) {
      note.shareToken = await createShareToken();
      appendActivity(note, "shared", "Public read-only share link generated.");
      await note.save();
    }

    res.json({
      message: "Share link generated successfully.",
      shareUrl: buildShareUrl(note.shareToken),
      note: serializeNote(note)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}

export async function getSharedNoteByToken(req, res, next) {
  try {
    const note = await Note.findOne({
      shareToken: req.params.shareToken,
      isDeleted: false
    }).lean();

    if (!note) {
      res.status(404);
      throw new Error("Shared note not found.");
    }

    res.json({
      note: {
        title: note.title,
        content: note.content,
        tags: note.tags || [],
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        readOnly: true
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getNoteActivity(req, res, next) {
  try {
    const note = await Note.findOne({
      _id: req.params.noteId,
      user: req.user._id
    })
      .select("activityLog title")
      .lean();

    if (!note) {
      return noteNotFound(next, res);
    }

    res.json({
      title: note.title,
      activityLog: (note.activityLog || []).map(mapActivityItem)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return noteNotFound(next, res);
    }

    next(error);
  }
}
