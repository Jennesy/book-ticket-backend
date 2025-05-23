// models/Reservation.js
const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  userName:              { type: String, required: true },
  seatIds:               [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }],
  programBookCount:      { type: Number, default: 0 },
  totalPrice:            { type: Number, required: true },
  createdAt:             { type: Date, default: Date.now },
  isDeleted:             { type: Boolean, default: false },
  deletedAt:             { type: Date },
  originalReservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
});

module.exports = mongoose.model('Reservation', ReservationSchema);
