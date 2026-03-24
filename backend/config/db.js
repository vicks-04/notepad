import mongoose from "mongoose";
import Note from "../models/Note.js";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);

  // Repair the legacy sparse share-token index so notes without a token can coexist.
  await Note.syncIndexes();
}
