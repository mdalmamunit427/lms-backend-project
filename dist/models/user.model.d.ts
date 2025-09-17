import mongoose from "mongoose";
export interface IUser extends mongoose.Document {
    _id: string;
    name: string;
    email: string;
    password: string;
    isVerified: boolean;
    role: "user" | "admin";
    avatar?: {
        public_id: string;
        url: string;
    };
    courses?: string[];
    refreshToken?: string;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=user.model.d.ts.map