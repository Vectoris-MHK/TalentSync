import mongoose from "mongoose";

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not set");
    }

    mongoose.connection.on("connected", () => console.log("Database Connected"));

    await mongoose.connect(process.env.MONGODB_URI, {
        dbName: "job-portal",
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
    });
}

export default connectDB;
