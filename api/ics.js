// /api/ics.js
// Generates and serves a .ics calendar file for a single event.
//
// Usage: GET /api/ics?start=20260804T170000Z&end=20260804T190000Z
//          &title=Kingdom+Scaling+Principles+Business+Lunch
//          &location=Rise+Up+Kings+HQ,+Dallas-Fort+Worth,+TX
//          &description=Hosted+by+Rise+Up+Kings.

function escapeIcs(str) {
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
}

function formatTimestamp(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export default function handler(req, res) {
    const { title, start, end, location, description } = req.query;

    if (!start || !end) {
        res.status(400).send('Missing required "start" or "end" param (format: YYYYMMDDTHHMMSSZ)');
        return;
    }

    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@businesslunch.vercel.app`;

    const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Rise Up Kings//Event Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatTimestamp(new Date())}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeIcs(title || 'Event')}`,
        location    ? `LOCATION:${escapeIcs(location)}`       : null,
        description ? `DESCRIPTION:${escapeIcs(description)}` : null,
        'END:VEVENT',
        'END:VCALENDAR',
    ].filter(Boolean);

    const icsBody = icsLines.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="event.ics"');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(icsBody);
}
