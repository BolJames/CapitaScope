/**
 * STARTUP SUBSCRIPTIONS PAGE
 * Handles subscription management for startups only
 */

const API_BASE = 'http://localhost:5000/api';
let currentCurrency = 'USD';
let billingPeriod = 'monthly';
let plansData = null;

/* ============================================
   🔐 AUTHENTICATION & AUTHORIZATION
============================================ */

function getToken() {
    return localStorage.getItem('token');
}

function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

function isStartupUser() {
    const userType = localStorage.getItem('userType');
    return userType === 'startup';
}

/* ============================================
   📍 INITIALIZATION
============================================ */

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }

    // Verify user is a startup
    if (!isStartupUser()) {
        showMessage('error', '❌ Subscriptions are only available for Startup users.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // Load initial data
    await loadSubscriptionData();

    // Setup event listeners
    setupEventListeners();

    // Update nav link as active
    updateNavigation();
});

function setupEventListeners() {
    // Billing toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            const clickedBtn = e.target.closest('.toggle-btn');
            clickedBtn.classList.add('active');
            billingPeriod = clickedBtn.dataset.billing;
            loadSubscriptionData();
        });
    });

    // Currency selector
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        currencySelect.addEventListener('change', async (e) => {
            currentCurrency = e.target.value;
            await loadSubscriptionData();
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            window.location.href = 'index.html';
        });
    }
}

function updateNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.href.includes('subscriptions.html')) {
            link.classList.add('active');
        }
    });
}

/* ============================================
   📋 FETCH PLANS FROM API
============================================ */

async function loadSubscriptionData() {
    try {
        showMessage('loading', '⏳ Loading subscription plans...');

        // Fetch plans for startup
        const plansResponse = await fetch(
            `${API_BASE}/startups/subscription-plans?currency=${currentCurrency}&billing=${billingPeriod}`
        );

        if (!plansResponse.ok) {
            throw new Error('Failed to fetch plans');
        }

        plansData = await plansResponse.json();

        // Get user's current subscription
        const currentSubscription = await getCurrentSubscription();

        // Render
        renderCurrentSubscription(currentSubscription);
        renderPlans(plansData.plans, currentSubscription);

        showMessage('');
    } catch (err) {
        console.error('Error loading subscription data:', err);
        showMessage('error', '❌ Failed to load subscription plans. Please try again later.');
    }
}

