// Main JavaScript for GlobalVest Platform

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    document.getElementById("year").textContent = new Date().getFullYear();
    // Check if user is logged in
    //const token = localStorage.getItem('token');
   // if (token && window.location.pathname.includes('index.html')) {
       // window.location.href = 'dashboard.html';
   // }
});