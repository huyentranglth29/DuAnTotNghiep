const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Room = require("../models/Room");
const Seat = require("../models/Seat");

const ROW_LAYOUT = {
  A: 14,
  B: 14,
  C: 15,
  D: 15,
  E: 14,
  F: 15,
  G: 13,
  H: 13,
};

async function syncSeatLayout() {
  await mongoose.connect(process.env.MONGO_URI);
  const rooms = await Room.find({ status: { $ne: "inactive" } });
  const totalSeats = Object.values(ROW_LAYOUT).reduce((sum, count) => sum + count, 0);

  for (const room of rooms) {
    const operations = [];
    for (const [row, count] of Object.entries(ROW_LAYOUT)) {
      for (let number = 1; number <= count; number += 1) {
        operations.push({
          updateOne: {
            filter: { room: room._id, row, number },
            update: {
              $set: {
                type: row >= "E" ? "vip" : "normal",
                status: "active",
              },
              $setOnInsert: { room: room._id, row, number },
            },
            upsert: true,
          },
        });
      }
    }

    await Seat.bulkWrite(operations, { ordered: false });
    await Room.updateOne({ _id: room._id }, { $set: { totalSeats } });
    console.log(`${room.name}: ${totalSeats} ghế (A-H)`);
  }

  await mongoose.disconnect();
}

syncSeatLayout().catch(async (error) => {
  console.error("Không thể đồng bộ sơ đồ ghế:", error);
  await mongoose.disconnect();
  process.exit(1);
});
