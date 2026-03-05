"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
async function run() {
    await mongoose_1.default.connect("mongodb://localhost:27017/PAM_db");
    const db = mongoose_1.default.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    const perms = await db.collection("permissions").countDocuments();
    console.log("Permissions:", perms);
    const roles = await db.collection("roles").countDocuments();
    console.log("Roles:", roles);
    const users = await db.collection("users").countDocuments();
    console.log("Users:", users);
    await mongoose_1.default.disconnect();
}
run();
//# sourceMappingURL=check.js.map