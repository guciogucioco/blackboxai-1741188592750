/**
 * Main application module
 */
const app = {
    /**
     * Initialize the application
     */
    init() {
        this.setupNavigation();
        this.initializeModules();
    },

    /**
     * Set up navigation functionality
     */
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const sectionId = button.dataset.section;
                
                // Update navigation buttons
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update sections visibility
                sections.forEach(section => {
                    if (section.id === `${sectionId}-section`) {
                        section.classList.remove('hidden');
                        section.classList.add('active');
                    } else {
                        section.classList.add('hidden');
                        section.classList.remove('active');
                    }
                });
            });
        });

        // Mobile menu toggle
        const mobileMenuButton = document.querySelector('.mobile-menu-button');
        const mobileMenu = document.querySelector('.mobile-menu');

        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    },

    /**
     * Initialize all modules
     */
    initializeModules() {
        // Initialize database defaults if needed
        this.initializeDatabase();

        // Initialize modules
        workers.init();
        teams.init();
        containers.init();
    },

    /**
     * Initialize database with default values if empty
     */
    initializeDatabase() {
        // Check if workers exist
        if (!db.workers.getAll().length) {
            localStorage.setItem(db.KEYS.WORKERS, '[]');
        }

        // Check if teams exist
        if (!db.teams.getAll().length) {
            localStorage.setItem(db.KEYS.TEAMS, '[]');
        }

        // Check if containers exist
        if (!db.containers.getAll().length) {
            localStorage.setItem(db.KEYS.CONTAINERS, '[]');
        }
    },

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        app.init();
    } catch (error) {
        console.error('Application initialization failed:', error);
        app.showError('Wystąpił błąd podczas inicjalizacji aplikacji');
    }
});

// Handle global errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    app.showError('Wystąpił nieoczekiwany błąd');
});

// Add mobile responsiveness check
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 640;
    document.body.classList.toggle('is-mobile', isMobile);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + 1-4 for navigation
    if (e.altKey && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        const navButtons = document.querySelectorAll('.nav-btn');
        if (navButtons[index]) {
            navButtons[index].click();
        }
    }
});

// Add offline support notification
window.addEventListener('online', () => {
    app.showError('Połączenie z internetem zostało przywrócone');
});

window.addEventListener('offline', () => {
    app.showError('Brak połączenia z internetem - aplikacja działa w trybie offline');
});

// Add confirmation before leaving page if there are unsaved changes
window.addEventListener('beforeunload', (e) => {
    const forms = document.querySelectorAll('form');
    let hasUnsavedChanges = false;

    forms.forEach(form => {
        if (form.dataset.modified === 'true') {
            hasUnsavedChanges = true;
        }
    });

    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Mark forms as modified when changed
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('input', () => {
        form.dataset.modified = 'true';
    });

    form.addEventListener('submit', () => {
        form.dataset.modified = 'false';
    });
});
