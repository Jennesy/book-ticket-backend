const Seat = require('~/models/Seat');

exports.getAllSeats = async (req, res) => {
  const seats = await Seat.find().sort({ row:1, col:1 });
  res.json(seats);
};
