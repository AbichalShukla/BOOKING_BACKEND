function validateBookingRules(roomId, title, organizerEmail, attendees, startStr, endStr, roomCapacity) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Invalid date format. Use ISO 8601 UTC timestamps.";
    }

    // R1: end must be after start
    if (end <= start) return "R1: End time must be after start time.";

    // R2: 15-minute boundaries (minutes 00, 15, 30, 45 and zero seconds)
    const startMin = start.getUTCMinutes();
    const endMin = end.getUTCMinutes();
    if (![0, 15, 30, 45].includes(startMin) || start.getUTCSeconds() !== 0 ||
        ![0, 15, 30, 45].includes(endMin) || end.getUTCSeconds() !== 0) {
        return "R2: Start and end must fall on 15-minute boundaries (00, 15, 30, 45).";
    }

    // R3: Last at least 15 mins and at most 4 hours
    const durationMins = (end - start) / (1000 * 60);
    if (durationMins < 15 || durationMins > 240) {
        return "R3: A booking must last between 15 minutes and 4 hours.";
    }

    // R4: Business hours 08:00 to 20:00 UTC on the same day
    const startHour = start.getUTCHours();
    const endHour = end.getUTCHours();
    if (start.getUTCDate() !== end.getUTCDate() || startHour < 8 || endHour > 20 || (endHour === 20 && end.getUTCMinutes() > 0)) {
        return "R4: Bookings must fall entirely within business hours (08:00 to 20:00 UTC) on the same day.";
    }

    // R5: Cannot start in the past
    if (start < now) return "R5: A booking cannot start in the past.";

    // R6: Attendees cannot exceed room capacity
    if (attendees > roomCapacity) return `R6: Attendees (${attendees}) cannot exceed room capacity (${roomCapacity}).`;

    if (!title || title.trim().length === 0 || title.trim().length > 100) {
        return "Title must be between 1 and 100 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(organizerEmail)) return "Must be a valid email address.";

    return null;
}

module.exports = { validateBookingRules };