// Startup Dashboard JavaScript

const API_BASE = (() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal
        ? 'http://localhost:5000/api'
        : 'https://capitascope.onrender.com/api';
})();

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || user.role !== 'startup') {
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

    // Load profile and meetings
    loadProfile();
    loadMeetings();

    // Edit profile modal
    const modal = document.getElementById('editProfileModal');
    const editBtn = document.getElementById('editProfileBtn');
    const closeBtn = document.querySelector('.close');

    editBtn.onclick = function() {
        modal.style.display = 'block';
        populateForm();
        // Update modal title based on button text
        document.querySelector('.modal-content h2').textContent = editBtn.textContent;
    };

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Handle form submission
    document.getElementById('editProfileForm').addEventListener('submit', handleProfileUpdate);
});

async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/startups/profile`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const startup = await response.json();
            document.getElementById('profileContent').innerHTML = `
                <div class="profile-card">
                    <h3>${startup.name}</h3>
                    <p><strong>Description:</strong> ${startup.description || 'Not provided'}</p>
                    <p><strong>Industry:</strong> ${startup.industry || 'Not provided'}</p>
                    <p><strong>Funding Needed:</strong> $${startup.funding_needed || 'Not provided'}</p>
                    <p><strong>Location:</strong> ${startup.location || 'Not provided'}</p>
                    <p><strong>Website:</strong> ${startup.website ? `<a href="${startup.website}" target="_blank">${startup.website}</a>` : 'Not provided'}</p>
                </div>
            `;
            document.getElementById('editProfileBtn').textContent = 'Edit Profile';
        } else if (response.status === 404) {
            document.getElementById('profileContent').innerHTML = `
                <p>You haven't created your startup profile yet.</p>
                <p>Please click "Create Profile" to get started.</p>
            `;
            document.getElementById('editProfileBtn').textContent = 'Create Profile';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('profileContent').innerHTML = '<p>Error loading profile. Please try again.</p>';
    }
}

async function loadMeetings() {
    try {
        const response = await fetch(`${API_BASE}/startups/meetings`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const meetings = await response.json();
            if (meetings.length === 0) {
                document.getElementById('meetingsContent').innerHTML = '<p>No meetings scheduled yet.</p>';
            } else {
                const content = meetings.map(meeting => `
                    <div class="meeting-card">
                        <h4>Meeting with ${meeting.investor_name}</h4>
                        <p><strong>Status:</strong> ${meeting.status}</p>
                        <p><strong>Scheduled:</strong> ${meeting.scheduled_at ? new Date(meeting.scheduled_at).toLocaleString() : 'Not scheduled yet'}</p>
                        ${meeting.notes ? `<p><strong>Notes:</strong> ${meeting.notes}</p>` : ''}
                        <p><strong>Requested:</strong> ${new Date(meeting.created_at).toLocaleString()}</p>
                    </div>
                `).join('');
                document.getElementById('meetingsContent').innerHTML = content;
            }
        }
    } catch (error) {
        console.error('Error loading meetings:', error);
    }
}

async function populateForm() {
    try {
        const response = await fetch(`${API_BASE}/startups/profile`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
            const startup = await response.json();
            document.getElementById('name').value = startup.name || '';
            document.getElementById('description').value = startup.description || '';
            document.getElementById('industry').value = startup.industry || '';
            document.getElementById('funding_needed').value = startup.funding_needed || '';
            document.getElementById('location').value = startup.location || '';
            document.getElementById('website').value = startup.website || '';
        }
    } catch (error) {
        console.error('Error populating form:', error);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        industry: document.getElementById('industry').value,
        funding_needed: parseFloat(document.getElementById('funding_needed').value),
        location: document.getElementById('location').value,
        website: document.getElementById('website').value
    };

    try {
        // First try to update (PUT)
        let response = await fetch(`${API_BASE}/startups/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        if (response.status === 404) {
            // Profile doesn't exist, create new (POST)
            response = await fetch(`${API_BASE}/startups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
        }

        if (response.ok) {
            document.getElementById('editProfileModal').style.display = 'none';
            loadProfile(); // Reload profile
            alert('Profile saved successfully!');
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to save profile');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Failed to save profile. Please try again.');
    }
}