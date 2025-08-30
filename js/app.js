// Padel Court Booking System - Main Application with POS Integration
class PadelBookingSystem {
    constructor() {
        // State for slot view
        this.currentCourtType = 'Indoor';
        this.selectedSlot = null;
        
        // State for booking table view
        this.currentBookingTableView = 'Indoor';
        
        // Global state
        this.selectedDate = new Date().toISOString().split('T')[0];
        this.currentMainView = 'slots'; // 'slots' or 'bookings'
        
        // Data
        this.courts = [];
        this.bookings = [];
        this.equipment = [];
        this.packages = [];
        this.cartItems = [];
        
        this.init();
    }
    
    async init() {
        await this.loadInitialData();
        this.setupEventListeners();
        this.updateCurrentDate();
        this.setMinDate();
        this.updateViews(); // Initial render
    }

    async loadInitialData() {
        try {
            const [courtsRes, bookingsRes, equipmentRes, packagesRes] = await Promise.all([
                fetch('tables/courts'),
                fetch('tables/bookings'),
                fetch('api/equipment'),
                fetch('api/packages')
            ]);
            this.courts = (await courtsRes.json()).data || [];
            this.bookings = (await bookingsRes.json()).data || [];
            this.equipment = (await equipmentRes.json()).data || [];
            this.packages = (await packagesRes.json()).data || [];
            
            this.populateEquipmentSelect();
            this.populatePackageSelect();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showNotification('Could not load initial data. Please refresh.', 'error');
        }
    }
    
    setupEventListeners() {
        // Main view tabs
        document.getElementById('slotsViewTab').addEventListener('click', () => this.switchMainView('slots'));
        document.getElementById('bookingsViewTab').addEventListener('click', () => this.switchMainView('bookings'));

        // Date selector
        document.getElementById('bookingDate').addEventListener('change', (e) => {
            this.selectedDate = e.target.value;
            this.updateViews();
        });

        // Slot view tabs
        document.getElementById('indoorTab').addEventListener('click', () => this.switchCourtType('Indoor'));
        document.getElementById('outdoorTab').addEventListener('click', () => this.switchCourtType('Outdoor'));
        
        // Booking table view tabs
        document.getElementById('indoorBookingsTab').addEventListener('click', () => this.switchBookingTableView('Indoor'));
        document.getElementById('outdoorBookingsTab').addEventListener('click', () => this.switchBookingTableView('Outdoor'));

        // Modals
        document.getElementById('closeModal').addEventListener('click', () => this.closeBookingModal());
        document.getElementById('cancelBooking').addEventListener('click', () => this.closeBookingModal());
        document.getElementById('confirmBooking').addEventListener('click', () => this.confirmBooking());
        document.getElementById('duration').addEventListener('change', () => this.updateTotalAmount());
        document.getElementById('posBtn').addEventListener('click', () => window.posSystem.openPosModal());
        document.getElementById('closePosModal').addEventListener('click', () => window.posSystem.closePosModal());
    }
    
    // --- VIEW SWITCHING LOGIC ---
    
    updateViews() {
        if (this.currentMainView === 'slots') {
            this.displayCourts();
        } else {
            this.displayBookingsTable();
        }
    }

    switchMainView(view) {
        this.currentMainView = view;
        const slotsView = document.getElementById('slotsView');
        const bookingsView = document.getElementById('bookingsView');
        const slotsTab = document.getElementById('slotsViewTab');
        const bookingsTab = document.getElementById('bookingsViewTab');

        if (view === 'slots') {
            slotsView.classList.remove('hidden');
            bookingsView.classList.add('hidden');
            slotsTab.className = 'px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600';
            bookingsTab.className = 'px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300';
        } else {
            slotsView.classList.add('hidden');
            bookingsView.classList.remove('hidden');
            slotsTab.className = 'px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300';
            bookingsTab.className = 'px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600';
        }
        this.updateViews();
    }
    
    switchCourtType(type) {
        this.currentCourtType = type;
        document.getElementById('indoorTab').classList.toggle('tab-active', type === 'Indoor');
        document.getElementById('outdoorTab').classList.toggle('tab-active', type === 'Outdoor');
        this.displayCourts();
    }
    
