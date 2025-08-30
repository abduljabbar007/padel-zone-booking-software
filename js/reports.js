// Advanced Reporting Suite
class ReportsModule {
    constructor() {
        this.bookings = [];
        this.sales = [];
        this.charts = {};
    }
    
    async loadData() {
        try {
            const [bookingsRes, salesRes] = await Promise.all([
                fetch('tables/bookings'),
                fetch('api/sales-report?startDate=1970-01-01&endDate=2999-12-31') // Fetch all sales initially
            ]);
            this.bookings = (await bookingsRes.json()).data || [];
            this.sales = (await salesRes.json()).data || [];
        } catch (error) {
            console.error('Error loading report data:', error);
            window.bookingSystem.showNotification('Could not load report data.', 'error');
        }
    }
    
    async showReports() {
        await this.loadData();
        const content = document.getElementById('adminContent');
        content.innerHTML = `
            <div class="space-y-6">
                <div class="bg-white rounded-lg shadow-sm border p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4"><i class="fas fa-chart-bar mr-2 text-green-600"></i>Advanced Reports</h2>
                    <div class="flex flex-wrap gap-2">
                        <button id="dateRangeReportBtn" class="px-4 py-2 bg-blue-600 text-white rounded-md">Date Range Report</button>
                        <button id="dayEndReportBtn" class="px-4 py-2 bg-green-600 text-white rounded-md">Day-End Report</button>
                        <button id="futureBookingsBtn" class="px-4 py-2 bg-purple-600 text-white rounded-md">Future Bookings</button>
                    </div>
                </div>
                <div id="reportContent">
                    <div class="bg-white rounded-lg shadow-sm border p-8 text-center">
                        <i class="fas fa-chart-line text-6xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">Select a report type to view detailed analytics</p>
                    </div>
                </div>
            </div>`;
        
        document.getElementById('dateRangeReportBtn').addEventListener('click', () => this.showDateRangeReport());
        document.getElementById('dayEndReportBtn').addEventListener('click', () => this.showDayEndReport());
        document.getElementById('futureBookingsBtn').addEventListener('click', () => this.showFutureBookings());
    }
    
    showDateRangeReport() {
        const reportContent = document.getElementById('reportContent');
        const today = new Date().toISOString().split('T')[0];
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        
        reportContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b"><h3 class="text-lg font-semibold"><i class="fas fa-calendar-alt mr-2 text-blue-600"></i>Date Range Report</h3></div>
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <input type="date" id="startDate" value="${firstDayOfMonth}" class="w-full border rounded-md px-3 py-2">
                        <input type="date" id="endDate" value="${today}" class="w-full border rounded-md px-3 py-2">
                        <button id="generateReport" class="w-full px-4 py-2 bg-blue-600 text-white rounded-md"><i class="fas fa-search mr-2"></i>Generate</button>
                    </div>
                    <div id="dateRangeResults"></div>
                </div>
            </div>`;
        
        document.getElementById('generateReport').addEventListener('click', () => this.generateDateRangeReport());
        this.generateDateRangeReport(); // Initial run
    }
    
    generateDateRangeReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (!startDate || !endDate || startDate > endDate) return;

        const filteredBookings = this.bookings.filter(b => b.date >= startDate && b.date <= endDate);
        const filteredSales = this.sales.filter(s => s.sale_date >= startDate && s.sale_date <= endDate);

        const completedBookings = filteredBookings.filter(b => b.status !== 'Cancelled');
        const courtRevenue = completedBookings.reduce((sum, b) => sum + b.amount_paid, 0);
        const indoorRevenue = completedBookings.filter(b => b.court_type === 'Indoor').reduce((sum, b) => sum + b.amount_paid, 0);
        const outdoorRevenue = courtRevenue - indoorRevenue;

        const equipmentRevenue = filteredSales.filter(s => s.item_type === 'equipment').reduce((sum, s) => sum + s.total_amount, 0);
        const packagesRevenue = filteredSales.filter(s => s.item_type === 'package').reduce((sum, s) => sum + s.total_amount, 0);
        const totalRevenue = courtRevenue + equipmentRevenue + packagesRevenue;

        const results = document.getElementById('dateRangeResults');
        results.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white rounded-lg"><p class="text-sm">Total Revenue</p><p class="text-2xl font-bold">PKR ${totalRevenue.toLocaleString()}</p></div>
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white rounded-lg"><p class="text-sm">Court Revenue</p><p class="text-2xl font-bold">PKR ${courtRevenue.toLocaleString()}</p></div>
                    <div class="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white rounded-lg"><p class="text-sm">Equipment Revenue</p><p class="text-2xl font-bold">PKR ${equipmentRevenue.toLocaleString()}</p></div>
                    <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white rounded-lg"><p class="text-sm">Packages Revenue</p><p class="text-2xl font-bold">PKR ${packagesRevenue.toLocaleString()}</p></div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-gray-50 p-4 rounded-lg"><h4 class="font-semibold mb-2">Revenue Sources</h4><canvas id="revenueSourcesChart"></canvas></div>
                    <div class="bg-gray-50 p-4 rounded-lg"><h4 class="font-semibold mb-2">Court Revenue Breakdown</h4><canvas id="courtTypeChart"></canvas></div>
                </div>
                <div><h4 class="font-semibold text-lg mb-2">Detailed Sales & Bookings</h4>
                    ${this.createSalesTable(filteredSales, 'All Sales')}
                    ${this.createBookingsTable(completedBookings, 'Court Bookings')}
                </div>
            </div>`;
        
        this.createChart('revenueSourcesChart', 'doughnut', ['Courts', 'Equipment', 'Packages'], [courtRevenue, equipmentRevenue, packagesRevenue], ['#3b82f6', '#a855f7', '#f97316']);
        this.createChart('courtTypeChart', 'pie', ['Indoor', 'Outdoor'], [indoorRevenue, outdoorRevenue], ['#6366f1', '#f59e0b']);
    }

