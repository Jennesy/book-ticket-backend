const mongoose = require('mongoose');
const { SEAT_STATUS, SEAT_PRICES, SEAT_ROWS } = require('~/constants');

const SeatSchema = new mongoose.Schema({
  row:       { type: String, enum: SEAT_ROWS, required: true },
  col:       { type: Number, required: true },
  status:    { 
    type: String, 
    enum: Object.values(SEAT_STATUS),
    default: SEAT_STATUS.AVAILABLE 
  },
  price:     { type: Number, enum: SEAT_PRICES, required: true },
  reservedBy:{ type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Seat', SeatSchema);