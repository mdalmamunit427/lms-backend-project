// models/courseProgress.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICourseProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lectureCompleted: string[]; // array of lectureIds
  updatedAt: Date;
}

const courseProgressSchema = new Schema<ICourseProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lectureCompleted: { type: [String], default: [] },
  },
  { timestamps: true }
);

const CourseProgress = mongoose.model<ICourseProgress>("CourseProgress", courseProgressSchema);

export default CourseProgress;
