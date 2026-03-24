import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true
    },
    details: {
      type: String,
      default: "",
      trim: true,
      maxlength: 240
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const noteSchema = new mongoose.Schema(
  {
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
    isPinned: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    },
    shareToken: {
      type: String,
      default: undefined,
      trim: true
    },
    versions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NoteVersion"
      }
    ],
    activityLog: {
      type: [activityLogSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

noteSchema.index({ user: 1, isDeleted: 1, isArchived: 1, isPinned: -1, updatedAt: -1 });
noteSchema.index({ user: 1, isDeleted: 1, isArchived: 1, createdAt: -1 });
noteSchema.index({ user: 1, tags: 1, isDeleted: 1, isArchived: 1 });
noteSchema.index({ user: 1, isDeleted: 1, updatedAt: -1 });
noteSchema.index(
  { shareToken: 1 },
  {
    unique: true,
    partialFilterExpression: {
      shareToken: {
        $type: "string"
      }
    }
  }
);
noteSchema.index(
  { user: 1, title: "text", content: "text" },
  {
    weights: {
      title: 5,
      content: 1
    },
    name: "user_text_search_index"
  }
);

export default mongoose.model("Note", noteSchema);
