import express from "express";
import { createTask, deleteTask, listTasks, toggleTaskCompletion, updateTask } from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/create", createTask);
router.get("/", listTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id/toggle", toggleTaskCompletion);

export default router;

