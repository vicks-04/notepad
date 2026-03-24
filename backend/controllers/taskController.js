import mongoose from "mongoose";
import Task from "../models/Task.js";
import Note from "../models/Note.js";

const MAX_LIMIT = 50;
const PRIORITY_WEIGHT = {
  low: 1,
  medium: 2,
  high: 3
};

function buildPagination(rawPage, rawLimit) {
  const page = Math.max(parseInt(rawPage || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(rawLimit || "15", 10), 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function taskNotFound(next, res, message = "Task not found.") {
  res.status(404);
  return next(new Error(message));
}

function serializeTask(task) {
  return {
    id: task._id,
    title: task.title,
    description: task.description || "",
    completed: task.completed,
    dueDate: task.dueDate,
    priority: task.priority,
    noteId: task.noteId?._id || task.noteId || null,
    noteTitle: task.noteId?.title || "",
    order: task.order || 0,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

async function validateNoteOwnership(userId, noteId) {
  if (!noteId) {
    return null;
  }

  const note = await Note.findOne({
    _id: noteId,
    user: userId,
    isDeleted: false
  }).select("title");

  if (!note) {
    const error = new Error("Linked note not found.");
    error.statusCode = 404;
    throw error;
  }

  return note;
}

async function computeNextOrder(userId) {
  const latestTask = await Task.findOne({ userId }).sort({ order: -1, createdAt: -1 }).select("order").lean();
  return latestTask ? latestTask.order + 1 : 1;
}

function buildTaskFilter(userId, query) {
  const filter = { userId };
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  if (query.noteId) {
    filter.noteId = query.noteId;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.completed === "true") {
    filter.completed = true;
  } else if (query.completed === "false") {
    filter.completed = false;
  }

  switch (query.section) {
    case "today":
      filter.completed = false;
      filter.dueDate = { $gte: todayStart, $lte: todayEnd };
      break;
    case "upcoming":
      filter.completed = false;
      filter.dueDate = { $gt: todayEnd };
      break;
    case "completed":
      filter.completed = true;
      break;
    default:
      break;
  }

  return filter;
}

function buildTaskSort(sortBy = "dueDate", sortOrder = "asc") {
  if (sortBy === "priority") {
    return { priority: sortOrder === "desc" ? -1 : 1, dueDate: 1, order: 1, createdAt: -1 };
  }

  if (sortBy === "createdAt") {
    return { createdAt: sortOrder === "desc" ? -1 : 1, order: 1 };
  }

  return { dueDate: 1, completed: 1, order: 1, createdAt: -1 };
}

async function getTaskCounts(userId) {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const [all, today, upcoming, completed, total, done] = await Promise.all([
    Task.countDocuments({ userId, completed: false }),
    Task.countDocuments({ userId, completed: false, dueDate: { $gte: todayStart, $lte: todayEnd } }),
    Task.countDocuments({ userId, completed: false, dueDate: { $gt: todayEnd } }),
    Task.countDocuments({ userId, completed: true }),
    Task.countDocuments({ userId }),
    Task.countDocuments({ userId, completed: true })
  ]);

  return {
    sections: { all, today, upcoming, completed },
    progress: { completed: done, total }
  };
}

function sortTasksInMemory(tasks, sortBy, sortOrder) {
  if (sortBy !== "priority") {
    return tasks;
  }

  return [...tasks].sort((left, right) => {
    const leftWeight = PRIORITY_WEIGHT[left.priority] || 0;
    const rightWeight = PRIORITY_WEIGHT[right.priority] || 0;

    if (sortOrder === "desc") {
      return rightWeight - leftWeight;
    }

    return leftWeight - rightWeight;
  });
}

export async function createTask(req, res, next) {
  try {
    const { title, description = "", dueDate = null, priority = "medium", noteId = null } = req.body;

    if (!title || !title.trim()) {
      res.status(400);
      throw new Error("Task title is required.");
    }

    await validateNoteOwnership(req.user._id, noteId);

    const task = await Task.create({
      title: title.trim(),
      description,
      dueDate: dueDate || null,
      priority,
      noteId,
      userId: req.user._id,
      order: await computeNextOrder(req.user._id)
    });

    const populatedTask = await Task.findById(task._id).populate("noteId", "title").lean();

    res.status(201).json({
      task: serializeTask(populatedTask)
    });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error);
  }
}

export async function listTasks(req, res, next) {
  try {
    const { page, limit, section = "all", priority = "", completed, noteId = "", sortBy = "dueDate", sortOrder = "asc" } = req.query;
    const { page: currentPage, limit: currentLimit, skip } = buildPagination(page, limit);
    const filter = buildTaskFilter(req.user._id, {
      section,
      priority,
      completed,
      noteId: noteId || ""
    });
    const sort = buildTaskSort(sortBy, sortOrder);

    const [tasks, total, counts] = await Promise.all([
      Task.find(filter).populate("noteId", "title").sort(sort).skip(skip).limit(currentLimit).lean(),
      Task.countDocuments(filter),
      getTaskCounts(req.user._id)
    ]);

    const serializedTasks = sortTasksInMemory(tasks.map(serializeTask), sortBy, sortOrder);

    res.json({
      tasks: serializedTasks,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.max(Math.ceil(total / currentLimit), 1)
      },
      filters: {
        section,
        priority,
        sortBy,
        sortOrder,
        noteId: noteId || "",
        completed: completed || ""
      },
      counts: counts.sections,
      progress: counts.progress
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { title, description = "", dueDate = null, priority = "medium", noteId = null, completed, order } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return taskNotFound(next, res);
    }

    if (!title || !title.trim()) {
      res.status(400);
      throw new Error("Task title is required.");
    }

    await validateNoteOwnership(req.user._id, noteId);

    task.title = title.trim();
    task.description = description;
    task.dueDate = dueDate || null;
    task.priority = priority;
    task.noteId = noteId || null;

    if (typeof completed === "boolean") {
      task.completed = completed;
    }

    if (typeof order === "number") {
      task.order = order;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id).populate("noteId", "title").lean();

    res.json({
      task: serializeTask(populatedTask)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return taskNotFound(next, res);
    }
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return taskNotFound(next, res);
    }

    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return taskNotFound(next, res);
    }
    next(error);
  }
}

export async function toggleTaskCompletion(req, res, next) {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!task) {
      return taskNotFound(next, res);
    }

    task.completed = !task.completed;
    await task.save();

    const populatedTask = await Task.findById(task._id).populate("noteId", "title").lean();

    res.json({
      task: serializeTask(populatedTask)
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return taskNotFound(next, res);
    }
    next(error);
  }
}
