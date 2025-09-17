import mongoose, { Schema, Document, Types } from "mongoose";


export interface ILecture {
  lectureId: string; // Custom ID
  lectureTitle: string;
  lectureDuration: number; // in minutes or seconds
  lectureUrl: string;
  isPreviewFree: boolean;
  lectureOrder: number; // Order within chapter
}

export interface IChapter {
  chapterId: string; // Custom ID
  chapterOrder: number; // Order of chapter
  chapterTitle: string;
  chapterContent: ILecture[]; // Array of lectures
}

export interface ICourse extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  courseThumbnail: {
    public_id: string;
    url: string;
  };
  coursePrice: number;
  isPublished: boolean;
  discount: number;
  courseContent: IChapter[];
  educator: Types.ObjectId;
  courseRatings: {
    userId: Types.ObjectId;
    rating: number;
  }[];
  enrolledStudents: Types.ObjectId[];
}


const lectureSchema = new Schema<ILecture>(
  {
    lectureId: { type: String, required: true },
    lectureTitle: { type: String, required: true },
    lectureDuration: { type: Number, required: true },
    lectureUrl: { type: String, required: true },
    isPreviewFree: { type: Boolean, required: true },
    lectureOrder: { type: Number, required: true },
  },
  { _id: false }
);

const chapterSchema = new Schema<IChapter>(
  {
    chapterId: { type: String, required: true },
    chapterOrder: { type: Number, required: true },
    chapterTitle: { type: String, required: true },
    chapterContent: { type: [lectureSchema], default: [] },
  },
  { _id: false }
);

const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    courseThumbnail: {
      public_id: { type: String },
      url: { type: String }
    },
    coursePrice: { type: Number, required: true },
    isPublished: { type: Boolean, default: true },
    discount: { type: Number, required: true, min: 0, max: 100 },
    courseContent: { type: [chapterSchema], default: [] },
    educator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseRatings: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          rating: { type: Number, min: 1, max: 5 },
        },
      ],
      default: [],
    },
    enrolledStudents: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  { timestamps: true, minimize: false }
);

const Course = mongoose.model<ICourse>("Course", courseSchema);

export default Course;
