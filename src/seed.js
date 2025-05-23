require('module-alias/register');

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Seat = require('~/models/Seat');
const { SEAT_STATUS, SEAT_PRICES, SEAT_ROWS } = require('~/constants');

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB.');

  // 清空舊資料
  await Seat.deleteMany({});
  console.log('Existing seats removed.');

  const rows = SEAT_ROWS.length;
  const cols = 30;

  const seats = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 1; c <= cols; c++) {
      seats.push({
        row: SEAT_ROWS[r],
        col: c,
        status: SEAT_STATUS.AVAILABLE,
        price: SEAT_PRICES[0],
      });
    }
  }

  await Seat.insertMany(seats);
  console.log(`Inserted ${seats.length} seats.`);

  await mongoose.disconnect();
  console.log('Disconnected.');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
