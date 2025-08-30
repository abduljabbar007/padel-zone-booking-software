# System Architecture - Padel Court Booking System

## 📋 Architecture Overview

The Padel Court Booking System follows a modern client-server architecture with a focus on modularity, scalability, and maintainability.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  📱 User Interface (HTML5 + CSS3 + JavaScript)             │
│  ├── Booking Interface (Public Users)                      │
│  ├── Admin Panel (Administrative Users)                    │
│  └── Reporting Dashboard (Analytics & Reports)             │
├─────────────────────────────────────────────────────────────┤
│                    API LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  🔗 RESTful API Endpoints                                  │
│  ├── GET/POST/PUT/PATCH/DELETE operations                  │
│  ├── Real-time data synchronization                        │
│  └── JSON-based communication                              │
├─────────────────────────────────────────────────────────────┤
│                    DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  🗄️ Database Management System                            │
│  ├── Bookings Table (Core booking data)                   │
│  ├── Courts Table (Court configuration)                   │
│  └── Automated data persistence                           │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Design Principles

### 1. Separation of Concerns
- **Presentation Layer**: HTML/CSS for structure and styling
- **Business Logic**: JavaScript classes for functionality
- **Data Management**: RESTful API for data operations

### 2. Modularity
- **app.js**: Core booking system logic
- **admin.js**: Administrative functionality
- **reports.js**: Analytics and reporting engine

### 3. Scalability
- Modular architecture supports easy feature additions
- RESTful API design enables future integrations
- Database schema designed for performance and growth

## 💻 Frontend Architecture

### Component Structure
```
PadelBookingSystem (Main Controller)
├── Court Management
│   ├── Court Display Logic
│   ├── Slot Generation Algorithm
│   └── Availability Checking
├── Booking Management
│   ├── Modal Handling
│   ├── Form Validation
│   └── Payment Calculation
└── UI State Management
    ├── Tab Switching
    ├── Date Selection
    └── Notification System

AdminPanel (Administration)
├── Booking Oversight
│   ├── Status Management
│   ├── Filtering System
│   └── Bulk Operations
├── Revenue Tracking
│   ├── MTD Calculations
│   └── Performance Metrics
└── Data Visualization
    ├── Chart Generation
    └── Interactive Dashboards

ReportsModule (Analytics)
├── Report Generation
│   ├── Date Range Analysis
│   ├── Day-End Summaries
│   └── Future Booking Views
├── Data Processing
│   ├── Revenue Calculations
│   ├── Trend Analysis
│   └── Statistical Metrics
└── Export Functionality
    ├── CSV Generation
    └── Data Formatting
```

### State Management Flow
```
User Action → Event Handler → Data Validation → API Call → Database Update → UI Refresh → User Feedback
```

## 🔄 Data Flow Architecture

### 1. Booking Creation Flow
```
User Selects Slot
        ↓
Availability Check (Client-side)
        ↓
Booking Modal Display
        ↓
Form Completion & Validation
        ↓
API POST Request
        ↓
Database Insert
        ↓
Response Handling
        ↓
UI Update & Notification
        ↓
Real-time Sync Across Components
```

### 2. Admin Management Flow
```
Admin Access Request
        ↓
Load All Bookings (GET API)
        ↓
Display with Filters & Sorting
        ↓
Status Update Action
        ↓
API PATCH Request
        ↓
Database Update
        ↓
Refresh Admin View
        ↓
Sync with User Interface
```

### 3. Reporting Flow
```
Report Type Selection
        ↓
Date Range Configuration
        ↓
Data Filtering & Processing
        ↓
Metric Calculations
        ↓
Chart Generation
        ↓
Display Results
        ↓
Export Option (CSV)
```

## 🗄️ Database Design

### Entity-Relationship Model

```
┌─────────────────┐    1:N    ┌─────────────────┐
│     COURTS      │◄─────────►│    BOOKINGS     │
├─────────────────┤           ├─────────────────┤
│ id (PK)         │           │ id (PK)         │
│ court_type      │           │ court_type      │
│ court_number    │           │ court_number    │
│ hourly_rate     │           │ date            │
│ slot_duration   │           │ start_time      │
│ is_active       │           │ duration        │
│ maintenance     │           │ end_time        │
└─────────────────┘           │ customer_name   │
                              │ customer_contact│
                              │ status          │
                              │ amount_paid     │
                              │ created_at      │
                              │ updated_at      │
                              └─────────────────┘
```

### Indexing Strategy
```sql
-- Primary indexes for fast lookups
CREATE INDEX idx_bookings_date_time ON bookings(date, start_time);
CREATE INDEX idx_bookings_court ON bookings(court_type, court_number);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer ON bookings(customer_name, customer_contact);

-- Composite indexes for complex queries
CREATE INDEX idx_bookings_date_status ON bookings(date, status);
CREATE INDEX idx_bookings_court_date ON bookings(court_type, court_number, date);
```

## 🔗 API Architecture

### RESTful Endpoint Design

#### Bookings Resource
```
GET    /tables/bookings              # List all bookings (with pagination)
POST   /tables/bookings              # Create new booking
GET    /tables/bookings/{id}         # Get specific booking
PUT    /tables/bookings/{id}         # Full update of booking
PATCH  /tables/bookings/{id}         # Partial update (status changes)
DELETE /tables/bookings/{id}         # Soft delete booking
```

#### Courts Resource
```
GET    /tables/courts                # List all courts
GET    /tables/courts/{id}           # Get specific court details
```

### Request/Response Format

#### Booking Creation Request
```json
{
  "court_type": "Indoor",
  "court_number": 1,
  "date": "2024-01-15",
  "start_time": "14:00",
  "duration": 90,
  "end_time": "15:30",
  "customer_name": "John Doe",
  "customer_contact": "+91 9876543210",
  "status": "Booked",
  "amount_paid": 15000
}
```

