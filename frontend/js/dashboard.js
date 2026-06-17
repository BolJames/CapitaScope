// Dashboard JavaScript

const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token) {
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

    // Load role-specific content
    loadDashboardContent(user.role);
});

async function loadDashboardContent(role) {
    const roleContent = document.getElementById('roleContent');

    switch (role) {
        case 'startup':
            await loadStartupDashboard(roleContent);
            break;
        case 'investor':
            await loadInvestorDashboard(roleContent);
            break;
        case 'admin':
            await loadAdminDashboard(roleContent);
            break;
    }
}

async function loadStartupDashboard(container) {
    container.innerHTML = `
        <div class="dashboard-section">
            <h3>Your Startup Profile</h3>
            <div id="startupProfile"></div>
            <button id="editStartupBtn" class="btn-primary">Edit Profile</button>
        </div>
        <div class="dashboard-section">
            <h3>Scheduled Meetings</h3>
            <div id="meetingsList"></div>
        </div>
        <div class="dashboard-section">
            <h3>Subscription</h3>
            <div id="subscriptionInfo"></div>
            <button id="upgradeBtn" class="btn-primary">Upgrade to Premium</button>
        </div>
    `;

    // Load startup data
    try {
        const response = await fetch(`${API_BASE}/startups/profile`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const startup = await response.json();
            document.getElementById('startupProfile').innerHTML = `
                <p><strong>Name:</strong> ${startup.name}</p>
                <p><strong>Description:</strong> ${startup.description}</p>
                <p><strong>Industry:</strong> ${startup.industry}</p>
                <p><strong>Funding Needed:</strong> $${startup.funding_needed}</p>
                <p><strong>Plan:</strong> ${startup.subscription_plan}</p>
            `;
        } else if (response.status === 404) {
            document.getElementById('startupProfile').innerHTML = `
                <p>You haven't created your startup profile yet.</p>
                <p>Please complete your profile to get started.</p>
            `;
            document.getElementById('editStartupBtn').textContent = 'Create Profile';
        } else {
            throw new Error('Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading startup profile:', error);
        document.getElementById('startupProfile').innerHTML = '<p>Error loading profile. Please try again.</p>';
    }

    // Add event listeners
    document.getElementById('editStartupBtn').addEventListener('click', () => {
        // Implement edit functionality
        alert('Edit functionality to be implemented');
    });

    document.getElementById('upgradeBtn').addEventListener('click', () => {
        window.location.href = 'subscription.html';
    });
}

async function loadInvestorDashboard(container) {
    container.innerHTML = `
        <div class="dashboard-section">
            <h3>Your Investor Profile</h3>
            <div id="investorProfile"></div>
            <button id="editInvestorBtn" class="btn-primary">Edit Profile</button>
        </div>
        <div class="dashboard-section">
            <h3>Browse Startups</h3>
            <div id="startupsList"></div>
            <button id="filterBtn" class="btn-primary">Apply Filters</button>
        </div>
        <div class="dashboard-section">
            <h3>Scheduled Meetings</h3>
            <div id="meetingsList"></div>
        </div>
    `;

    // Load investor data and startups
    // Similar implementation as startup dashboard
}

async function loadAdminDashboard(container) {
    container.innerHTML = `
        <div class="dashboard-section">
            <h3>Platform Analytics</h3>
            <div id="analytics"></div>
        </div>
        <div class="dashboard-section">
            <h3>User Management</h3>
            <div id="usersList"></div>
        </div>
        <div class="dashboard-section">
            <h3>Matchmaking</h3>
            <button id="createMatchBtn" class="btn-primary">Create Match</button>
        </div>
    `;

    // Load admin data
    // Implementation for admin features
}