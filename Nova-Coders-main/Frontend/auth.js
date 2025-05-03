// Authentication state management
const Auth = {
    // Check if user is authenticated
    isAuthenticated: () => {
        return localStorage.getItem('isAuthenticated') === 'true';
    },

    // Get current user
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Login user
    login: (username, password) => {
        // In a real app, this would make an API call to verify credentials
        // For demo purposes, we'll simulate successful login
        const user = {
            id: 'user123',
            username: username,
            name: username,
            rating: 1500,
            battles: 0,
            wins: 0
        };

        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
        return true;
    },

    // Logout user
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        window.location.href = 'login.html';
    },

    // Protect routes
    protectRoute: () => {
        if (!Auth.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
}; 