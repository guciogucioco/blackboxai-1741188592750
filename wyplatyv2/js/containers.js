/**
 * Containers and payments management module
 */
const containers = {
    /**
     * Initialize containers module
     */
    init() {
        this.containerForm = document.getElementById('container-form');
        this.historyTable = document.getElementById('history-table').querySelector('tbody');
        this.setupEventListeners();
        this.renderHistory();
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Handle container form submission
        this.containerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddContainer();
        });

        // Handle history filters
        const historyWorker = document.getElementById('history-worker');
        const historyDateFrom = document.getElementById('history-date-from');
        const historyDateTo = document.getElementById('history-date-to');

        [historyWorker, historyDateFrom, historyDateTo].forEach(element => {
            element.addEventListener('change', () => this.filterHistory());
        });

        // Handle container date change
        document.getElementById('container-date').addEventListener('change', (e) => {
            this.updateTeamSelectByDate(e.target.value);
        });
    },

    /**
     * Update team select based on selected date
     * @param {string} date - Selected date
     */
    updateTeamSelectByDate(date) {
        const teamSelect = document.getElementById('team-select');
        const teams = db.teams.getByDate(date);
        
        teamSelect.innerHTML = '<option value="">Wybierz zespół</option>' +
            teams.map(team => `
                <option value="${team.id}">
                    ${this.getWorkerNames(team.workers)}
                </option>
            `).join('');
    },

    /**
     * Handle adding a new container
     */
    handleAddContainer() {
        const date = document.getElementById('container-date').value;
        const teamId = document.getElementById('team-select').value;
        const packageCount = parseInt(document.getElementById('package-count').value);

        if (!date || !teamId || !packageCount) {
            this.showError(null, 'Wszystkie pola są wymagane');
            return;
        }

        if (packageCount <= 0) {
            this.showError(document.getElementById('package-count'), 'Liczba paczek musi być większa od 0');
            return;
        }

        const container = db.containers.add({
            date,
            teamId,
            packageCount
        });

        if (container) {
            this.containerForm.reset();
            this.renderHistory();
            this.showSuccess('Kontener został zarejestrowany');
            
            // Show payment details
            this.showPaymentDetails(container);
        } else {
            this.showError(null, 'Nie udało się zarejestrować kontenera');
        }
    },

    /**
     * Show payment details modal
     * @param {Object} container - Container data
     */
    showPaymentDetails(container) {
        const team = db.teams.getAll().find(t => t.id === container.teamId);
        const workerNames = this.getWorkerNames(team.workers);
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 class="text-lg font-medium mb-4">Podsumowanie wypłaty</h3>
                <div class="space-y-2">
                    <p><strong>Data:</strong> ${this.formatDate(container.date)}</p>
                    <p><strong>Zespół:</strong> ${workerNames}</p>
                    <p><strong>Liczba paczek:</strong> ${container.packageCount}</p>
                    <p><strong>Całkowita wypłata:</strong> ${container.payment} EUR</p>
                    <p><strong>Wypłata na osobę:</strong> ${container.paymentPerWorker} EUR</p>
                </div>
                <button class="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                    Zamknij
                </button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('button').addEventListener('click', () => modal.remove());
    },

    /**
     * Filter history based on selected criteria
     */
    filterHistory() {
        const workerId = document.getElementById('history-worker').value;
        const dateFrom = document.getElementById('history-date-from').value;
        const dateTo = document.getElementById('history-date-to').value;

        let containers = db.containers.getAll();

        if (workerId) {
            containers = db.containers.getByWorker(workerId);
        }

        if (dateFrom && dateTo) {
            containers = containers.filter(container => 
                container.date >= dateFrom && container.date <= dateTo
            );
        }

        this.renderHistory(containers);
    },

    /**
     * Get worker names for display
     * @param {Array} workerIds - Array of worker IDs
     * @returns {string} Formatted worker names
     */
    getWorkerNames(workerIds) {
        const workers = db.workers.getAll();
        return workerIds
            .map(id => workers.find(w => w.id === id)?.name || 'Nieznany pracownik')
            .join(', ');
    },

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    /**
     * Render history table
     * @param {Array} containers - Optional array of containers to display
     */
    renderHistory(containers = null) {
        containers = containers || db.containers.getAll();
        const teams = db.teams.getAll();

        // Sort containers by date (newest first)
        containers.sort((a, b) => b.date.localeCompare(a.date));

        this.historyTable.innerHTML = containers.map(container => {
            const team = teams.find(t => t.id === container.teamId);
            const workerNames = team ? this.getWorkerNames(team.workers) : 'Nieznany zespół';

            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${this.formatDate(container.date)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${workerNames}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${container.packageCount}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">
                            ${container.paymentPerWorker} / os.
                            <span class="text-gray-500">(${container.payment} total)</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Show message if no records found
        if (containers.length === 0) {
            this.historyTable.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                        Brak zapisów w historii
                    </td>
                </tr>
            `;
        }
    },

    /**
     * Show error message
     * @param {HTMLElement} element - Form element
     * @param {string} message - Error message
     */
    showError(element, message) {
        if (element) {
            element.classList.add('error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = message;
            element.parentNode.appendChild(errorDiv);
            setTimeout(() => {
                element.classList.remove('error');
                errorDiv.remove();
            }, 3000);
        } else {
            alert(message);
        }
    },

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }
};
