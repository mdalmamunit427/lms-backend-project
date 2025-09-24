import mongoose from "mongoose";
import bcrypt from "bcrypt";

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

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

const userSchema = new mongoose.Schema<IUser>({
  name: String,
  email: { 
    type: String, 
    unique: true, 
    validate: {
      validator: function(v: string) {
        return emailRegex.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  password: String,
  isVerified: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  avatar: {
    public_id: String,
    url: String,
  },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  refreshToken: String,
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  // Check if password is already hashed (bcrypt hashes start with $2b$)
  if (this.password.startsWith('$2b$')) return next();
  
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);