#### API Response Format
```json
{
  "data": [...],
  "total": 45,
  "page": 1,
  "limit": 100,
  "table": "bookings",
  "schema": {...}
}
```

## ⚡ Performance Optimizations

### Frontend Performance
```javascript
// Efficient DOM manipulation
const fragment = document.createDocumentFragment();
// Batch DOM updates
slots.forEach(slot => fragment.appendChild(slotElement));
container.appendChild(fragment);

// Debounced search and filtering
const debouncedFilter = debounce(filterBookings, 300);

// Lazy loading for large datasets
const observer = new IntersectionObserver(loadMoreBookings);
```

### Data Processing Optimization
```javascript
// Efficient date/time calculations
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Optimized overlap detection
const timesOverlap = (start1, end1, start2, end2) => {
    return start1 < end2 && end1 > start2;
};

// Memoized calculations
const memoizedRevenue = useMemo(() => 
    calculateTotalRevenue(bookings), [bookings]
);
```

### Caching Strategy
```javascript
// Client-side caching for court data
const courtCache = new Map();
const getCourt = (id) => {
    if (courtCache.has(id)) return courtCache.get(id);
    // Fetch and cache court data
};

// Session storage for user preferences
sessionStorage.setItem('selectedDate', date);
sessionStorage.setItem('courtType', type);
```

## 🔒 Security Architecture

### Input Validation & Sanitization
```javascript
// Client-side validation
const validateBooking = (booking) => {
    const errors = [];
    if (!booking.customer_name?.trim()) errors.push('Name required');
    if (!isValidEmail(booking.customer_contact)) errors.push('Valid contact required');
    if (!isValidDate(booking.date)) errors.push('Valid date required');
    return errors;
};

// XSS Prevention
const sanitizeInput = (input) => {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};
```

### Data Protection
```javascript
// Secure data transmission
const secureHeaders = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache'
};

// Input length limits
const MAX_NAME_LENGTH = 100;
const MAX_CONTACT_LENGTH = 50;
```

## 📊 Monitoring & Analytics

### Performance Metrics
```javascript
// Response time tracking
const startTime = performance.now();
await apiCall();
const responseTime = performance.now() - startTime;

// Error tracking
window.addEventListener('error', (event) => {
    logError({
        message: event.error.message,
        stack: event.error.stack,
        timestamp: Date.now()
    });
});

// User interaction analytics
const trackUserAction = (action, metadata) => {
    analytics.track(action, {
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        ...metadata
    });
};
```

### Health Monitoring
```javascript
// System health checks
const healthCheck = {
    database: () => fetch('/tables/courts').then(r => r.ok),
    apiLatency: () => measureApiResponseTime(),
    errorRate: () => calculateErrorRate(),
    activeUsers: () => getActiveUserCount()
};
```

## 🚀 Scalability Considerations

### Horizontal Scaling
- **Load Balancing**: Multiple app instances behind load balancer
- **CDN Integration**: Static assets served via Content Delivery Network
- **Database Sharding**: Partition bookings by date ranges or court types

### Vertical Scaling
- **Memory Optimization**: Efficient data structures and garbage collection
- **CPU Optimization**: Algorithms optimized for time complexity
- **Storage Optimization**: Indexed database queries and data compression

### Microservices Architecture (Future)
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Booking       │  │   Payment       │  │   Notification  │
│   Service       │  │   Service       │  │   Service       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌─────────────────┐
                    │   API Gateway   │
                    └─────────────────┘
```

## 📱 Mobile-First Architecture

### Progressive Web App Features
```javascript
// Service Worker for offline capability
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
}

// App manifest for installability
{
    "name": "Padel Court Booking",
    "short_name": "PadelBook",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#2563eb"
}
```

### Responsive Design Strategy
```css
/* Mobile-first breakpoints */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }

/* Touch-friendly interfaces */
.touch-target {
    min-height: 44px;
    min-width: 44px;
}
```

## 🔧 Development & Deployment

### Code Organization
```
src/
├── components/
│   ├── booking/
│   ├── admin/
│   └── reports/
├── utils/
│   ├── api.js
│   ├── validation.js
│   └── calculations.js
├── styles/
│   └── main.css
└── assets/
    └── images/
```

### Build Process
```javascript
// Minification and bundling
const bundle = {
    entry: './src/index.js',
    output: './dist/bundle.min.js',
    optimizations: ['minify', 'treeshake', 'compress']
};
```

### Testing Strategy
```javascript
// Unit tests for core functions
describe('Booking Logic', () => {
    test('calculates correct duration', () => {
        expect(calculateDuration('14:00', '15:30')).toBe(90);
    });
});

// Integration tests for API calls
describe('API Integration', () => {
    test('creates booking successfully', async () => {
        const booking = await createBooking(mockData);
        expect(booking.status).toBe('Booked');
    });
});
```

## 📈 Future Architecture Enhancements

### Real-time Features
- **WebSocket Integration**: Real-time booking updates
- **Push Notifications**: Instant booking confirmations
- **Live Availability**: Real-time court status updates

### AI/ML Integration
- **Demand Prediction**: AI-powered booking predictions
- **Dynamic Pricing**: ML-based pricing optimization
- **Recommendation Engine**: Personalized court suggestions

### Advanced Analytics
- **Time Series Analysis**: Booking pattern analysis
- **Predictive Analytics**: Revenue forecasting
- **Customer Insights**: Behavioral analysis and segmentation

This architecture provides a solid foundation for the current system while maintaining flexibility for future enhancements and scaling requirements.