const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'rsvps.json');

// Preloaded wishes if file is empty
const DEFAULT_WISHES = [
    { name: "Aarav & Pooja Patel", status: "yes", guests: "2", message: "Congratulations Shivam and Richa! So happy for both of you. Wishing you a beautiful journey ahead!" },
    { name: "Neha Darji", status: "yes", guests: "1", message: "Loads of love to the lovely couple! Can't wait to celebrate with you guys in Vadodara!" },
    { name: "Kunal Shah", status: "no", guests: "0", message: "Heartiest congratulations guys! Truly sorry I won't be able to make it, but sending my best blessings and wishes!" }
];

// Helper to initialize the data file if it doesn't exist
function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_WISHES, null, 2), 'utf8');
            console.log(`Initialized data file with default entries: ${DATA_FILE}`);
        } catch (err) {
            console.error('Error initializing data file:', err);
        }
    }
}

// Helper to read RSVPs from file
function readRSVPs() {
    initDataFile();
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading RSVP data file:', err);
        return [];
    }
}

// Helper to write RSVPs to file
function writeRSVPs(rsvps) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(rsvps, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Error writing RSVP data file:', err);
        return false;
    }
}

// Mime types for static server
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // API GET Endpoint: Retrieve all RSVPs
    if (req.method === 'GET' && url.pathname === '/api/rsvps') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(readRSVPs()));
        return;
    }
    
    // API POST Endpoint: Save a new RSVP
    if (req.method === 'POST' && url.pathname === '/api/rsvp') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const newRSVP = JSON.parse(body);
                
                // Server-side validation
                if (!newRSVP.name || !newRSVP.status) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Name and status are required.' }));
                    return;
                }
                
                // Read, append and write to file
                const rsvps = readRSVPs();
                rsvps.unshift(newRSVP); // Prepend to show latest first
                
                if (writeRSVPs(rsvps)) {
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, count: rsvps.filter(r => r.status === 'yes').length }));
                    console.log(`Saved RSVP from: ${newRSVP.name} (${newRSVP.status === 'yes' ? 'Attending' : 'Not Attending'})`);
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to write data to backend file.' }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
            }
        });
        return;
    }
    
    // Static File Server
    let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
    
    // Safety check (prevent directory traversal)
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access Forbidden');
        return;
    }
    
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File Not Found');
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        
        const readStream = fs.createReadStream(filePath);
        readStream.on('error', () => {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        });
        readStream.pipe(res);
    });
});

// Initialize files
initDataFile();

// Start Server
server.listen(PORT, () => {
    console.log('\n======================================================');
    console.log(`  Shivam & Richa Engagement Invitation Server Active`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  RSVP Data File: ${DATA_FILE}`);
    console.log('======================================================\n');
});
