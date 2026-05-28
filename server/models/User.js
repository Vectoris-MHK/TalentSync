import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  resume: { type: String },
  image: { type: String, required: true },
  preferences: { type: [String], default: [] },
  embedding: {
    type: [Number],
    default: [],
    validate: {
      validator: (v) => v.length === 0 || v.length === 3072,
      message: "Embedding must be 0 or 3072 dimensions",
    },
  },
});

const User = mongoose.model("User", userSchema);

export default User;