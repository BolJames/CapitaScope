// Chatbot JavaScript

const API_BASE = (() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal
        ? 'http://localhost:5000/api'
        : 'https://capitascope.onrender.com/api';
})();

document.addEventListener('DOMContentLoaded', function() {
    const chatbotLink = document.getElementById('chatbotLink');
    const chatbotModal = document.getElementById('chatbotModal');
    const closeBtn = document.querySelector('.close');
    const sendBtn = document.getElementById('sendMessage');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    if (chatbotLink) {
        chatbotLink.addEventListener('click', function(e) {
            e.preventDefault();
            chatbotModal.style.display = 'block';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            chatbotModal.style.display = 'none';
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === chatbotModal) {
            chatbotModal.style.display = 'none';
        }
    });
});

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const message = chatInput.value.trim();

    if (!message) return;

    // Add user message
    addMessage('user', message);
    chatInput.value = '';

    try {
        const response = await fetch(`${API_BASE}/chatbot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        if (response.ok) {
            addMessage('bot', data.response);
        } else {
            addMessage('bot', 'Sorry, I encountered an error. Please try again.');
        }
    } catch (error) {
        console.error('Chatbot error:', error);
        addMessage('bot', 'Sorry, I encountered an error. Please try again.');
    }
}

function addMessage(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}