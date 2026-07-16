const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const SOURCE_COLLECTION = "người dùng";
const TARGET_COLLECTION = "users";

async function migrateUsersCollection() {
  await mongoose.connect(process.env.MONGO_URI);

  const db = mongoose.connection.db;
  const source = db.collection(SOURCE_COLLECTION);
  const target = db.collection(TARGET_COLLECTION);
  const sourceUsers = await source.find({}).toArray();

  if (!sourceUsers.length) {
    console.log("No users found in legacy collection.");
    await mongoose.disconnect();
    return;
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const user of sourceUsers) {
    const existing = await target.findOne({
      $or: [{ _id: user._id }, { email: user.email }],
    });

    if (!existing) {
      await target.insertOne(user);
      inserted += 1;
      continue;
    }

    if (existing._id.equals(user._id)) {
      await target.updateOne({ _id: user._id }, { $set: user });
      updated += 1;
      continue;
    }

    skipped += 1;
    console.warn(`Skipped duplicate email with different _id: ${user.email}`);
  }

  await target.createIndex({ email: 1 }, { unique: true });

  console.log(
    `Migration complete. inserted=${inserted}, updated=${updated}, skipped=${skipped}`
  );

  await mongoose.disconnect();
}

migrateUsersCollection().catch(async (error) => {
  console.error("Migration failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
