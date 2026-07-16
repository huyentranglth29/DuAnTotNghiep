const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const COLLECTION_PAIRS = [
  ["users", "người dùng"],
  ["movies", "phim"],
  ["rooms", "phòng"],
  ["seats", "chỗ ngồi"],
  ["showtimes", "giờ chiếu"],
  ["bookings", "đặt chỗ"],
  ["quickbookings", "đặt vé nhanh"],
  ["tickets", "vé"],
  ["reviews", "đánh giá"],
  ["vouchers", "phiếu giảm giá"],
  ["uservouchers", "voucher người dùng"],
  ["products", "các sản phẩm"],
  ["notifications", "thông báo"],
];

const naturalKeys = {
  movies: "title",
  rooms: "name",
  tickets: "code",
  vouchers: "code",
  products: "name",
  notifications: "title",
};

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("vi");
}

async function mergeUsers(db) {
  const source = db.collection("users");
  const target = db.collection("người dùng");
  const users = await source.find({}).toArray();
  let inserted = 0;
  let updated = 0;

  for (const user of users) {
    const existing = await target.findOne({
      $or: [{ _id: user._id }, { email: user.email }],
    });

    if (!existing) {
      await target.insertOne(user);
      inserted += 1;
      continue;
    }

    const sourceUpdatedAt = new Date(user.updatedAt || user.createdAt || 0);
    const targetUpdatedAt = new Date(existing.updatedAt || existing.createdAt || 0);
    if (sourceUpdatedAt > targetUpdatedAt) {
      const { _id, ...changes } = user;
      await target.updateOne({ _id: existing._id }, { $set: changes });
      updated += 1;
    }
  }

  return { inserted, updated };
}

async function mergeByNaturalKey(db, englishName, vietnameseName, key) {
  const sourceRows = await db.collection(englishName).find({}).toArray();
  const target = db.collection(vietnameseName);
  const targetRows = await target.find({}).toArray();
  const ids = new Set(targetRows.map((row) => String(row._id)));
  const keys = new Set(targetRows.map((row) => normalize(row[key])));
  let inserted = 0;

  for (const row of sourceRows) {
    if (ids.has(String(row._id)) || keys.has(normalize(row[key]))) continue;
    await target.insertOne(row);
    ids.add(String(row._id));
    keys.add(normalize(row[key]));
    inserted += 1;
  }

  return { inserted };
}

async function mergeById(db, englishName, vietnameseName) {
  const sourceRows = await db.collection(englishName).find({}).toArray();
  const target = db.collection(vietnameseName);
  const targetRows = await target.find({}, { projection: { _id: 1 } }).toArray();
  const ids = new Set(targetRows.map((row) => String(row._id)));
  const missing = sourceRows.filter((row) => !ids.has(String(row._id)));
  if (missing.length) await target.insertMany(missing, { ordered: false });
  return { inserted: missing.length };
}

async function mergeShowtimes(db) {
  const sourceRows = await db.collection("showtimes").find({}).toArray();
  const target = db.collection("giờ chiếu");
  const [englishMovies, englishRooms, vietnameseMovies, vietnameseRooms, targetRows] =
    await Promise.all([
      db.collection("movies").find({}).toArray(),
      db.collection("rooms").find({}).toArray(),
      db.collection("phim").find({}).toArray(),
      db.collection("phòng").find({}).toArray(),
      target.find({}).toArray(),
    ]);

  const titleByEnglishId = new Map(
    englishMovies.map((row) => [String(row._id), normalize(row.title)])
  );
  const roomByEnglishId = new Map(
    englishRooms.map((row) => [String(row._id), normalize(row.name)])
  );
  const vietnameseMovieByTitle = new Map(
    vietnameseMovies.map((row) => [normalize(row.title), row._id])
  );
  const vietnameseRoomByName = new Map(
    vietnameseRooms.map((row) => [normalize(row.name), row._id])
  );
  const targetMovieTitles = new Map(
    vietnameseMovies.map((row) => [String(row._id), normalize(row.title)])
  );
  const targetRoomNames = new Map(
    vietnameseRooms.map((row) => [String(row._id), normalize(row.name)])
  );
  const slotKey = (movieTitle, roomName, startTime) =>
    `${movieTitle}|${roomName}|${new Date(startTime).toISOString()}`;
  const existingSlots = new Set(
    targetRows.map((row) =>
      slotKey(
        targetMovieTitles.get(String(row.movie)),
        targetRoomNames.get(String(row.room)),
        row.startTime
      )
    )
  );

  let inserted = 0;
  let skippedUnmapped = 0;
  for (const row of sourceRows) {
    const movieTitle = titleByEnglishId.get(String(row.movie));
    const roomName = roomByEnglishId.get(String(row.room));
    const movie = vietnameseMovieByTitle.get(movieTitle);
    const room = vietnameseRoomByName.get(roomName);
    if (!movie || !room) {
      skippedUnmapped += 1;
      continue;
    }

    const key = slotKey(movieTitle, roomName, row.startTime);
    if (existingSlots.has(key)) continue;
    await target.insertOne({ ...row, movie, room });
    existingSlots.add(key);
    inserted += 1;
  }

  return { inserted, skippedUnmapped };
}

