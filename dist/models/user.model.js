"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const userSchema = new mongoose_1.default.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        validate: {
            validator: function (v) {
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
    courses: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Course" }],
    refreshToken: String,
}, { timestamps: true });
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    // Check if password is already hashed (bcrypt hashes start with $2b$)
    if (this.password.startsWith('$2b$'))
        return next();
    this.password = await bcrypt_1.default.hash(this.password, 10);
    next();
});
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt_1.default.compare(password, this.password);
};
exports.User = mongoose_1.default.model("User", userSchema);
//# sourceMappingURL=user.model.js.map