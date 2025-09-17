import mongoose from "mongoose";
import config from "../config";

const dbConnect = async () => {
  try {
    await mongoose.connect(config.database_url as string);
    console.log(`Database connected successfully`);
  } catch (error) {
    console.log(error);
  }
};

export default dbConnect;