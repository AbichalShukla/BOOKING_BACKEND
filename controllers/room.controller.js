const pool = require('../config/db');

// List all rooms
async function getAllRooms(req, res) {
    try {
        const [rooms] = await pool.query('SELECT * FROM rooms');
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
}

// Find free rooms for a time window
async function getAvailability(req, res) {
    try {
        const { date, start: startTime, end: endTime, minCapacity } = req.query;

        if (!date || !startTime || !endTime) {
            return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'date, start, and end query parameters are required.' } });
        }

        const startIso = `${date}T${startTime}:00Z`;
        const endIso = `${date}T${endTime}:00Z`;
        const capacity = minCapacity ? parseInt(minCapacity, 10) : 1;

        const query = `
            SELECT * FROM rooms 
            WHERE capacity >= ? 
            AND id NOT IN (
                SELECT roomId FROM bookings 
                WHERE status = 'confirmed' 
                AND start < ? AND end > ?
            )
            ORDER BY capacity ASC
        `;

        const [availableRooms] = await pool.query(query, [capacity, endIso, startIso]);
        res.json(availableRooms);
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
}

module.exports = { getAllRooms, getAvailability };