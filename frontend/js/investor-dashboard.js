// Investor Dashboard JavaScript

const API_BASE = (() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal
        ? 'http://localhost:5000/api'
        : 'https://capitascope.onrender.com/api';
})();

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || user.role !== 'investor') {
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

    // Load profile, startups, and meetings
    loadProfile();
    loadStartups();
    loadMeetings();
    loadMeetingRequests();
});

async function loadProfile() {
    // For now, just show user info. In future, can have investor profile table
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('profileContent').innerHTML = `
        <div class="profile-card">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
        </div>
    `;
}

async function loadStartups() {
    try {
        const response = await fetch(`${API_BASE}/startups`, {
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
                    <button onclick="requestMeeting(${startup.id})">Request Meeting</button>
                </div>
            `).join('');
            document.getElementById('startupsContent').innerHTML = content;
        }
    } catch (error) {
        console.error('Error loading startups:', error);
    }
}

async function loadMeetings() {
    try {
        const response = await fetch(`${API_BASE}/meetings/investor`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const meetings = await response.json();
            const content = meetings.map(meeting => `
                <div class="meeting-card">
                    <h4>Meeting with ${meeting.startup_name}</h4>
                    <p><strong>Status:</strong> ${meeting.status}</p>
                    <p><strong>Scheduled:</strong> ${meeting.scheduled_at ? new Date(meeting.scheduled_at).toLocaleString() : 'Not scheduled yet'}</p>
                    ${meeting.notes ? `<p><strong>Notes:</strong> ${meeting.notes}</p>` : ''}
                    <p><strong>Requested:</strong> ${new Date(meeting.created_at).toLocaleString()}</p>
                </div>
            `).join('');
            document.getElementById('meetingsContent').innerHTML = content || '<p>No meetings yet.</p>';
        }
    } catch (error) {
        console.error('Error loading meetings:', error);
        document.getElementById('meetingsContent').innerHTML = '<p>Error loading meetings.</p>';
    }
}

async function requestMeeting(startupId) {
    const message = prompt('Enter a message for your meeting request (optional):');

    try {
        const response = await fetch(`${API_BASE}/meeting-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ startup_id: startupId, message })
        });

        if (response.ok) {
            alert('Meeting request sent successfully! The admin will review your request.');
            loadMeetings(); // Refresh meetings
            loadMeetingRequests(); // Refresh requests
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        console.error('Error requesting meeting:', error);
        alert('Failed to request meeting. Please try again.');
    }
}

async function loadMeetingRequests() {
    try {
        const response = await fetch(`${API_BASE}/meeting-requests/investor`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const requests = await response.json();
            const content = requests.map(request => `
                <div class="request-card">
                    <h4>Request to ${request.startup_name}</h4>
                    <p><strong>Status:</strong> ${request.status}</p>
                    ${request.message ? `<p><strong>Message:</strong> ${request.message}</p>` : ''}
                    <p><strong>Requested:</strong> ${new Date(request.created_at).toLocaleString()}</p>
                </div>
            `).join('');
            document.getElementById('requestsContent').innerHTML = content || '<p>No meeting requests yet.</p>';
        }
    } catch (error) {
        console.error('Error loading meeting requests:', error);
        document.getElementById('requestsContent').innerHTML = '<p>Error loading requests.</p>';
    }
}