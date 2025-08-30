// db.js - Fixed version with proper table creation
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'bookings.db');

// Create database directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeTables();
    }
});

function initializeTables() {
    // Create tables in sequence to avoid conflicts
    const tables = [
        // Bookings table
        `CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            court_type TEXT NOT NULL,
            court_number INTEGER NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            duration INTEGER NOT NULL,
            customer_name TEXT NOT NULL,
            customer_contact TEXT NOT NULL,
            status TEXT NOT NULL,
            amount_paid REAL NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )`,
        
        // Courts table
        `CREATE TABLE IF NOT EXISTS courts (
            id TEXT PRIMARY KEY,
            court_type TEXT NOT NULL,
            court_number INTEGER NOT NULL,
            hourly_rate REAL NOT NULL,
            slot_duration INTEGER NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            maintenance_notes TEXT
        )`,
        
        // Equipment table
        `CREATE TABLE IF NOT EXISTS equipment (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            stock_quantity INTEGER NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )`,
        
        // Packages table
        `CREATE TABLE IF NOT EXISTS packages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            duration INTEGER,
            includes_equipment BOOLEAN DEFAULT 0,
            includes_coaching BOOLEAN DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )`,

        // Sales table to track equipment and package sales
        `CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            item_name TEXT NOT NULL,
            item_type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price_per_item REAL NOT NULL,
            total_amount REAL NOT NULL,
            customer_name TEXT,
            customer_contact TEXT,
            booking_id TEXT,
            sale_date TEXT NOT NULL,
            created_at INTEGER NOT NULL
        )`
    ];

    // Create tables sequentially
    db.serialize(() => {
        tables.forEach((tableSql, index) => {
            db.run(tableSql, function(err) {
                if (err) {
                    console.error(`Error creating table ${index + 1}:`, err);
                }
            });
        });
        // After tables are guaranteed to be created, insert sample data
        insertSampleData();
    });
}

function insertSampleData() {
    // Insert sample courts if empty
    db.get("SELECT COUNT(*) as count FROM courts", (err, row) => {
        if (!err && row.count === 0) {
            const courts = [
                ['1', 'Indoor', 1, 10000, 90, 1, ''], ['2', 'Indoor', 2, 10000, 90, 1, ''],
                ['3', 'Indoor', 3, 10000, 90, 1, ''], ['4', 'Indoor', 4, 10000, 90, 1, ''],
                ['5', 'Outdoor', 1, 7000, 60, 1, ''], ['6', 'Outdoor', 2, 7000, 60, 1, ''],
                ['7', 'Outdoor', 3, 7000, 60, 1, ''], ['8', 'Outdoor', 4, 7000, 60, 1, '']
            ];
            const stmt = db.prepare("INSERT INTO courts (id, court_type, court_number, hourly_rate, slot_duration, is_active, maintenance_notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
            courts.forEach(court => stmt.run(court));
            stmt.finalize(() => console.log('Sample courts data inserted'));
        }
    });
    
    // Insert sample equipment if empty
    db.get("SELECT COUNT(*) as count FROM equipment", (err, row) => {
        if (!err && row.count === 0) {
            const equipment = [
                ['eq1', 'Padel Ball (3 pack)', 'Balls', 'Professional padel balls', 1500, 50, 1, Date.now(), Date.now()],
                ['eq2', 'Padel Racket - Beginner', 'Rackets', 'Beginner friendly racket', 8000, 20, 1, Date.now(), Date.now()],
                ['eq3', 'Padel Racket - Pro', 'Rackets', 'Professional grade racket', 15000, 15, 1, Date.now(), Date.now()],
                ['eq4', 'Grip Tape', 'Accessories', 'Racket grip tape', 500, 100, 1, Date.now(), Date.now()]
            ];
            const stmt = db.prepare("INSERT INTO equipment (id, name, category, description, price, stock_quantity, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            equipment.forEach(item => stmt.run(item));
            stmt.finalize(() => console.log('Sample equipment data inserted'));
        }
    });
    
    // Insert sample packages if empty
    db.get("SELECT COUNT(*) as count FROM packages", (err, row) => {
        if (!err && row.count === 0) {
            const packages = [
                ['pkg1', 'Birthday Package', '2 hours court + equipment', 25000, 120, 1, 0, 1, Date.now(), Date.now()],
                ['pkg2', 'Corporate Package', '4 hours + coaching', 50000, 240, 1, 1, 1, Date.now(), Date.now()],
                ['pkg3', 'Coaching Package', '5 sessions with coach', 20000, 300, 0, 1, 1, Date.now(), Date.now()]
            ];
            const stmt = db.prepare("INSERT INTO packages (id, name, description, price, duration, includes_equipment, includes_coaching, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            packages.forEach(pkg => stmt.run(pkg));
            stmt.finalize(() => console.log('Sample packages data inserted'));
        }
    });
}

module.exports = db;
