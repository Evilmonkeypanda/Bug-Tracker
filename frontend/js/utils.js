// utils.js - Reusable utility functions
const Utils = {
  // Render a status badge
  statusBadge(status) {
    return `<span class="badge badge-${status}">${status}</span>`;
  },
  
  // Format date
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  // Show error message
  showError(message, containerId = 'error-container') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-error">
          ${message}
        </div>
      `;
    }
  },
  
  // Show success message
  showSuccess(message, containerId = 'success-container') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="alert alert-success">
          ${message}
        </div>
      `;
    }
  }
};