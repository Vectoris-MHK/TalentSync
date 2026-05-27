import mongoose from "mongoose";

const userEventSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "User" },
  jobId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Job" },
  eventType: {
    type: String,
    enum: ["search", "view", "bookmark", "apply"],
    required: true,
  },
  weight: { type: Number, default: 1 },
  timestamp: { type: Number, required: true },
});

userEventSchema.index({ userId: 1, timestamp: -1 });
userEventSchema.index({ jobId: 1 });
userEventSchema.index({ eventType: 1 });

const UserEvent = mongoose.model("UserEvent", userEventSchema);

export default UserEvent;
