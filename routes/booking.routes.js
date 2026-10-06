const express = require('express');
const router = express.Router();
const { getBookings, createBooking, cancelBooking } = require('../controllers/booking.controller');

router.get('/bookings', getBookings);
router.post('/bookings', createBooking);
router.delete('/bookings/:id', cancelBooking);

module.exports = router;