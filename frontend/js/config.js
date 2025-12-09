/**
 * PlantasticCare - API Configuration
 * Centralized configuration for all API calls
 */

const API_CONFIG = {
    // Automatically detect environment
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : window.location.origin,

    // Token storage key
    TOKEN_KEY: 'plantastic_token',
    USER_KEY: 'plantastic_user',

    // Get authorization header
    getAuthHeader() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    // Get full headers for JSON requests
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (includeAuth) {
            const authHeader = this.getAuthHeader();
            if (authHeader.Authorization) {
                headers.Authorization = authHeader.Authorization;
            }
        }
        return headers;
    },

    // Save auth data after login
    saveAuth(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        if (user) {
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        }
    },

    // Clear auth data (logout)
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },

    // Check if user is logged in
    isLoggedIn() {
        return !!localStorage.getItem(this.TOKEN_KEY);
    },

    // Get current user
    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },

    // API request helper with error handling
    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: this.getHeaders(options.auth !== false)
        };

        const finalOptions = { ...defaultOptions, ...options };
        if (options.body && typeof options.body === 'object') {
            finalOptions.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();

            if (!response.ok) {
                // Handle token expiration
                if (response.status === 401) {
                    this.clearAuth();
                    if (!window.location.pathname.includes('login')) {
                        window.location.href = 'login.html';
                    }
                }
                throw new Error(data.error || data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
};

/**
 * HTML Sanitization - Prevent XSS attacks
 */
const sanitize = {
    // Escape HTML entities
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Create safe text node
    createTextNode(text) {
        return document.createTextNode(text || '');
    }
};

/**
 * Toast Notifications - Better UX than alerts
 */
const Toast = {
    container: null,

    init() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(this.container);
    },

    show(message, type = 'info', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            max-width: 350px;
            word-wrap: break-word;
        `;

        // Set background color based on type
        const colors = {
            success: '#2a7a44',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        toast.style.backgroundColor = colors[type] || colors.info;
        if (type === 'warning') toast.style.color = '#333';

        toast.textContent = message;
        this.container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

// Add toast animations
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(toastStyles);

/**
 * Loading Spinner
 */
const Loading = {
    overlay: null,

    show(message = 'Loading...') {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.8);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #2a7a44;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <p style="margin-top: 15px; color: #2a472e; font-weight: 500;">${message}</p>
            </div>
        `;
        document.body.appendChild(this.overlay);
    },

    hide() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
};

// Add loading animation
const loadingStyles = document.createElement('style');
loadingStyles.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(loadingStyles);

// Export for ES modules (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, sanitize, Toast, Loading };
}
