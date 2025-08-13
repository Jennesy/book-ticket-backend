const SEAT_STATUS = require('./seatStatus');
const SEAT_PRICES = [400, 600, 800, 1000, 1200, 2000];
const SEAT_ROWS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','W','AA'];
const PROGRAM_BOOK_PRICE = 150; // Base price, discounts handled in discountCalculator

module.exports = {
  SEAT_STATUS,
  SEAT_PRICES,
  SEAT_ROWS,
  PROGRAM_BOOK_PRICE
};