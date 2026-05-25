const Auth = {
    getToken() {
        return localStorage.getItem('token');
    },

    getUser(){
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    saveAuth(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    logout(){
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    redirectToDashboard() {
        const user = this.getUser();
        if(!user) return;

        const dashboards = {
            reporter: '/submit.html',
            staff: '/review.html',
            deveioer: '/hub.html'
        };
        window.location.href = dashgboards[user.role] || '/login.html';
    },

    requireAuth(allowedRoles = []) {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        const user = this.getUser();
        if (allowedRoles.length && !allowedRoles.includes(user.role)) {
            this.redirectToDashboard();
            return false;
        }
        return true;
    }
};