    createSalesTable(sales, title) {
        if (sales.length === 0) return `<h5 class="font-medium mt-4">${title}</h5><p class="text-gray-500">No data for this period.</p>`;
        return `<h5 class="font-medium mt-4">${title} (${sales.length})</h5><div class="overflow-x-auto"><table class="min-w-full divide-y">
            <thead class="bg-gray-50"><tr>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase">Date</th><th class="px-4 py-2 text-left text-xs font-medium uppercase">Item</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase">Customer</th><th class="px-4 py-2 text-left text-xs font-medium uppercase">Amount</th>
            </tr></thead>
            <tbody class="bg-white divide-y">${sales.map(s => `
                <tr><td class="px-4 py-2">${s.sale_date}</td><td class="px-4 py-2">${s.item_name}</td>
                <td class="px-4 py-2">${s.customer_name || 'N/A'}</td><td class="px-4 py-2">PKR ${s.total_amount.toLocaleString()}</td></tr>`).join('')}
            </tbody></table></div>`;
    }

    createBookingsTable(bookings, title) {
        if (bookings.length === 0) return `<h5 class="font-medium mt-4">${title}</h5><p class="text-gray-500">No data for this period.</p>`;
        return `<h5 class="font-medium mt-4">${title} (${bookings.length})</h5><div class="overflow-x-auto"><table class="min-w-full divide-y">
            <thead class="bg-gray-50"><tr>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase">Date</th><th class="px-4 py-2 text-left text-xs font-medium uppercase">Court</th>
                <th class="px-4 py-2 text-left text-xs font-medium uppercase">Customer</th><th class="px-4 py-2 text-left text-xs font-medium uppercase">Amount</th>
            </tr></thead>
            <tbody class="bg-white divide-y">${bookings.map(b => `
                <tr><td class="px-4 py-2">${b.date}</td><td class="px-4 py-2">${b.court_type} ${b.court_number}</td>
                <td class="px-4 py-2">${b.customer_name}</td><td class="px-4 py-2">PKR ${b.amount_paid.toLocaleString()}</td></tr>`).join('')}
            </tbody></table></div>`;
    }

    createChart(canvasId, type, labels, data, colors) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        if (this.charts[canvasId]) this.charts[canvasId].destroy();
        this.charts[canvasId] = new Chart(ctx, {
            type,
            data: { labels, datasets: [{ data, backgroundColor: colors }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    showDayEndReport() {
        // This can be a simplified version of the date range report for today
        const reportContent = document.getElementById('reportContent');
        const today = new Date().toISOString().split('T')[0];
        reportContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b"><h3 class="text-lg font-semibold"><i class="fas fa-calendar-day mr-2 text-green-600"></i>Day-End Report</h3></div>
                <div class="p-6">
                    <input type="hidden" id="startDate" value="${today}">
                    <input type="hidden" id="endDate" value="${today}">
                    <div id="dateRangeResults">Generating today's report...</div>
                </div>
            </div>`;
        this.generateDateRangeReport();
    }
    
    showFutureBookings() {
        const today = new Date().toISOString().split('T')[0];
        const futureBookings = this.bookings.filter(b => b.date > today && b.status !== 'Cancelled').sort((a,b) => new Date(a.date) - new Date(b.date));
        const reportContent = document.getElementById('reportContent');
        reportContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="p-6 border-b"><h3 class="text-lg font-semibold"><i class="fas fa-clock mr-2 text-purple-600"></i>Future Bookings (${futureBookings.length})</h3></div>
                <div class="p-6">${this.createBookingsTable(futureBookings, '')}</div>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reportsModule = new ReportsModule();
});
