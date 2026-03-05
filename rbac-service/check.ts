import mongoose from "mongoose";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/PAM_db");

  const db = mongoose.connection.db!; // tell TS it exists

  const collections = await db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  const perms = await db.collection("permissions").countDocuments();
  console.log("Permissions:", perms);

  const roles = await db.collection("roles").countDocuments();
  console.log("Roles:", roles);

  const users = await db.collection("users").countDocuments();
  console.log("Users:", users);

  await mongoose.disconnect();
}

run();