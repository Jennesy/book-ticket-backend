const Seat = require('~/models/Seat');
const Reservation = require('~/models/Reservation');
const { SEAT_STATUS } = require('~/constants');
const { emitSeatUpdated } = require('~/utils/socketUtils');

exports.getAllSeats = async (req, res) => {
  try {
    const seats = await Seat.find().sort({ row: 1, col: 1 });
    res.json(seats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.editSeats = async (req, res) => {
  const { seats } = req.body;
  
  if (!seats || !Array.isArray(seats)) {
    return res.status(400).json({ message: 'seats array is required' });
  }

  try {
    const updatedSeats = [];
    const skippedSeats = [];

    for (const seatData of seats) {
      const { _id, row, col, status, reservedBy, price } = seatData;
      
      // Check if the seat is currently booked
      const currentSeat = await Seat.findById(_id);
      if (!currentSeat) {
        continue; // Skip if seat doesn't exist
      }

      if (currentSeat.status === SEAT_STATUS.BOOKED) {
        // Find the reservation that owns this seat
        const reservation = await Reservation.findOne({
          seatIds: _id,
          isDeleted: { $ne: true }
        });

        skippedSeats.push({
          seatId: _id,
          row: currentSeat.row,
          col: currentSeat.col,
          reservationId: reservation ? reservation._id : null,
          reservedBy: currentSeat.reservedBy,
          reason: 'Seat is currently booked'
        });
        continue;
      }

      // Update the seat if it's not booked
      const updatedSeat = await Seat.findByIdAndUpdate(
        _id,
        { row, col, status, reservedBy, price },
        { new: true, runValidators: true }
      );

      if (updatedSeat) {
        updatedSeats.push(updatedSeat);
      }
    }

    // Emit seat update to all clients if any seats were updated
    if (updatedSeats.length > 0) {
      emitSeatUpdated();
    }

    res.json({
      updatedSeats,
      skippedSeats,
      message: skippedSeats.length > 0 
        ? `${updatedSeats.length} seats updated, ${skippedSeats.length} booked seats skipped`
        : `${updatedSeats.length} seats updated successfully`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
