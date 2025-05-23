const express = require('express');
const router  = express.Router();
const { getAllSeats } = require('../controllers/seatController');

router.get('/', getAllSeats);

module.exports = router;
