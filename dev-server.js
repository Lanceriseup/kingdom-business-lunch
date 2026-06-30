// dev-server.js
// Local dev only — mocks /api/rsvp so the form works without Vercel.
// Run: npm run dev   → then open http://localhost:3000

import http from 'http';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'text/javascript',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.json': 'application/json',
    '.woff2':'font/woff2',
    '.woff': 'font/woff',
    '.webp': 'image/webp',
};

http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // ── Mock RSVP API ──────────────────────────────────────────
    if (url.pathname === '/api/rsvp' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('\n[DEV] RSVP submission received:');
                console.log('  Name  :', data.firstName, data.lastName);
                console.log('  Email :', data.email);
                console.log('  Dates :', data.date_attending);
                if (data.bringingGuest === 'yes') {
                    console.log('  Guest :', data.guest1Name, data.guest1Email);
                }
            } catch {
                console.log('[DEV] RSVP received (raw):', body.slice(0, 200));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }

    // ── ICS calendar download ──────────────────────────────────
    if (url.pathname === '/api/ics' && req.method === 'GET') {
        const { title, start, end, location, description } = Object.fromEntries(url.searchParams);

        if (!start || !end) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing required "start" or "end" param (format: YYYYMMDDTHHMMSSZ)');
            return;
        }

        const escape = str => String(str)
            .replace(/\\/g, '\\\\').replace(/;/g, '\\;')
            .replace(/,/g, '\\,').replace(/\n/g, '\\n');

        const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@businesslunch.vercel.app`;
        const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const lines = [
            'BEGIN:VCALENDAR', 'VERSION:2.0',
            'PRODID:-//Rise Up Kings//Event Calendar//EN',
            'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${uid}`, `DTSTAMP:${dtstamp}`,
            `DTSTART:${start}`, `DTEND:${end}`,
            `SUMMARY:${escape(title || 'Event')}`,
            location    ? `LOCATION:${escape(location)}`       : null,
            description ? `DESCRIPTION:${escape(description)}` : null,
            'END:VEVENT', 'END:VCALENDAR',
        ].filter(Boolean).join('\r\n');

        res.writeHead(200, {
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': 'attachment; filename="event.ics"',
            'Cache-Control': 'public, max-age=3600',
        });
        res.end(lines);
        return;
    }

    // ── Serve static files ─────────────────────────────────────
    const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const safePath = path.resolve(__dirname, '.' + requestedPath);

    // Prevent directory traversal
    if (!safePath.startsWith(path.resolve(__dirname))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(safePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        const ext  = path.extname(safePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });

}).listen(PORT, () => {
    console.log('\nDev server running → http://localhost:3001');
    console.log('Submissions logged here — NOT sent to GHL or Ontraport.\n');
});
