import mongoose from "mongoose";
import { uriFromSrv } from "../scripts/resolveSrv.js";

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not set");
    }

    mongoose.connection.on("connected", () => console.log("Database Connected"));

    const uri = await uriFromSrv(process.env.MONGODB_URI);

    const isVercel = !!process.env.VERCEL || !!process.env.VERCEL_ENV;

    await mongoose.connect(uri, {
        dbName: "job-portal",
        serverSelectionTimeoutMS: isVercel ? 15000 : 5000,
        connectTimeoutMS: isVercel ? 15000 : 5000,
    });
}

export default connectDB;
