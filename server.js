const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { handleEnhancedEndpoints } = require('./enhanced-server-endpoints');

const PORT = 8000;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Handle enhanced endpoints first (for /api/* routes)
  if (handleEnhancedEndpoints(req, res)) {
    return;
  }
  
  // Serve courts data
  if (req.url === '/tables/courts' && req.method === 'GET') {
    db.all("SELECT * FROM courts WHERE is_active = 1", [], (err, rows) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database error' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: rows }));
    });
    return;
  }
  
  // Serve bookings data
  if (req.url === '/tables/bookings' && req.method === 'GET') {
    db.all("SELECT * FROM bookings ORDER BY date DESC, start_time DESC", [], (err, rows) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database error' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: rows }));
    });
    return;
  }
  
  // Handle POST requests for new bookings
  if (req.url === '/tables/bookings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const newBooking = JSON.parse(body);
        // Use the ID provided by the client to link sales records correctly
        const bookingId = newBooking.id || `booking_${Date.now()}`;
        
        const stmt = db.prepare(`INSERT INTO bookings 
          (id, court_type, court_number, date, start_time, end_time, duration, 
           customer_name, customer_contact, status, amount_paid, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        stmt.run([
          bookingId, newBooking.court_type, newBooking.court_number, newBooking.date,
          newBooking.start_time, newBooking.end_time, newBooking.duration,
          newBooking.customer_name, newBooking.customer_contact, newBooking.status,
          newBooking.amount_paid, newBooking.created_at, newBooking.updated_at
        ], function(err) {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to create booking: ' + err.message }));
            return;
          }
          newBooking.id = bookingId;
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: newBooking }));
        });
        stmt.finalize();
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON: ' + error.message }));
      }
    });
    return;
  }

  // Handle PATCH requests for partial booking updates (e.g., status changes)
  if (req.url.startsWith('/tables/bookings/') && req.method === 'PATCH') {
    const id = req.url.split('/').pop();
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const updates = JSON.parse(body);
        const updateFields = Object.keys(updates).map(key => `${key} = ?`);
        const values = [...Object.values(updates), id];
        
        if (updateFields.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No fields to update' }));
          return;
        }
        
        const updateQuery = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`;
        db.run(updateQuery, values, function(err) {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to update booking: ' + err.message }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, changes: this.changes }));
        });
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON: ' + error.message }));
      }
    });
    return;
  }
  
  // Serve static files
  const filePath = req.url === '/' ? '/index.html' : req.url;
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
  }
  
  const localPath = filePath.startsWith('/js/') ? path.join(__dirname, filePath) : path.join(__dirname, filePath);

  fs.readFile(localPath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Admin Panel available at http://localhost:${PORT}/admin.html`);
});