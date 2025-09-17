import mongoose from "mongoose";
import config from "../config";

const MONGODB_URI = config.database_url as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI in your config");
}

// Use a global variable to cache the connection
let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const dbConnect = async () => {
  if (cached.conn) {
    return cached.conn; // return cached connection
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

export default dbConnect;