async function getCurrentSubscription() {
    try {
        const response = await fetch(`${API_BASE}/startups/subscriptions`, {
            headers: getHeaders()
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (err) {
        console.error('Error fetching subscription:', err);
        return null;
    }
}

/* ============================================
   🎨 RENDER UI
============================================ */

function renderCurrentSubscription(subscription) {
    const container = document.getElementById('currentSubscriptionContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!subscription || subscription.plan === 'free') {
        container.innerHTML = `
            <div class="free-plan-message">
                <p style="font-size: 1.1rem; margin-bottom: 8px; color: #f1f5f9;">
                    ✨ You're using the <strong>Free Plan</strong>
                </p>
                <p>Upgrade to Pro to unlock unlimited access and advanced features</p>
            </div>
        `;
    } else {
        const endDate = subscription.end_date 
            ? new Date(subscription.end_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })
            : 'Forever';
        
        const renewalDate = subscription.renewal_date
            ? new Date(subscription.renewal_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })
            : 'N/A';

        container.innerHTML = `
            <div class="current-subscription">
                <div class="current-subscription-info">
                    <div class="current-plan-label">
                        <span>✓</span>
                        <span>Active Subscription</span>
                    </div>
                    <h2 class="current-plan-name">${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan</h2>
                    <div class="current-plan-details">
                        <div class="detail-item">
                            <span>💰 Price:</span>
                            <strong>${subscription.currency} ${subscription.price.toFixed(2)}</strong>
                        </div>
                        <div class="detail-item">
                            <span>📅 Expires:</span>
                            <strong>${endDate}</strong>
                        </div>
                        <div class="detail-item">
                            <span>🔄 Renews:</span>
                            <strong>${renewalDate}</strong>
                        </div>
                    </div>
                </div>
                <div class="current-subscription-actions">
                    <button class="btn-cancel" onclick="cancelSubscriptionHandler()">
                        Cancel Plan
                    </button>
                </div>
            </div>
        `;
    }
}

function renderPlans(plans, currentSubscription) {
    const container = document.getElementById('plansContainer');
    if (!container) return;

    container.innerHTML = '';

    plans.forEach((plan, index) => {
        const isActive = currentSubscription && currentSubscription.plan === plan.id;
        const isFree = plan.price === 0 || plan.id === 'free';
        
        const card = document.createElement('div');
        card.className = `plan-card ${isActive ? 'active' : ''}`;
        
        // Determine CTA button style
        let ctaClass = 'plan-cta-secondary';
        let ctaText = isFree ? 'Switch to Free' : 'Subscribe Now';
        
        if (isActive) {
            ctaClass = 'plan-cta-current';
            ctaText = '✓ Current Plan';
        } else if (index === 1) { // Highlight the middle plan (usually recommended)
            ctaClass = 'plan-cta-primary';
        }

        let badgeHtml = '';
        if (plan.badge) {
            badgeHtml = `<div class="plan-badge">${plan.badge}</div>`;
        }

        const priceHtml = isFree 
            ? '<div class="plan-free">Free Forever</div>'
            : `
                <div class="plan-price">
                    <span class="plan-price-currency">${plan.currency}</span>
                    <span>${plan.price.toFixed(0)}</span>
                </div>
                <div class="plan-price-period">per ${billingPeriod === 'annual' ? 'year' : 'month'}</div>
            `;

        card.innerHTML = `
            ${badgeHtml}
            <div class="plan-header">
                <h3 class="plan-name">${plan.name}</h3>
                <p class="plan-description">${plan.description}</p>
            </div>

            <div class="plan-pricing">
                ${priceHtml}
            </div>

            <ul class="plan-features">
                ${plan.features.map(feature => `
                    <li class="plan-feature">
                        <span class="plan-feature-icon">✓</span>
                        <span>${feature}</span>
                    </li>
                `).join('')}
            </ul>

            <button 
                class="plan-cta ${ctaClass}" 
                onclick="${isActive ? 'return false;' : `handleSubscription('${plan.id}')`}"
                ${isActive ? 'disabled' : ''}
            >
                ${ctaText}
            </button>
        `;

        container.appendChild(card);
    });
}

/* ============================================
   🔄 SUBSCRIPTION ACTIONS
============================================ */

async function handleSubscription(planId) {
    try {
        // Get confirmation if upgrading
        if (!confirm('Proceed with subscription?')) return;

        showMessage('loading', '⏳ Processing your subscription...');

        const response = await fetch(`${API_BASE}/startups/subscribe`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                plan: planId,
                currency: currentCurrency,
                billing: billingPeriod
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Subscription failed');
        }

        showMessage('success', '✅ Subscription updated successfully!');
        
        // Reload data after 1.5 seconds
        setTimeout(() => loadSubscriptionData(), 1500);
    } catch (err) {
        console.error('Error:', err);
        showMessage('error', `❌ ${err.message || 'Failed to process subscription'}`);
    }
}

async function cancelSubscriptionHandler() {
    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
        return;
    }

    try {
        showMessage('loading', '⏳ Cancelling your subscription...');

        const response = await fetch(`${API_BASE}/startups/subscriptions`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Cancellation failed');
        }

        showMessage('success', '✅ Subscription cancelled successfully!');
        
        // Reload data after 1.5 seconds
        setTimeout(() => loadSubscriptionData(), 1500);
    } catch (err) {
        console.error('Error:', err);
        showMessage('error', `❌ ${err.message || 'Failed to cancel subscription'}`);
    }
}

/* ============================================
   💬 MESSAGE DISPLAY
============================================ */

function showMessage(type, text) {
    const container = document.getElementById('messageBox');
    
    if (!text) {
        if (container) {
            container.innerHTML = '';
        }
        return;
    }

    if (!container) return;

    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;

    container.appendChild(message);

    // Auto remove after 5 seconds (except loading)
    if (type !== 'loading') {
        setTimeout(() => {
            message.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => message.remove(), 300);
        }, 5000);
    }
}
