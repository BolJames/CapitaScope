// Admin Dashboard JavaScript

const API_BASE = (() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal
        ? 'http://localhost:5000/api'
        : 'https://capitascope.onrender.com/api';
})();

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(event) {
            event.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // Load dashboard data
    loadAnalytics();
    loadUsers();
    loadStartups();
    loadInvestors();
    loadMeetingRequests();
});

async function loadAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/admin/analytics`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const data = await response.json();
            document.getElementById('analyticsContent').innerHTML = `
                <div class="analytics-grid">
                    <div class="metric">
                        <h3>Total Users</h3>
                        <p>${data.totalUsers}</p>
                    </div>
                    <div class="metric">
                        <h3>Total Startups</h3>
                        <p>${data.totalStartups}</p>
                    </div>
                    <div class="metric">
                        <h3>Total Investors</h3>
                        <p>${data.totalInvestors}</p>
                    </div>
                    <div class="metric">
                        <h3>Total Meetings</h3>
                        <p>${data.totalMeetings}</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const users = await response.json();
            const content = users.map(user => `
                <div class="user-card">
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                    <p><strong>Status:</strong> ${user.is_active ? 'Active' : 'Inactive'}</p>
                    <p><strong>Created:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                    <button onclick="toggleUserStatus(${user.id}, ${!user.is_active})">
                        ${user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            `).join('');
            document.getElementById('usersContent').innerHTML = content;
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function toggleUserStatus(userId, isActive) {
    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ is_active: isActive })
        });
        if (response.ok) {
            loadUsers(); // Reload users
        }
    } catch (error) {
        console.error('Error updating user status:', error);
    }
}

async function loadStartups() {
    try {
        const response = await fetch(`${API_BASE}/admin/startups`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const startups = await response.json();
            const content = startups.map(startup => `
                <div class="startup-card">
                    <h4>${startup.name}</h4>
                    <p><strong>Description:</strong> ${startup.description || 'N/A'}</p>
                    <p><strong>Industry:</strong> ${startup.industry || 'N/A'}</p>
                    <p><strong>Funding Needed:</strong> $${startup.funding_needed || 'N/A'}</p>
                    <p><strong>Location:</strong> ${startup.location || 'N/A'}</p>
                    <p><strong>Website:</strong> ${startup.website ? `<a href="${startup.website}" target="_blank">${startup.website}</a>` : 'N/A'}</p>
                </div>
            `).join('');
            document.getElementById('startupsContent').innerHTML = content;
        }
    } catch (error) {
        console.error('Error loading startups:', error);
    }
}

async function loadInvestors() {
    try {
        const response = await fetch(`${API_BASE}/admin/investors`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const investors = await response.json();
            const content = investors.map(investor => `
                <div class="investor-card">
                    <h4>${investor.name}</h4>
                    <p><strong>Interests:</strong> ${investor.interests || 'N/A'}</p>
                    <p><strong>Budget:</strong> $${investor.budget || 'N/A'}</p>
                    <p><strong>Industries:</strong> ${investor.industries || 'N/A'}</p>
                    <p><strong>Location:</strong> ${investor.location || 'N/A'}</p>
                </div>
            `).join('');
            document.getElementById('investorsContent').innerHTML = content;
        }
    } catch (error) {
        console.error('Error loading investors:', error);
    }
}

async function loadMeetingRequests() {
    try {
        const response = await fetch(`${API_BASE}/meeting-requests`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const requests = await response.json();
            const content = requests.map(request => `
                <div class="request-card">
                    <h4>${request.startup_name} ↔ ${request.investor_name}</h4>
                    <p><strong>Status:</strong> ${request.status}</p>
                    ${request.message ? `<p><strong>Message:</strong> ${request.message}</p>` : ''}
                    <p><strong>Requested:</strong> ${new Date(request.created_at).toLocaleString()}</p>
                    ${request.status === 'pending' ? `
                        <button onclick="approveRequest(${request.id})">Approve</button>
                        <button onclick="rejectRequest(${request.id})">Reject</button>
                    ` : ''}
                </div>
            `).join('');
            document.getElementById('meetingsContent').innerHTML = content;
        }
    } catch (error) {
        console.error('Error loading meeting requests:', error);
    }
}

async function approveRequest(requestId) {
    // Use a better date input format
    const scheduled_at = prompt('Enter meeting date and time\n(Format: YYYY-MM-DD HH:MM)\nExample: 2026-04-25 14:30');
    if (!scheduled_at) return;

    // Validate format
    const dateRegex = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/;
    if (!dateRegex.test(scheduled_at)) {
        alert('Invalid date format. Please use: YYYY-MM-DD HH:MM\nExample: 2026-04-25 14:30');
        return;
    }

    const meeting_link = prompt('Enter meeting link or location (optional):') || null;
    const notes = prompt('Enter meeting notes (optional):') || null;

    try {
        const response = await fetch(`${API_BASE}/meeting-requests/${requestId}/approve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ scheduled_at, notes, meeting_link })
        });

        if (response.ok) {
            alert('✓ Meeting request approved and scheduled successfully!');
            loadMeetingRequests(); // Refresh requests
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}\n${error.details ? 'Details: ' + error.details : ''}`);
        }
    } catch (error) {
        console.error('Error approving request:', error);
        alert('Failed to approve request. Please check the console for details.');
    }
}

async function rejectRequest(requestId) {
    if (!confirm('Are you sure you want to reject this meeting request?')) return;

    try {
        const response = await fetch(`${API_BASE}/meeting-requests/${requestId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            alert('Meeting request rejected.');
            loadMeetingRequests(); // Refresh requests
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        alert('Failed to reject request. Please try again.');
    }
}