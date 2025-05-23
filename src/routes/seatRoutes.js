const express = require('express');
const router  = express.Router();
const { getAllSeats, editSeats } = require('../controllers/seatController');

router.get('/', getAllSeats);
router.patch('/', editSeats);

module.exports = router;
