import express from "express";
import {
  archiveNote,
  createNote,
  deleteNote,
  getNoteById,
  getNoteActivity,
  getNoteHistory,
  getSharedNoteByToken,
  listNotes,
  permanentlyDeleteNote,
  restoreNoteVersion,
  restoreArchivedNote,
  restoreNoteFromTrash,
  shareNote,
  togglePinNote,
  updateNote
} from "../controllers/noteController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/shared/:shareToken", getSharedNoteByToken);

router.use(protect);

router.route("/").get(listNotes).post(createNote);
router.post("/pin/:noteId", togglePinNote);
router.post("/:noteId/archive", archiveNote);
router.post("/:noteId/archive/restore", restoreArchivedNote);
router.post("/:noteId/trash/restore", restoreNoteFromTrash);
router.delete("/:noteId/permanent", permanentlyDeleteNote);
router.post("/:noteId/share", shareNote);
router.get("/:noteId/activity", getNoteActivity);
router.get("/:noteId/history", getNoteHistory);
router.post("/:noteId/versions/:versionId/restore", restoreNoteVersion);
router.route("/:noteId").get(getNoteById).put(updateNote).delete(deleteNote);

export default router;
