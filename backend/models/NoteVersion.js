import mongoose from "mongoose";

const noteVersionSchema = new mongoose.Schema(
  {
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      default: "",
      maxlength: 50000
    },
    tags: {
      type: [String],
      default: []
    },
    snapshotUpdatedAt: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      enum: ["update", "restore"],
      default: "update"
    }
  },
  {
    timestamps: true
  }
);

noteVersionSchema.index({ note: 1, createdAt: -1 });
noteVersionSchema.index({ user: 1, note: 1, createdAt: -1 });

export default mongoose.model("NoteVersion", noteVersionSchema);