async function buildIdMap(db, englishName, vietnameseName, key) {
  const [englishRows, vietnameseRows] = await Promise.all([
    db.collection(englishName).find({}).toArray(),
    db.collection(vietnameseName).find({}).toArray(),
  ]);
  const targetByKey = new Map(
    vietnameseRows.map((row) => [normalize(row[key]), row._id])
  );
  return new Map(
    englishRows
      .map((row) => [String(row._id), targetByKey.get(normalize(row[key]))])
      .filter(([, id]) => id)
  );
}

async function buildShowtimeIdMap(db, movieIdMap, roomIdMap) {
  const [englishRows, vietnameseRows] = await Promise.all([
    db.collection("showtimes").find({}).toArray(),
    db.collection("giờ chiếu").find({}).toArray(),
  ]);
  const key = (movie, room, startTime) =>
    `${movie}|${room}|${new Date(startTime).toISOString()}`;
  const targetBySlot = new Map(
    vietnameseRows.map((row) => [
      key(String(row.movie), String(row.room), row.startTime),
      row._id,
    ])
  );
  return new Map(
    englishRows
      .map((row) => [
        String(row._id),
        targetBySlot.get(
          key(
            String(movieIdMap.get(String(row.movie)) || row.movie),
            String(roomIdMap.get(String(row.room)) || row.room),
            row.startTime
          )
        ),
      ])
      .filter(([, id]) => id)
  );
}

async function remapField(collection, field, idMap) {
  let updated = 0;
  for (const [sourceId, targetId] of idMap) {
    const result = await collection.updateMany(
      { [field]: new mongoose.Types.ObjectId(sourceId) },
      { $set: { [field]: targetId } }
    );
    updated += result.modifiedCount;
  }
  return updated;
}

async function repairReferences(db) {
  const userIdMap = await buildIdMap(db, "users", "người dùng", "email");
  const movieIdMap = await buildIdMap(db, "movies", "phim", "title");
  const roomIdMap = await buildIdMap(db, "rooms", "phòng", "name");
  const showtimeIdMap = await buildShowtimeIdMap(db, movieIdMap, roomIdMap);

  return {
    bookingUsers: await remapField(db.collection("đặt chỗ"), "user", userIdMap),
    bookingShowtimes: await remapField(
      db.collection("đặt chỗ"),
      "showtime",
      showtimeIdMap
    ),
    ticketShowtimes: await remapField(
      db.collection("vé"),
      "showtime",
      showtimeIdMap
    ),
    reviewMovies: await remapField(db.collection("đánh giá"), "movie", movieIdMap),
    reviewUsers: await remapField(db.collection("đánh giá"), "user", userIdMap),
    userVoucherUsers: await remapField(
      db.collection("voucher người dùng"),
      "user",
      userIdMap
    ),
  };
}

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  console.log("users", await mergeUsers(db));
  for (const [englishName, vietnameseName] of COLLECTION_PAIRS) {
    if (["users", "showtimes"].includes(englishName)) continue;
    const key = naturalKeys[englishName];
    const result = key
      ? await mergeByNaturalKey(db, englishName, vietnameseName, key)
      : await mergeById(db, englishName, vietnameseName);
    console.log(`${englishName} -> ${vietnameseName}`, result);
  }
  console.log("showtimes -> giờ chiếu", await mergeShowtimes(db));
  console.log("repaired references", await repairReferences(db));

  await mongoose.disconnect();
}

migrate().catch(async (error) => {
  console.error("Migration failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
