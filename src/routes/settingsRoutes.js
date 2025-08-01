const express = require('express');
const router = express.Router();
const { getBookingStatus, updateBookingStatus } = require('../controllers/settingsController');

router.get('/booking-status', getBookingStatus);
router.put('/booking-status', updateBookingStatus);

module.exports = router;