const express    = require('express');
const router     = express.Router();
const { createReservation, deleteReservation, getAllReservations, editReservation } = require('../controllers/reservationController');

router.get('/', getAllReservations);
router.post('/', createReservation);
router.put('/:reservationId', editReservation);
router.delete('/:reservationId', deleteReservation);

module.exports = router;
