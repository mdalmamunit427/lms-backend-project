import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  title: string;
  description: string;
  instructor: mongoose.Schema.Types.ObjectId;
  category: string;
  price: number;
  discount: number;
  stacks: string[];
  thumbnail: {
    public_id: string | null;
    url: string;
  };
  enrollmentCount: number;
  averageRating: number;
  status: "draft" | "published" | "archived";
}

const CourseSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default:0, min: 0, max: 100 },
    stacks: {
      type: [String],
      default: []
    },
    thumbnail: {
      public_id: {
        type: String,
        default: null,
      },
      url: {
        type: String,
        default: "https://res.cloudinary.com/dj8fpb6tq/image/upload/v1758530649/qllwshtuqe3njr8pzim6.png",
      },
    },
    enrollmentCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
  },
  { timestamps: true }
);

CourseSchema.index({ title: "text", description: "text" });
CourseSchema.index({ instructor: 1 });

const Course = mongoose.model<ICourse>("Course", CourseSchema);
export default Course;