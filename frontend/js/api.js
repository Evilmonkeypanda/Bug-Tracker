// Single file for all API functions


const API_BASE = 'http://localhost:300/api';

const API = {
    async request(endpoint, options = {}) {
        const token = Auth.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && {'Authorization': 'Bearer ${token}'})
            },
            ...options
        };
        const response = await fetch('${API_BASE}${endpoint}', config);
        const data = await response.json();

        if (!response.ok){
            throw new Error(data.error || 'Request failed');
        }
        return data;
    },

    // Endpoints
    //           Auth
    async login(username, password){
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({username, password, role})
        });
    },

    //           Bugs
    async getMyBugs() {
        return this.request('/bugs/mine');
    },

    async getPendingBugs() {
        return this.request('/bugs/pending');
    },

    async getActiveBugs() {
        return this.request('/bugs/active');
    },

    async getBugById(id) {
        return this.request('/bugs/${id}');
    },

    async createBug(bugData) {
        return this.request('/bugs', {
            method: 'POST',
            body: JSON.stringify(bugData)
        });
    },

    async reviewBug(id, decision, denial_reason = null) {
        return this.request('/bugs/${id}/review', {
            method: 'PATCH',
            body: JSON.stringify({decision, denial_reason})
        });
    },

    async squashBug(id){
        return this.request('/bugs/${id}/squash', {
            method:'PATCH'
        });
    },
    async addNote(Id, content) {
        return this.request('/bugs/${Id}/notes',{
            method: 'POST',
            body: JSON.stringify({ content})
        });
    }
};