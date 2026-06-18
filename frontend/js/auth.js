// ================= CONFIG =================
const API_BASE = (() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal
        ? 'http://localhost:5000/api'
        : 'https://capitascope.onrender.com/api';
})();

let allCountries = [];

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
    const countrySearchEl = document.getElementById("countrySearch");
    const countryListEl = document.getElementById("countryList");

    if (countrySearchEl && countryListEl) {
        loadCountries();

        countrySearchEl.addEventListener("input", filterCountries);

        countrySearchEl.addEventListener("focus", () => {
            countryListEl.style.display = "block";
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".country-dropdown")) {
                countryListEl.style.display = "none";
            }
        });
    }

    // Handle register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// ================= LOAD COUNTRIES =================
async function loadCountries() {
    try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,flags");

        if (!res.ok) throw new Error("API failed");

        const data = await res.json();

        if (!Array.isArray(data)) throw new Error("Invalid format");

        allCountries = data.map(c => ({
            name: c.name.common,
            flag: c.flags.png
        })).sort((a, b) => a.name.localeCompare(b.name));

        renderCountries(allCountries);

        autoDetectCountry();

    } catch (err) {
        console.error(err);
        loadFallbackCountries();
    }
}

// ================= RENDER =================
function renderCountries(countries) {
    const list = document.getElementById("countryList");
    if (!list) return;

    list.innerHTML = "";

    countries.forEach(c => {
        const item = document.createElement("div");
        item.className = "dropdown-item";

        item.innerHTML = `
            <img src="${c.flag}" class="flag">
            ${c.name}
        `;

        item.onclick = () => selectCountry(c);

        list.appendChild(item);
    });
}

// ================= SELECT =================
function selectCountry(country) {
    const countrySearchEl = document.getElementById("countrySearch");
    const addressEl = document.getElementById("address");
    const countryListEl = document.getElementById("countryList");

    if (countrySearchEl) countrySearchEl.value = country.name;
    if (addressEl) addressEl.value = country.name;
    if (countryListEl) countryListEl.style.display = "none";
}

// ================= SEARCH =================
function filterCountries(e) {
    const query = e.target.value.toLowerCase();

    const filtered = allCountries.filter(c =>
        c.name.toLowerCase().includes(query)
    );

    renderCountries(filtered);
}

// ================= AUTO DETECT =================
async function autoDetectCountry() {
    try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        const userCountry = data.country_name;

        const found = allCountries.find(c => c.name === userCountry);

        if (found) {
            selectCountry(found);
        }

    } catch (err) {
        console.warn("Auto-detect failed");
    }
}

// ================= FALLBACK =================
function loadFallbackCountries() {
    allCountries = [
        { name: "India", flag: "https://flagcdn.com/w40/in.png" },
        { name: "United States", flag: "https://flagcdn.com/w40/us.png" },
        { name: "United Kingdom", flag: "https://flagcdn.com/w40/gb.png" }
    ];

    renderCountries(allCountries);
}

// ================= REGISTER =================
async function handleRegister(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const address = document.getElementById('address').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            // Registration successful, redirect to login
            alert('Registration successful! Please login with your credentials.');
            window.location.href = 'login.html';
        } else {
            alert(data.error || data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

// ================= LOGIN =================
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.token && data.user) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            const user = data.user;
            if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (user.role === 'startup') {
                window.location.href = 'startup-dashboard.html';
            } else if (user.role === 'investor') {
                window.location.href = 'investor-dashboard.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        } else {
            alert(data.error || data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}
