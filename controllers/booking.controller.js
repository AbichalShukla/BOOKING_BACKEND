const pool = require('../config/db');
const { validateBookingRules } = require('../validators/booking.validator');

// List confirmed bookings for date/room
async function getBookings(req, res) {
    try {
        const { date, roomId } = req.query;
        let query = "SELECT * FROM bookings WHERE status = 'confirmed'";
        let params = [];

        if (date) {
            query += " AND DATE(start) = ?";
            params.push(date);
        }
        if (roomId) {
            query += " AND roomId = ?";
            params.push(roomId);
        }

        const [bookings] = await pool.query(query, params);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
}

// Create a booking with transaction locking (Concurrency handling)
async function createBooking(req, res) {
    const { roomId, title, organizerEmail, attendees, start, end } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [rooms] = await connection.query('SELECT * FROM rooms WHERE id = ? FOR UPDATE', [roomId]);
        if (rooms.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Room not found.' } });
        }
        const room = rooms[0];

        const validationError = validateBookingRules(roomId, title, organizerEmail, attendees, start, end, room.capacity);
        if (validationError) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ error: { code: 'INVALID_INPUT', message: validationError } });
        }

        // R9: Max 3 bookings per organizer per day
        const bookingDate = start.split('T')[0];
        const [organizerBookings] = await connection.query(
            `SELECT COUNT(*) as count FROM bookings 
             WHERE organizerEmail = ? AND status = 'confirmed' AND DATE(start) = ?`,
            [organizerEmail, bookingDate]
        );
        if (organizerBookings[0].count >= 3) {
            await connection.rollback();
            connection.release();
            return res.status(409).json({ 
                error: { code: 'ORGANIZER_LIMIT_EXCEEDED', message: 'Organizer cannot hold more than 3 confirmed bookings starting on the same day.' } 
            });
        }

        // R7: Overlap check using pessimistic locking
        const [overlapping] = await connection.query(
            `SELECT id, title, start, end FROM bookings 
             WHERE roomId = ? AND status = 'confirmed' AND start < ? AND end > ?`,
            [roomId, end, start]
        );

        if (overlapping.length > 0) {
            await connection.rollback();
            connection.release();
            const conflict = overlapping[0];
            return res.status(409).json({
                error: {
                    code: 'BOOKING_CONFLICT',
                    message: `Room ${room.name} is already booked during this time window.`,
                    details: { conflictingBookingId: conflict.id }
                }
            });
        }

        // Format ISO strings to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
        const formattedStart = start.replace('T', ' ').replace('Z', '');
        const formattedEnd = end.replace('T', ' ').replace('Z', '');

        const [result] = await connection.query(
            `INSERT INTO bookings (roomId, title, organizerEmail, attendees, start, end, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'confirmed')`,
            [roomId, title.trim(), organizerEmail.trim(), attendees, formattedStart, formattedEnd]
        );

        await connection.commit();
        connection.release();

        res.status(201).json({
            id: result.insertId,
            roomId,
            title: title.trim(),
            organizerEmail: organizerEmail.trim(),
            attendees,
            start,
            end,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        });

    } catch (err) {
        await connection.rollback();
        connection.release();
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
}

// Cancel booking (R8)
async function cancelBooking(req, res) {
    try {
        const bookingId = req.params.id;
        const [bookings] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);

        if (bookings.length === 0) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Booking not found.' } });
        }

        const booking = bookings[0];
        if (booking.status === 'cancelled') {
            return res.status(200).json({ message: 'Booking is already cancelled.' });
        }

        // R8: Cannot cancel if booking has already started
        if (new Date() >= new Date(booking.start)) {
            return res.status(400).json({ error: { code: 'CANNOT_CANCEL_STARTED_BOOKING', message: 'R8: A booking that has already started cannot be cancelled.' } });
        }

        await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [bookingId]);
        res.status(200).json({ message: 'Booking cancelled successfully.' });
    } catch (err) {
        res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message } });
    }
}

module.exports = { getBookings, createBooking, cancelBooking };