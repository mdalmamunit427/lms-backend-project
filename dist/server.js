"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const mongoose_1 = __importDefault(require("mongoose"));
cloudinary_1.v2.config({
    cloud_name: config_1.default.cloudinary_cloud_name,
    api_key: config_1.default.cloudinary_api_key,
    api_secret: config_1.default.cloudinary_api_secret,
});
async function main() {
    await mongoose_1.default.connect(config_1.default.database_url);
    app_1.default.listen(config_1.default.port, () => {
        console.log(`Example app listening on port ${config_1.default.port}`);
    });
}
main().then(() => console.log("Mongodb is connected successfully!"))
    .catch(error => console.log(error));
//# sourceMappingURL=server.js.map