/**
 * Workers management module
 */
const workers = {
    /**
     * Initialize workers module
     */
    init() {
        this.workerForm = document.getElementById('worker-form');
        this.workersTable = document.getElementById('workers-table').querySelector('tbody');
        this.setupEventListeners();
        this.renderWorkers();
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Handle worker form submission
        this.workerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddWorker();
        });

        // Handle worker actions (edit/delete)
        this.workersTable.addEventListener('click', (e) => {
            const action = e.target.closest('button');
            if (!action) return;

            const workerId = action.dataset.workerId;
            if (action.classList.contains('btn-edit')) {
                this.handleEditWorker(workerId);
            } else if (action.classList.contains('btn-delete')) {
                this.handleDeleteWorker(workerId);
            }
        });
    },

    /**
     * Handle adding a new worker
     */
    handleAddWorker() {
        const nameInput = document.getElementById('worker-name');
        const name = nameInput.value.trim();

        if (!name) {
            this.showError(nameInput, 'Imię i nazwisko jest wymagane');
            return;
        }

        const worker = db.workers.add({ name });
        if (worker) {
            this.renderWorkers();
            nameInput.value = '';
            this.showSuccess('Pracownik został dodany');
        } else {
            this.showError(nameInput, 'Nie udało się dodać pracownika');
        }
    },

    /**
     * Handle editing a worker
     * @param {string} workerId - Worker ID
     */
    handleEditWorker(workerId) {
        const workers = db.workers.getAll();
        const worker = workers.find(w => w.id === workerId);
        if (!worker) return;

        const newName = prompt('Wprowadź nowe imię i nazwisko:', worker.name);
        if (newName && newName.trim() !== '') {
            const updated = db.workers.update(workerId, { name: newName.trim() });
            if (updated) {
                this.renderWorkers();
                this.showSuccess('Dane pracownika zostały zaktualizowane');
            } else {
                this.showError(null, 'Nie udało się zaktualizować danych pracownika');
            }
        }
    },

    /**
     * Handle deleting a worker
     * @param {string} workerId - Worker ID
     */
    handleDeleteWorker(workerId) {
        if (confirm('Czy na pewno chcesz usunąć tego pracownika?')) {
            const deleted = db.workers.delete(workerId);
            if (deleted) {
                this.renderWorkers();
                this.showSuccess('Pracownik został usunięty');
            } else {
                this.showError(null, 'Nie udało się usunąć pracownika');
            }
        }
    },

    /**
     * Render workers table
     */
    renderWorkers() {
        const workers = db.workers.getAll();
        this.workersTable.innerHTML = workers.map(worker => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${worker.id}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${worker.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-${worker.active ? 'active' : 'inactive'}">
                        ${worker.active ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="btn-action btn-edit mr-2" data-worker-id="${worker.id}">
                        <i class="fas fa-edit mr-1"></i>
                        Edytuj
                    </button>
                    <button class="btn-action btn-delete" data-worker-id="${worker.id}">
                        <i class="fas fa-trash-alt mr-1"></i>
                        Usuń
                    </button>
                </td>
            </tr>
        `).join('');

        // Update worker selects in other forms
        this.updateWorkerSelects();
    },

    /**
     * Update all worker select elements
     */
    updateWorkerSelects() {
        const workers = db.workers.getAll();
        const selects = [
            document.getElementById('worker1'),
            document.getElementById('worker2'),
            document.getElementById('history-worker')
        ];

        selects.forEach(select => {
            if (!select) return;

            const currentValue = select.value;
            select.innerHTML = '<option value="">Wybierz pracownika</option>' +
                workers.map(worker => `
                    <option value="${worker.id}" ${worker.id === currentValue ? 'selected' : ''}>
                        ${worker.name}
                    </option>
                `).join('');
        });
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
