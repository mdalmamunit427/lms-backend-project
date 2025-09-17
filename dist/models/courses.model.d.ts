import mongoose, { Document, Types } from "mongoose";
export interface ILecture {
    lectureId: string;
    lectureTitle: string;
    lectureDuration: number;
    lectureUrl: string;
    isPreviewFree: boolean;
    lectureOrder: number;
}
export interface IChapter {
    chapterId: string;
    chapterOrder: number;
    chapterTitle: string;
    chapterContent: ILecture[];
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
declare const Course: mongoose.Model<ICourse, {}, {}, {}, mongoose.Document<unknown, {}, ICourse, {}, {}> & ICourse & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Course;
//# sourceMappingURL=courses.model.d.ts.map