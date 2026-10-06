const express = require('express');
const router = express.Router();
const { getAllRooms, getAvailability } = require('../controllers/room.controller');

router.get('/rooms', getAllRooms);
router.get('/availability', getAvailability);

module.exports = router;