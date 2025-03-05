/**
 * Database module for handling localStorage operations
 */
const db = {
    // Storage keys
    KEYS: {
        WORKERS: 'workers',
        TEAMS: 'teams',
        CONTAINERS: 'containers'
    },

    /**
     * Generate a unique ID
     * @returns {string} Unique identifier
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     * @returns {boolean} Success status
     */
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    },

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @returns {any} Stored data or null if not found
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting data:', error);
            return null;
        }
    },

    // Workers operations
    workers: {
        /**
         * Get all workers
         * @returns {Array} Array of workers
         */
        getAll() {
            return db.get(db.KEYS.WORKERS) || [];
        },

        /**
         * Add a new worker
         * @param {Object} worker - Worker data
         * @returns {Object|null} Added worker or null if failed
         */
        add(worker) {
            try {
                const workers = this.getAll();
                const newWorker = {
                    id: db.generateId(),
                    name: worker.name,
                    active: true,
                    createdAt: new Date().toISOString()
                };
                workers.push(newWorker);
                if (db.save(db.KEYS.WORKERS, workers)) {
                    return newWorker;
                }
                return null;
            } catch (error) {
                console.error('Error adding worker:', error);
                return null;
            }
        },

        /**
         * Update a worker
         * @param {string} id - Worker ID
         * @param {Object} data - Updated worker data
         * @returns {boolean} Success status
         */
        update(id, data) {
            try {
                const workers = this.getAll();
                const index = workers.findIndex(w => w.id === id);
                if (index !== -1) {
                    workers[index] = { ...workers[index], ...data };
                    return db.save(db.KEYS.WORKERS, workers);
                }
                return false;
            } catch (error) {
                console.error('Error updating worker:', error);
                return false;
            }
        },

        /**
         * Delete a worker
         * @param {string} id - Worker ID
         * @returns {boolean} Success status
         */
        delete(id) {
            try {
                const workers = this.getAll();
                const filtered = workers.filter(w => w.id !== id);
                return db.save(db.KEYS.WORKERS, filtered);
            } catch (error) {
                console.error('Error deleting worker:', error);
                return false;
            }
        }
    },

    // Teams operations
    teams: {
        /**
         * Get all teams
         * @returns {Array} Array of teams
         */
        getAll() {
            return db.get(db.KEYS.TEAMS) || [];
        },

        /**
         * Get teams for a specific date
         * @param {string} date - Date in ISO format
         * @returns {Array} Array of teams for the date
         */
        getByDate(date) {
            const teams = this.getAll();
            return teams.filter(team => team.date === date);
        },

        /**
         * Add a new team
         * @param {Object} team - Team data
         * @returns {Object|null} Added team or null if failed
         */
        add(team) {
            try {
                const teams = this.getAll();
                const newTeam = {
                    id: db.generateId(),
                    date: team.date,
                    workers: team.workers,
                    createdAt: new Date().toISOString()
                };
                teams.push(newTeam);
                if (db.save(db.KEYS.TEAMS, teams)) {
                    return newTeam;
                }
                return null;
            } catch (error) {
                console.error('Error adding team:', error);
                return null;
            }
        },

        /**
         * Delete a team
         * @param {string} id - Team ID
         * @returns {boolean} Success status
         */
        delete(id) {
            try {
                const teams = this.getAll();
                const filtered = teams.filter(t => t.id !== id);
                return db.save(db.KEYS.TEAMS, filtered);
            } catch (error) {
                console.error('Error deleting team:', error);
                return false;
            }
        }
    },

    // Containers operations
    containers: {
        /**
         * Get all containers
         * @returns {Array} Array of containers
         */
        getAll() {
            return db.get(db.KEYS.CONTAINERS) || [];
        },

        /**
         * Calculate payment for package count
         * @param {number} packageCount - Number of packages
         * @returns {number} Payment amount in EUR
         */
        calculatePayment(packageCount) {
            if (packageCount < 1000) return 60;
            if (packageCount < 2000) return 85;
            if (packageCount < 3000) return 100;
            
            // For 3000+ packages
            const additionalThousands = Math.floor((packageCount - 3000) / 1000);
            return 100 + (additionalThousands * 25);
        },

        /**
         * Add a new container record
         * @param {Object} container - Container data
         * @returns {Object|null} Added container or null if failed
         */
        add(container) {
            try {
                const containers = this.getAll();
                const payment = this.calculatePayment(container.packageCount);
                const newContainer = {
                    id: db.generateId(),
                    date: container.date,
                    teamId: container.teamId,
                    packageCount: container.packageCount,
                    payment: payment,
                    paymentPerWorker: payment / 2, // Split between 2 workers
                    createdAt: new Date().toISOString()
                };
                containers.push(newContainer);
                if (db.save(db.KEYS.CONTAINERS, containers)) {
                    return newContainer;
                }
                return null;
            } catch (error) {
                console.error('Error adding container:', error);
                return null;
            }
        },

        /**
         * Get containers for a worker
         * @param {string} workerId - Worker ID
         * @returns {Array} Array of containers for the worker
         */
        getByWorker(workerId) {
            const containers = this.getAll();
            const teams = db.teams.getAll();
            return containers.filter(container => {
                const team = teams.find(t => t.id === container.teamId);
                return team && team.workers.includes(workerId);
            });
        },

        /**
         * Get containers for a date range
         * @param {string} startDate - Start date in ISO format
         * @param {string} endDate - End date in ISO format
         * @returns {Array} Array of containers in the date range
         */
        getByDateRange(startDate, endDate) {
            const containers = this.getAll();
            return containers.filter(container => 
                container.date >= startDate && container.date <= endDate
            );
        }
    }
};
