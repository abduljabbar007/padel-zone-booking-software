// enhanced-server-endpoints.js - Updated with equipment, packages, and sales management
const db = require('./db');

function handleEnhancedEndpoints(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(p => p);
  const resource = pathParts[1];
  const id = pathParts[2];

  // --- Equipment API ---
  if (resource === 'equipment') {
    if (req.method === 'GET') {
      db.all("SELECT * FROM equipment ORDER BY category, name", [], (err, rows) => {
        if (err) return sendError(res, 500, 'Database error');
        sendJSON(res, 200, { data: rows });
      });
    } else if (req.method === 'POST') {
      handleBody(req, res, (equipment) => {
        equipment.id = `eq_${Date.now()}`;
        const stmt = db.prepare(`INSERT INTO equipment (id, name, category, description, price, stock_quantity, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        stmt.run([equipment.id, equipment.name, equipment.category, equipment.description, equipment.price, equipment.stock_quantity, equipment.is_active ?? 1, Date.now(), Date.now()], function(err) {
          if (err) return sendError(res, 500, 'Failed to add equipment');
          sendJSON(res, 201, { success: true, data: equipment });
        });
        stmt.finalize();
      });
    } else if (req.method === 'PUT' && id) {
      handleBody(req, res, (updates) => {
        const stmt = db.prepare(`UPDATE equipment SET name = ?, category = ?, description = ?, price = ?, stock_quantity = ?, is_active = ?, updated_at = ? WHERE id = ?`);
        stmt.run([updates.name, updates.category, updates.description, updates.price, updates.stock_quantity, updates.is_active, Date.now(), id], function(err) {
          if (err) return sendError(res, 500, 'Failed to update equipment');
          sendJSON(res, 200, { success: true, changes: this.changes });
        });
        stmt.finalize();
      });
    } else if (req.method === 'DELETE' && id) {
      db.run("DELETE FROM equipment WHERE id = ?", [id], function(err) {
        if (err) return sendError(res, 500, 'Failed to delete equipment');
        sendJSON(res, 200, { success: true, changes: this.changes });
      });
    } else {
      return false; // Not a recognized equipment endpoint
    }
    return true; // Endpoint handled
  }
  
  // --- Packages API ---
  if (resource === 'packages') {
    if (req.method === 'GET') {
        db.all("SELECT * FROM packages ORDER BY name", [], (err, rows) => {
            if (err) return sendError(res, 500, 'Database error');
            sendJSON(res, 200, { data: rows });
        });
    } else if (req.method === 'POST') {
        handleBody(req, res, (pkg) => {
            pkg.id = `pkg_${Date.now()}`;
            const stmt = db.prepare(`INSERT INTO packages (id, name, description, price, duration, includes_equipment, includes_coaching, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            stmt.run([pkg.id, pkg.name, pkg.description, pkg.price, pkg.duration, pkg.includes_equipment ? 1:0, pkg.includes_coaching ? 1:0, pkg.is_active ?? 1, Date.now(), Date.now()], function(err) {
                if (err) return sendError(res, 500, 'Failed to add package');
                sendJSON(res, 201, { success: true, data: pkg });
            });
            stmt.finalize();
        });
    } else if (req.method === 'PUT' && id) {
        handleBody(req, res, (updates) => {
            const stmt = db.prepare(`UPDATE packages SET name = ?, description = ?, price = ?, duration = ?, includes_equipment = ?, includes_coaching = ?, is_active = ?, updated_at = ? WHERE id = ?`);
            stmt.run([updates.name, updates.description, updates.price, updates.duration, updates.includes_equipment ? 1:0, updates.includes_coaching ? 1:0, updates.is_active, Date.now(), id], function(err) {
                if (err) return sendError(res, 500, 'Failed to update package');
                sendJSON(res, 200, { success: true, changes: this.changes });
            });
            stmt.finalize();
        });
    } else if (req.method === 'DELETE' && id) {
        db.run("DELETE FROM packages WHERE id = ?", [id], function(err) {
            if (err) return sendError(res, 500, 'Failed to delete package');
            sendJSON(res, 200, { success: true, changes: this.changes });
        });
    } else {
        return false;
    }
    return true;
  }

  // --- Sales API ---
  if (resource === 'sales') {
    if (req.method === 'POST') {
      handleBody(req, res, (sales) => {
        const stmt = db.prepare(`INSERT INTO sales (id, item_id, item_name, item_type, quantity, price_per_item, total_amount, customer_name, customer_contact, booking_id, sale_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        db.serialize(() => {
          sales.forEach(sale => {
            const saleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            stmt.run([saleId, sale.item_id, sale.item_name, sale.item_type, sale.quantity, sale.price_per_item, sale.total_amount, sale.customer_name, sale.customer_contact, sale.booking_id, sale.sale_date, Date.now()]);
          });
        });
        stmt.finalize((err) => {
          if (err) return sendError(res, 500, 'Failed to record sale');
          sendJSON(res, 201, { success: true });
        });
      });
    } else {
        return false;
    }
    return true;
  }

  // --- Sales Report Data Fetching API ---
  if (resource === 'sales-report' && req.method === 'GET') {
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const query = `SELECT * FROM sales WHERE sale_date BETWEEN ? AND ? ORDER BY sale_date`;
    db.all(query, [startDate, endDate], (err, rows) => {
      if (err) return sendError(res, 500, 'Database error fetching sales');
      sendJSON(res, 200, { data: rows });
    });
    return true;
  }

  return false; // No enhanced endpoint was matched
}

// --- Helper Functions ---
function handleBody(req, res, callback) {
  let body = '';
  req.on('data', chunk => { body += chunk.toString(); });
  req.on('end', () => {
    try {
      callback(JSON.parse(body));
    } catch (error) {
      sendError(res, 400, 'Invalid JSON');
    }
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

module.exports = { handleEnhancedEndpoints };
