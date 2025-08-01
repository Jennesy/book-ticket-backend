const Seat = require('~/models/Seat');

/**
 * Emit updated seats data to all connected clients
 */
async function emitSeatUpdated() {
  try {
    if (global.io) {
      const seats = await Seat.find().sort({ row: 1, col: 1 });
      global.io.emit('seatUpdated', seats);
      console.log('📡 Emitted seatUpdated event to all clients');
    }
  } catch (error) {
    console.error('Error emitting seat update:', error);
  }
}

/**
 * Emit booking status change to all connected clients
 * @param {boolean} open - Whether booking is open or closed
 */
function emitBookingStatusChanged(open) {
  try {
    if (global.io) {
      global.io.emit('bookingStatusChanged', { open });
      console.log(`📡 Emitted bookingStatusChanged: ${open ? 'OPEN' : 'CLOSED'}`);
    }
  } catch (error) {
    console.error('Error emitting booking status change:', error);
  }
}

module.exports = {
  emitSeatUpdated,
  emitBookingStatusChanged
};