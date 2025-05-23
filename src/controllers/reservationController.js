// src/controllers/reservationController.js
const mongoose    = require('mongoose');
const Seat        = require('~/models/Seat');
const Reservation = require('~/models/Reservation');
const { SEAT_STATUS, PROGRAM_BOOK_PRICE } = require('~/constants');

exports.createReservation = async (req, res) => {
  const { userName, seatLabels = [], programBookCount = 0 } = req.body;
  if (!userName || !seatLabels.length) {
    return res.status(400).json({ message: 'userName & seatLabels 為必填' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const seats = await Seat.find({
      $expr: {
        $in: [{ $concat: ["$row", { $toString: "$col" }] }, seatLabels]
      },
      status: SEAT_STATUS.AVAILABLE
    }).session(session);

    if (seats.length !== seatLabels.length) {
      await session.abortTransaction();
      return res.status(409).json({
        message: '部分座位已無法選擇',
        unavailable: seatLabels.filter(l => !seats.find(s => s.row + s.col === l))
      });
    }

    const seatsTotal = seats.reduce((sum, s) => sum + s.price, 0);
    const booksTotal = programBookCount * PROGRAM_BOOK_PRICE;
    const totalPrice = seatsTotal + booksTotal;

    await Seat.updateMany(
      { $expr: {
        $in: [{ $concat: ["$row", { $toString: "$col" }] }, seatLabels]
      } },
      { $set: { status: SEAT_STATUS.BOOKED, reservedBy: userName } },
      { session }
    );

    const reservation = new Reservation({
      userName,
      seatIds: seats.map(s => s._id),
      programBookCount,
      totalPrice
    });
    await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ reservedSeats: seats.map(s => ({ row: s.row, col: s.col, price: s.price })), programBookCount, totalPrice });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
