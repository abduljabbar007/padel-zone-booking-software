// Admin Panel Functionality with Enhanced Features
class AdminPanel {
    constructor() {
        this.bookings = [];
        this.equipment = [];
        this.packages = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadInitialData();
    }
    
    async loadInitialData() {
        try {
            const [bookingsRes, equipmentRes, packagesRes] = await Promise.all([
                fetch('tables/bookings'),
                fetch('api/equipment'),
                fetch('api/packages')
            ]);
            this.bookings = (await bookingsRes.json()).data || [];
            this.equipment = (await equipmentRes.json()).data || [];
            this.packages = (await packagesRes.json()).data || [];
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }
    
    setupEventListeners() {
        document.getElementById('manageBookingsBtn').addEventListener('click', () => this.showManageBookings());
        document.getElementById('reportsBtn').addEventListener('click', () => this.showReports());
        document.getElementById('mtdWidgetBtn').addEventListener('click', () => this.showMTDWidget());
        document.getElementById('equipmentBtn').addEventListener('click', () => this.showEquipmentManagement());
        document.getElementById('packagesBtn').addEventListener('click', () => this.showPackagesManagement());
    }
    
    async showManageBookings() {
        await this.loadInitialData(); // Refresh data
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="p-6 border-b border-gray-200"><h2 class="text-xl font-semibold"><i class="fas fa-calendar-alt mr-2 text-blue-600"></i>Manage Bookings</h2></div>
                <div class="p-6">
                    <div class="mb-4 flex flex-wrap gap-2">
                        <select id="statusFilter" class="border rounded-md px-3 py-2"><option value="">All Status</option><option>Booked</option><option>Completed</option><option>Cancelled</option></select>
                        <select id="courtTypeFilter" class="border rounded-md px-3 py-2"><option value="">All Courts</option><option>Indoor</option><option>Outdoor</option></select>
                        <input type="date" id="dateFilter" class="border rounded-md px-3 py-2">
                        <button id="clearFilters" class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Clear</button>
                    </div>
                    <div id="bookingsTable"></div>
                </div>
            </div>`;
        
        document.getElementById('statusFilter').addEventListener('change', () => this.displayBookingsTable());
        document.getElementById('courtTypeFilter').addEventListener('change', () => this.displayBookingsTable());
        document.getElementById('dateFilter').addEventListener('change', () => this.displayBookingsTable());
        document.getElementById('clearFilters').addEventListener('click', () => {
            document.getElementById('statusFilter').value = '';
            document.getElementById('courtTypeFilter').value = '';
            document.getElementById('dateFilter').value = '';
            this.displayBookingsTable();
        });
        this.displayBookingsTable();
    }
    
    displayBookingsTable() {
        const status = document.getElementById('statusFilter').value;
        const courtType = document.getElementById('courtTypeFilter').value;
        const date = document.getElementById('dateFilter').value;
        
        let filtered = this.bookings.filter(b => 
            (!status || b.status === status) && 
            (!courtType || b.court_type === courtType) && 
            (!date || b.date === date)
        );
        
        const tableContainer = document.getElementById('bookingsTable');
        if (filtered.length === 0) {
            tableContainer.innerHTML = '<p class="text-gray-500 text-center py-8">No bookings found.</p>';
            return;
        }

        const tableHTML = `
            <div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50"><tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Details</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr></thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${filtered.map(b => this.createBookingRow(b)).join('')}
                </tbody>
            </table></div>`;
        tableContainer.innerHTML = tableHTML;
    }

    createBookingRow(booking) {
        const statusColors = {'Booked': 'bg-blue-100 text-blue-800', 'Completed': 'bg-green-100 text-green-800', 'Cancelled': 'bg-red-100 text-red-800'};
        const actions = booking.status === 'Booked' ? `
            <button onclick="adminPanel.updateBookingStatus('${booking.id}', 'Completed')" class="text-green-600 hover:text-green-900"><i class="fas fa-check"></i> Complete</button>
            <button onclick="adminPanel.updateBookingStatus('${booking.id}', 'Cancelled')" class="text-red-600 hover:text-red-900 ml-2"><i class="fas fa-times"></i> Cancel</button>
        ` : '';
        return `<tr>
            <td class="px-6 py-4"><div class="text-sm font-medium">${booking.court_type} Court ${booking.court_number}</div><div class="text-sm text-gray-500">${booking.date} | ${booking.start_time} - ${booking.end_time}</div></td>
            <td class="px-6 py-4"><div class="text-sm font-medium">${booking.customer_name}</div><div class="text-sm text-gray-500">${booking.customer_contact}</div></td>
            <td class="px-6 py-4 text-sm">PKR ${booking.amount_paid.toLocaleString()}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColors[booking.status] || ''}">${booking.status}</span></td>
            <td class="px-6 py-4 text-sm font-medium">${actions}</td>
        </tr>`;
    }
    
    async updateBookingStatus(bookingId, newStatus) {
        try {
            const response = await fetch(`tables/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, updated_at: Date.now() })
            });
            if (!response.ok) throw new Error('Failed to update status');
            window.bookingSystem.showNotification(`Booking ${newStatus.toLowerCase()} successfully!`, 'success');
            this.showManageBookings(); // Refresh view
        } catch (error) {
            console.error('Error updating booking status:', error);
            window.bookingSystem.showNotification('Failed to update status.', 'error');
        }
    }
    
    async showMTDWidget() {
        await this.loadInitialData();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const mtdBookings = this.bookings.filter(b => b.date >= startOfMonth && b.status !== 'Cancelled');
        const totalRevenue = mtdBookings.reduce((sum, b) => sum + b.amount_paid, 0);
        const indoorRevenue = mtdBookings.filter(b => b.court_type === 'Indoor').reduce((sum, b) => sum + b.amount_paid, 0);
        
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border p-6">
                <h2 class="text-xl font-semibold mb-4"><i class="fas fa-rupee-sign mr-2 text-purple-600"></i>Month-to-Date Revenue</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white"><p class="text-sm">Total Revenue</p><p class="text-2xl font-bold">PKR ${totalRevenue.toLocaleString()}</p></div>
                    <div class="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg p-6 text-white"><p class="text-sm">Total Bookings</p><p class="text-2xl font-bold">${mtdBookings.length}</p></div>
                    <div class="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg p-6 text-white"><p class="text-sm">Indoor Revenue</p><p class="text-2xl font-bold">PKR ${indoorRevenue.toLocaleString()}</p></div>
                    <div class="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-6 text-white"><p class="text-sm">Outdoor Revenue</p><p class="text-2xl font-bold">PKR ${(totalRevenue - indoorRevenue).toLocaleString()}</p></div>
                </div>
                <div class="bg-gray-50 rounded-lg p-6"><h3 class="text-lg font-semibold mb-4">Daily Revenue Trend</h3><canvas id="dailyRevenueChart"></canvas></div>
            </div>`;
        this.createDailyRevenueChart(mtdBookings);
    }
    
    createDailyRevenueChart(bookings) {
        const ctx = document.getElementById('dailyRevenueChart').getContext('2d');
        const dailyData = bookings.reduce((acc, b) => {
            acc[b.date] = (acc[b.date] || 0) + b.amount_paid;
            return acc;
        }, {});
        new Chart(ctx, {
            type: 'line',
            data: { labels: Object.keys(dailyData), datasets: [{ label: 'Daily Revenue', data: Object.values(dailyData), borderColor: '#3b82f6', tension: 0.1 }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    async showEquipmentManagement() {
        await this.loadInitialData();
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b"><h2 class="text-xl font-semibold"><i class="fas fa-shopping-cart mr-2 text-orange-600"></i>Equipment Management</h2></div>
                <div class="p-6">
                    <button onclick="adminPanel.showItemModal('equipment')" class="bg-green-600 text-white px-4 py-2 rounded-md mb-6"><i class="fas fa-plus mr-2"></i>Add Equipment</button>
                    <div class="overflow-x-auto"><table class="min-w-full divide-y">
                        <thead class="bg-gray-50"><tr>
                            <th class="px-6 py-3 text-left text-xs font-medium uppercase">Name</th><th class="px-6 py-3 text-left text-xs font-medium uppercase">Category</th>
                            <th class="px-6 py-3 text-left text-xs font-medium uppercase">Price</th><th class="px-6 py-3 text-left text-xs font-medium uppercase">Stock</th>
                            <th class="px-6 py-3 text-left text-xs font-medium uppercase">Status</th><th class="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                        </tr></thead>
                        <tbody class="bg-white divide-y">${this.equipment.map(item => `
                            <tr>
                                <td class="px-6 py-4">${item.name}</td><td class="px-6 py-4">${item.category}</td>
                                <td class="px-6 py-4">PKR ${item.price.toLocaleString()}</td><td class="px-6 py-4">${item.stock_quantity}</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${item.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td class="px-6 py-4"><button onclick='adminPanel.showItemModal("equipment", "${item.id}")' class="text-blue-600"><i class="fas fa-edit"></i></button>
                                <button onclick='adminPanel.deleteItem("equipment", "${item.id}")' class="text-red-600 ml-2"><i class="fas fa-trash"></i></button></td>
                            </tr>`).join('')}
                        </tbody>
                    </table></div>
                </div>
            </div>`;
    }

    async showPackagesManagement() {
        await this.loadInitialData();
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b"><h2 class="text-xl font-semibold"><i class="fas fa-gift mr-2 text-indigo-600"></i>Packages Management</h2></div>
                <div class="p-6">
                    <button onclick="adminPanel.showItemModal('packages')" class="bg-green-600 text-white px-4 py-2 rounded-md mb-6"><i class="fas fa-plus mr-2"></i>Add Package</button>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${this.packages.map(pkg => `
                        <div class="bg-gray-50 rounded-lg p-6 border">
                            <h3 class="text-lg font-semibold">${pkg.name}</h3>
                            <p class="text-gray-600 text-sm mb-2">${pkg.description}</p>
                            <div class="text-2xl font-bold text-green-600 mb-4">PKR ${pkg.price.toLocaleString()}</div>
                            <div class="flex space-x-2">
                                <button onclick='adminPanel.showItemModal("packages", "${pkg.id}")' class="bg-blue-600 text-white px-3 py-1 rounded-md text-sm"><i class="fas fa-edit mr-1"></i>Edit</button>
                                <button onclick='adminPanel.deleteItem("packages", "${pkg.id}")' class="bg-red-600 text-white px-3 py-1 rounded-md text-sm"><i class="fas fa-trash mr-1"></i>Delete</button>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>
            </div>`;
    }
    
    showItemModal(type, id = null) {
        const isEdit = !!id;
        const item = isEdit ? this[type].find(i => i.id === id) : {};
        const isEquipment = type === 'equipment';
        const title = `${isEdit ? 'Edit' : 'Add'} ${isEquipment ? 'Equipment' : 'Package'}`;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-semibold mb-4">${title}</h3>
                <form id="itemForm" class="space-y-4">
                    <input type="text" name="name" placeholder="Name" value="${item.name || ''}" class="w-full border rounded px-3 py-2" required>
                    ${isEquipment ? `
                        <input type="text" name="category" placeholder="Category" value="${item.category || ''}" class="w-full border rounded px-3 py-2" required>
                        <input type="number" name="stock_quantity" placeholder="Stock Quantity" value="${item.stock_quantity || ''}" class="w-full border rounded px-3 py-2" required>
                    ` : `
                        <textarea name="description" placeholder="Description" class="w-full border rounded px-3 py-2">${item.description || ''}</textarea>
                        <input type="number" name="duration" placeholder="Duration (minutes)" value="${item.duration || ''}" class="w-full border rounded px-3 py-2">
                        <label class="flex items-center"><input type="checkbox" name="includes_equipment" ${item.includes_equipment ? 'checked' : ''} class="mr-2"> Includes Equipment</label>
                        <label class="flex items-center"><input type="checkbox" name="includes_coaching" ${item.includes_coaching ? 'checked' : ''} class="mr-2"> Includes Coaching</label>
                    `}
                    <input type="number" name="price" placeholder="Price (PKR)" value="${item.price || ''}" class="w-full border rounded px-3 py-2" required step="0.01">
                    <select name="is_active" class="w-full border rounded px-3 py-2">
                        <option value="1" ${item.is_active !== 0 ? 'selected' : ''}>Active</option>
                        <option value="0" ${item.is_active === 0 ? 'selected' : ''}>Inactive</option>
                    </select>
                    <div class="flex space-x-3 pt-4">
                        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-md">Save</button>
                        <button type="button" onclick="this.closest('.fixed').remove()" class="bg-gray-500 text-white px-4 py-2 rounded-md">Cancel</button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(modal);

        modal.querySelector('#itemForm').addEventListener('submit', e => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            // Convert types
            data.price = parseFloat(data.price);
            data.is_active = parseInt(data.is_active);
            if (isEquipment) data.stock_quantity = parseInt(data.stock_quantity);
            else {
                data.duration = data.duration ? parseInt(data.duration) : null;
                data.includes_equipment = !!data.includes_equipment;
                data.includes_coaching = !!data.includes_coaching;
            }
            this.saveItem(type, data, id);
            modal.remove();
        });
    }

    async saveItem(type, data, id) {
        const url = id ? `/api/${type}/${id}` : `/api/${type}`;
        const method = id ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!res.ok) throw new Error(`Failed to save ${type}`);
            window.bookingSystem.showNotification(`${type.slice(0, -1)} saved successfully!`, 'success');
            if (type === 'equipment') this.showEquipmentManagement(); else this.showPackagesManagement();
        } catch (error) {
            console.error(`Error saving ${type}:`, error);
            window.bookingSystem.showNotification(`Failed to save ${type}.`, 'error');
        }
    }

    async deleteItem(type, id) {
        if (!confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
        try {
            const res = await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(`Failed to delete ${type}`);
            window.bookingSystem.showNotification(`${type.slice(0, -1)} deleted successfully!`, 'success');
            if (type === 'equipment') this.showEquipmentManagement(); else this.showPackagesManagement();
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            window.bookingSystem.showNotification(`Failed to delete ${type}.`, 'error');
        }
    }

    showReports() {
        if (window.reportsModule) {
            window.reportsModule.showReports();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Only initialize the full admin panel if the adminPanel element exists
    if (document.getElementById('adminPanel')) {
        window.adminPanel = new AdminPanel();
    }
});