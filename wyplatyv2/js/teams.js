/**
 * Teams management module
 */
const teams = {
    /**
     * Initialize teams module
     */
    init() {
        this.teamForm = document.getElementById('team-form');
        this.teamsTable = document.getElementById('teams-table').querySelector('tbody');
        this.worker1Select = document.getElementById('worker1');
        this.worker2Select = document.getElementById('worker2');
        this.setupEventListeners();
        this.renderTeams();
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Handle team form submission
        this.teamForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTeam();
        });

        // Handle team actions (delete)
        this.teamsTable.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const teamId = deleteBtn.dataset.teamId;
                this.handleDeleteTeam(teamId);
            }
        });

        // Handle worker selection changes
        this.worker1Select.addEventListener('change', () => this.validateWorkerSelection());
        this.worker2Select.addEventListener('change', () => this.validateWorkerSelection());

        // Handle date changes
        document.getElementById('team-date').addEventListener('change', (e) => {
            this.validateTeamDate(e.target.value);
        });
    },

    /**
     * Validate worker selection
     * @returns {boolean} Validation result
     */
    validateWorkerSelection() {
        const worker1 = this.worker1Select.value;
        const worker2 = this.worker2Select.value;

        if (worker1 && worker2 && worker1 === worker2) {
            this.showError(this.worker2Select, 'Nie można wybrać tego samego pracownika dwa razy');
            return false;
        }

        return true;
    },

    /**
     * Validate team date and workers availability
     * @param {string} date - Selected date
     * @returns {boolean} Validation result
     */
    validateTeamDate(date) {
        if (!date) return false;

        const existingTeams = db.teams.getByDate(date);
        const assignedWorkers = new Set(existingTeams.flatMap(team => team.workers));

        // Update worker selects to disable already assigned workers
        const workers = db.workers.getAll();
        [this.worker1Select, this.worker2Select].forEach(select => {
            Array.from(select.options).forEach(option => {
                if (option.value) {
                    option.disabled = assignedWorkers.has(option.value);
                }
            });
        });

        return true;
    },

    /**
     * Handle adding a new team
     */
    handleAddTeam() {
        const date = document.getElementById('team-date').value;
        const worker1 = this.worker1Select.value;
        const worker2 = this.worker2Select.value;

        if (!date || !worker1 || !worker2) {
            this.showError(null, 'Wszystkie pola są wymagane');
            return;
        }

        if (!this.validateWorkerSelection()) {
            return;
        }

        // Check if workers are already assigned to a team on this date
        const existingTeams = db.teams.getByDate(date);
        const assignedWorkers = new Set(existingTeams.flatMap(team => team.workers));
        
        if (assignedWorkers.has(worker1) || assignedWorkers.has(worker2)) {
            this.showError(null, 'Jeden z pracowników jest już przypisany do zespołu w tym dniu');
            return;
        }

        const team = db.teams.add({
            date,
            workers: [worker1, worker2]
        });

        if (team) {
            this.renderTeams();
            this.teamForm.reset();
            this.showSuccess('Zespół został utworzony');
        } else {
            this.showError(null, 'Nie udało się utworzyć zespołu');
        }
    },

    /**
     * Handle deleting a team
     * @param {string} teamId - Team ID
     */
    handleDeleteTeam(teamId) {
        if (confirm('Czy na pewno chcesz usunąć ten zespół?')) {
            const deleted = db.teams.delete(teamId);
            if (deleted) {
                this.renderTeams();
                this.showSuccess('Zespół został usunięty');
            } else {
                this.showError(null, 'Nie udało się usunąć zespołu');
            }
        }
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
     * Render teams table
     */
    renderTeams() {
        const teams = db.teams.getAll().sort((a, b) => b.date.localeCompare(a.date));
        this.teamsTable.innerHTML = teams.map(team => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.formatDate(team.date)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.getWorkerNames(team.workers)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="btn-action btn-delete" data-team-id="${team.id}">
                        <i class="fas fa-trash-alt mr-1"></i>
                        Usuń
                    </button>
                </td>
            </tr>
        `).join('');

        // Update team select in container form
        this.updateTeamSelect();
    },

    /**
     * Update team select in container form
     */
    updateTeamSelect() {
        const teamSelect = document.getElementById('team-select');
        if (!teamSelect) return;

        const teams = db.teams.getAll();
        const currentValue = teamSelect.value;

        teamSelect.innerHTML = '<option value="">Wybierz zespół</option>' +
            teams.map(team => `
                <option value="${team.id}" ${team.id === currentValue ? 'selected' : ''}>
                    ${this.formatDate(team.date)} - ${this.getWorkerNames(team.workers)}
                </option>
            `).join('');
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
