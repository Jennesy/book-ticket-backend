// src/controllers/reservationController.js
const mongoose    = require('mongoose');
const Seat        = require('~/models/Seat');
const Reservation = require('~/models/Reservation');
const { SEAT_STATUS, PROGRAM_BOOK_PRICE } = require('~/constants');
const { emitSeatUpdated } = require('~/utils/socketUtils');

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

    // Emit seat update to all clients
    emitSeatUpdated();

    res.json({ reservedSeats: seats.map(s => ({ row: s.row, col: s.col, price: s.price })), programBookCount, totalPrice });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteReservation = async (req, res) => {
  const { reservationId } = req.params;
  const { hard = false } = req.query; // Default to soft delete
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation || reservation.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Update seats back to available
    await Seat.updateMany(
      { _id: { $in: reservation.seatIds } },
      { 
        $set: { 
          status: SEAT_STATUS.AVAILABLE,
          reservedBy: ''
        }
      },
      { session }
    );

    if (hard === 'true' || hard === true) {
      // Hard delete - permanently remove from database
      await Reservation.deleteOne({ _id: reservationId }).session(session);
      var message = 'Reservation permanently deleted';
    } else {
      // Soft delete - mark as deleted but keep in database
      await Reservation.updateOne(
        { _id: reservationId },
        { 
          $set: { 
            isDeleted: true, 
            deletedAt: new Date() 
          } 
        },
        { session }
      );
      var message = 'Reservation soft deleted successfully';
    }

    await session.commitTransaction();
    session.endSession();

    // Emit seat update to all clients
    emitSeatUpdated();

    res.json({ message, deleteType: hard === 'true' || hard === true ? 'hard' : 'soft' });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.editReservation = async (req, res) => {
  const { reservationId } = req.params;
  const { userName, seatLabels = [], programBookCount = 0 } = req.body;
  
  if (!userName || !seatLabels.length) {
    return res.status(400).json({ message: 'userName & seatLabels 為必填' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the original reservation
    const originalReservation = await Reservation.findById(reservationId).session(session);
    if (!originalReservation || originalReservation.isDeleted) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Soft delete the original reservation
    await Reservation.updateOne(
      { _id: reservationId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { session }
    );

    // Release the old seats
    await Seat.updateMany(
      { _id: { $in: originalReservation.seatIds } },
      { 
        $set: { 
          status: SEAT_STATUS.AVAILABLE,
          reservedBy: ''
        }
      },
      { session }
    );

    // Check new seats availability
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

    // Calculate new price
    const seatsTotal = seats.reduce((sum, s) => sum + s.price, 0);
    const booksTotal = programBookCount * PROGRAM_BOOK_PRICE;
    const totalPrice = seatsTotal + booksTotal;

    // Book new seats
    await Seat.updateMany(
      { $expr: {
        $in: [{ $concat: ["$row", { $toString: "$col" }] }, seatLabels]
      } },
      { $set: { status: SEAT_STATUS.BOOKED, reservedBy: userName } },
      { session }
    );

    // Create new reservation
    const newReservation = new Reservation({
      userName,
      seatIds: seats.map(s => s._id),
      programBookCount,
      totalPrice,
      originalReservationId: reservationId
    });
    await newReservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Emit seat update to all clients
    emitSeatUpdated();

    res.json({ 
      reservedSeats: seats.map(s => ({ row: s.row, col: s.col, price: s.price })), 
      programBookCount, 
      totalPrice,
      newReservationId: newReservation._id
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ isDeleted: { $ne: true } })
      .populate('seatIds', 'row col price')
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