    switchBookingTableView(type) {
        this.currentBookingTableView = type;
        document.getElementById('indoorBookingsTab').classList.toggle('tab-active', type === 'Indoor');
        document.getElementById('outdoorBookingsTab').classList.toggle('tab-active', type === 'Outdoor');
        this.displayBookingsTable();
    }

    // --- BOOKING TABLE VIEW RENDER ---

    displayBookingsTable() {
        const container = document.getElementById('bookingsTableContainer');
        const courtsForView = this.courts.filter(c => c.court_type === this.currentBookingTableView);
        if (!container) return;

        let contentHTML = '';
        if (courtsForView.length === 0) {
            contentHTML = '<p class="col-span-full text-center text-gray-500">No courts configured for this type.</p>';
        } else {
            contentHTML = courtsForView
                .sort((a, b) => a.court_number - b.court_number)
                .map(court => this.createSingleCourtBookingTable(court))
                .join('');
        }
        container.innerHTML = contentHTML;
    }

    createSingleCourtBookingTable(court) {
        const bookingsForCourt = this.bookings.filter(b => 
            b.date === this.selectedDate &&
            b.court_type === court.court_type &&
            b.court_number === court.court_number &&
            b.status !== 'Cancelled'
        ).sort((a,b) => a.start_time.localeCompare(b.start_time));

        const tableRows = bookingsForCourt.length > 0 
            ? bookingsForCourt.map(b => `
                <tr>
                    <td class="px-4 py-3 text-sm text-gray-700">${b.customer_name}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">${b.start_time} - ${b.end_time}</td>
                    <td class="px-4 py-3 text-sm text-gray-700 text-right">PKR ${b.amount_paid.toLocaleString()}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="3" class="px-4 py-4 text-center text-sm text-gray-400">No bookings for this date.</td></tr>';

        return `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="p-4 border-b">
                    <h3 class="font-semibold text-gray-800">${court.court_type} Court ${court.court_number}</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time Slot</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Charges</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // --- COURT SLOTS VIEW RENDER (Existing Logic) ---

    async displayCourts() {
        const container = document.getElementById('courtsContainer');
        if (!container) return;
        
        const filteredCourts = this.courts.filter(c => c.court_type === this.currentCourtType && c.is_active).sort((a, b) => a.court_number - b.court_number);
        
        container.innerHTML = filteredCourts.length 
            ? filteredCourts.map(court => this.createCourtElement(court)).join('') 
            : '<div class="col-span-full text-center text-gray-500 py-8">No courts available for this type.</div>';
    }
    
    createCourtElement(court) {
        const slots = this.generateTimeSlots(court);
        const slotsHTML = slots.map(slot => this.createSlotElement(slot, court)).join('');
        return `
            <div class="court-card p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-${court.court_type === 'Indoor' ? 'home' : 'sun'} mr-2 text-blue-600"></i>
                    ${court.court_type} Court ${court.court_number}
                </h3>
                <div class="text-sm text-gray-600 mb-4">
                    <i class="fas fa-rupee-sign mr-1"></i>
                    ${court.court_type === 'Indoor' ? `PKR ${(court.hourly_rate * 1.5).toLocaleString()}/90min` : `PKR ${court.hourly_rate.toLocaleString()}/hr`}
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">${slotsHTML}</div>
            </div>`;
    }
    
    generateTimeSlots(court) {
        const slots = [];
        const slotDuration = court.court_type === 'Indoor' ? 90 : 60;
        let currentTime = this.timeToMinutes('17:00');
        const endOperation = this.timeToMinutes('04:00') + 1440;

        while(currentTime < endOperation) {
            const startTimeStr = this.minutesToTime(currentTime % 1440);
            const endTimeStr = this.minutesToTime((currentTime + slotDuration) % 1440);
            if ((currentTime + slotDuration) > endOperation) break;
            
            const isBooked = this.isSlotBooked(court, startTimeStr);
            slots.push({ startTime: startTimeStr, endTime: endTimeStr, isBooked });
            currentTime += slotDuration;
        }
        return slots;
    }
    
    createSlotElement(slot, court) {
        const disabled = slot.isBooked ? 'slot-booked' : 'slot-available';
        const handler = slot.isBooked ? '' : `onclick="window.bookingSystem.openBookingModal({id:'${court.id}', court_type:'${court.court_type}', court_number:${court.court_number}, hourly_rate:${court.hourly_rate}}, {startTime:'${slot.startTime}', endTime:'${slot.endTime}'})"`;
        return `<div class="p-2 border rounded-md text-xs font-medium text-center ${disabled}" ${handler}>${slot.startTime}<br>${slot.endTime}</div>`;
    }

    isSlotBooked(court, startTime) {
        return this.bookings.some(b => 
            b.court_number === court.court_number &&
            b.court_type === court.court_type &&
            b.date === this.selectedDate &&
            b.status !== 'Cancelled' &&
            b.start_time === startTime
        );
    }
    
    // --- CONFIRM BOOKING & UTILS (Mostly unchanged) ---

    async confirmBooking() {
        const customerName = document.getElementById('customerName').value.trim();
        const customerContact = document.getElementById('customerContact').value.trim();
        if (!customerName || !customerContact) return this.showNotification('Please fill in customer details', 'error');

        const { court, slot } = this.selectedSlot;
        const isIndoor = court.court_type === 'Indoor';
        const durationHours = isIndoor ? 1.5 : parseFloat(document.getElementById('duration').value);
        const durationMins = durationHours * 60;
        const endTime = isIndoor ? slot.endTime : this.minutesToTime(this.timeToMinutes(slot.startTime) + durationMins);
        const courtAmount = court.hourly_rate * durationHours;
        const totalAmount = courtAmount + this.cartItems.reduce((sum, item) => sum + item.price, 0);
        const bookingId = `booking_${Date.now()}`;

        const bookingData = {
            id: bookingId, court_type: court.court_type, court_number: court.court_number,
            date: this.selectedDate, start_time: slot.startTime, duration: durationMins,
            end_time: endTime, customer_name: customerName, customer_contact: customerContact,
            status: 'Booked', amount_paid: totalAmount, created_at: Date.now(), updated_at: Date.now()
        };

        const salesData = this.cartItems.map(item => ({
            item_id: item.id, item_name: item.name, item_type: item.type, quantity: 1,
            price_per_item: item.price, total_amount: item.price, customer_name: customerName,
            customer_contact: customerContact, booking_id: bookingId, sale_date: this.selectedDate
        }));

        try {
            const bookingRes = await fetch('tables/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bookingData) });
            if (!bookingRes.ok) throw new Error('Failed to create booking');
            
            if (salesData.length > 0) {
                const salesRes = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(salesData) });
                if (!salesRes.ok) console.error('Booking created, but failed to record sales.');
            }

            this.showNotification('Booking confirmed successfully!', 'success');
            this.bookings.push(bookingData); // Optimistic update
            this.updateViews(); // Refresh the current view (slots or tables)
            this.closeBookingModal();
        } catch (error) {
            console.error('Error confirming booking:', error);
            this.showNotification('Failed to confirm booking.', 'error');
        }
    }
    
    // --- Unchanged Helper and Utility Functions ---
    populateEquipmentSelect() {
        const select = document.getElementById('equipmentSelect');
        if (!select) return;
        select.innerHTML = '<option value="">Select Equipment</option>';
        this.equipment.forEach(item => {
            if (item.is_active && item.stock_quantity > 0) {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.name} - PKR ${item.price.toLocaleString()}`;
                option.dataset.price = item.price;
                option.dataset.name = item.name;
                option.dataset.type = 'equipment';
                select.appendChild(option);
            }
        });
    }
    populatePackageSelect() {
        const select = document.getElementById('packageSelect');
        if (!select) return;
        select.innerHTML = '<option value="">Select Package</option>';
        this.packages.forEach(pkg => {
            if (pkg.is_active) {
                const option = document.createElement('option');
                option.value = pkg.id;
                option.textContent = `${pkg.name} - PKR ${pkg.price.toLocaleString()}`;
                option.dataset.price = pkg.price;
                option.dataset.name = pkg.name;
                option.dataset.type = 'package';
                select.appendChild(option);
            }
        });
    }
    updateCurrentDate() {
        const dateEl = document.getElementById('currentDate');
        if (!dateEl) return;
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-US', options);
    }
    setMinDate() {
        const bookingDate = document.getElementById('bookingDate');
        if (!bookingDate) return;
        const today = new Date().toISOString().split('T')[0];
        bookingDate.value = today;
        bookingDate.min = today;
        this.selectedDate = today;
    }
    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60) % 24;
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
    openBookingModal(court, slot) {
        this.selectedSlot = { court, slot };
        this.cartItems = [];
        document.getElementById('courtDetails').textContent = `${court.court_type} Court ${court.court_number} - ${slot.startTime} to ${slot.endTime}`;
        document.getElementById('durationSelector').classList.toggle('hidden', court.court_type !== 'Outdoor');
        document.getElementById('bookingModal').classList.remove('hidden');
        document.getElementById('customerName').value = '';
        document.getElementById('customerContact').value = '';
        document.getElementById('duration').value = '1';
        document.getElementById('cartItems').innerHTML = '';
        this.updateTotalAmount();
    }
    updateTotalAmount() {
        if (!this.selectedSlot) return;
        const { court } = this.selectedSlot;
        let durationHours = court.court_type === 'Indoor' ? 1.5 : parseFloat(document.getElementById('duration').value);
        let amount = court.hourly_rate * durationHours;
        amount += this.cartItems.reduce((sum, item) => sum + item.price, 0);
        document.getElementById('totalAmount').textContent = `PKR ${amount.toLocaleString()}`;
    }
    closeBookingModal() {
        document.getElementById('bookingModal').classList.add('hidden');
        this.selectedSlot = null;
    }
    showNotification(message, type) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        const icon = document.getElementById('notificationIcon');
        const messageEl = document.getElementById('notificationMessage');
        messageEl.textContent = message;
        icon.className = type === 'success' ? 'fas fa-check-circle text-green-500 text-xl' : 'fas fa-exclamation-circle text-red-500 text-xl';
        notification.querySelector('div').className = `bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm border-${type === 'success' ? 'green' : 'red'}-500`;
        notification.classList.remove('hidden');
        setTimeout(() => notification.classList.add('hidden'), 5000);
    }
    addToCart() {
        const equipmentSelect = document.getElementById('equipmentSelect');
        const packageSelect = document.getElementById('packageSelect');
        const selectedItem = equipmentSelect.value ? equipmentSelect.options[equipmentSelect.selectedIndex] : packageSelect.value ? packageSelect.options[packageSelect.selectedIndex] : null;
        if (selectedItem && selectedItem.value) {
            const cartItem = { id: selectedItem.value, name: selectedItem.dataset.name, price: parseFloat(selectedItem.dataset.price), type: selectedItem.dataset.type, cartId: `cart_${Date.now()}` };
            this.cartItems.push(cartItem);
            this.renderCart();
            equipmentSelect.value = ''; packageSelect.value = '';
            this.updateTotalAmount();
        }
    }
    removeFromCart(cartId) {
        this.cartItems = this.cartItems.filter(item => item.cartId !== cartId);
        this.renderCart();
        this.updateTotalAmount();
    }
    renderCart() {
        const cartContainer = document.getElementById('cartItems');
        cartContainer.innerHTML = this.cartItems.map(item => `
            <div class="flex justify-between items-center bg-gray-100 p-2 rounded-md">
                <span class="text-sm">${item.name} - PKR ${item.price.toLocaleString()}</span>
                <button onclick="window.bookingSystem.removeFromCart('${item.cartId}')" class="text-red-600 hover:text-red-800"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    }
}

// Standalone POS System (Unchanged)
class POSSystem {
    constructor() { this.cart = []; }
    async openPosModal() {
        this.cart = [];
        document.getElementById('posCustomerName').value = '';
        document.getElementById('posCustomerContact').value = '';
        this.updatePosCartDisplay();
        this.populatePosSelects();
        document.getElementById('posModal').classList.remove('hidden');
    }
    closePosModal() { document.getElementById('posModal').classList.add('hidden'); }
    populatePosSelects() {
        const equipment = window.bookingSystem.equipment;
        const packages = window.bookingSystem.packages;
        const eqSelect = document.getElementById('posEquipmentSelect');
        const pkgSelect = document.getElementById('posPackageSelect');
        eqSelect.innerHTML = '<option value="">Select Equipment</option>' + equipment.filter(e => e.is_active).map(e => `<option value="${e.id}" data-price="${e.price}" data-name="${e.name}" data-type="equipment">${e.name} - PKR ${e.price.toLocaleString()}</option>`).join('');
        pkgSelect.innerHTML = '<option value="">Select Package</option>' + packages.filter(p => p.is_active).map(p => `<option value="${p.id}" data-price="${p.price}" data-name="${p.name}" data-type="package">${p.name} - PKR ${p.price.toLocaleString()}</option>`).join('');
    }
    addToPosCart() {
        const eqSelect = document.getElementById('posEquipmentSelect');
        const pkgSelect = document.getElementById('posPackageSelect');
        const selected = eqSelect.value ? eqSelect.options[eqSelect.selectedIndex] : pkgSelect.value ? pkgSelect.options[pkgSelect.selectedIndex] : null;
        if (selected && selected.value) {
            this.cart.push({ id: selected.value, name: selected.dataset.name, price: parseFloat(selected.dataset.price), type: selected.dataset.type });
            this.updatePosCartDisplay();
            eqSelect.value = ''; pkgSelect.value = '';
        }
    }
    removeFromPosCart(index) {
        this.cart.splice(index, 1);
        this.updatePosCartDisplay();
    }
    updatePosCartDisplay() {
        const cartContainer = document.getElementById('posCartItems');
        cartContainer.innerHTML = this.cart.length ? this.cart.map((item, index) => `
            <div class="flex justify-between items-center bg-white p-2 rounded-md border mb-2">
                <span class="text-sm">${item.name} - PKR ${item.price.toLocaleString()}</span>
                <button onclick="window.posSystem.removeFromPosCart(${index})" class="text-red-600"><i class="fas fa-times"></i></button>
            </div>`).join('') : '<p class="text-gray-500 text-center py-4">No items added</p>';
        const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0);
        const tax = subtotal * 0;
        document.getElementById('posSubtotal').textContent = `PKR ${subtotal.toLocaleString()}`;
        document.getElementById('posTax').textContent = `PKR ${tax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('posTotal').textContent = `PKR ${(subtotal + tax).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    clearPosCart() {
        this.cart = [];
        this.updatePosCartDisplay();
        document.getElementById('posCustomerName').value = '';
        document.getElementById('posCustomerContact').value = '';
    }
    async completePosSale() {
        const customerName = document.getElementById('posCustomerName').value.trim();
        if (this.cart.length === 0) return window.bookingSystem.showNotification('Cart is empty.', 'error');
        if (!customerName) return window.bookingSystem.showNotification('Please enter customer name.', 'error');
        const salesData = this.cart.map(item => ({
            item_id: item.id, item_name: item.name, item_type: item.type, quantity: 1,
            price_per_item: item.price, total_amount: item.price, customer_name: customerName,
            customer_contact: document.getElementById('posCustomerContact').value.trim(),
            booking_id: null, sale_date: new Date().toISOString().split('T')[0]
        }));
        try {
            const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(salesData) });
            if (!res.ok) throw new Error('Failed to save sale');
            window.bookingSystem.showNotification('Sale completed successfully!', 'success');
            this.clearPosCart();
            this.closePosModal();
        } catch (error) {
            console.error('Error completing POS sale:', error);
            window.bookingSystem.showNotification('Failed to complete sale.', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.bookingSystem = new PadelBookingSystem();
    if (typeof POSSystem !== 'undefined') {
        window.posSystem = new POSSystem();
    }
});

// Global functions for HTML onclick attributes
function addToCart() { window.bookingSystem.addToCart(); }
function addToPosCart() { window.posSystem.addToPosCart(); }
function completePosSale() { window.posSystem.completePosSale(); }
function clearPosCart() { window.posSystem.clearPosCart(); }