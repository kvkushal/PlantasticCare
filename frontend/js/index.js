/**
 * PlantasticCare - Home Page JavaScript
 * Newsletter subscription with improved UX
 */

document.addEventListener("DOMContentLoaded", function () {
    // Newsletter Form Handling
    const newsletterForm = document.querySelector("#subscribeForm");
    const emailInput = document.querySelector("#email");

    if (newsletterForm) {
        newsletterForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const emailValue = emailInput.value.trim();
            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            // Validate email
            if (!emailValue) {
                Toast.warning("Please enter your email address.");
                emailInput.focus();
                return;
            }

            if (!isValidEmail(emailValue)) {
                Toast.warning("Please enter a valid email address.");
                emailInput.focus();
                return;
            }

            // Disable button during request
            submitBtn.disabled = true;
            submitBtn.textContent = "Subscribing...";

            try {
                const data = await API_CONFIG.request('/newsletter/subscribe', {
                    method: 'POST',
                    body: { email: emailValue },
                    auth: false
                });

                Toast.success(data.message || "Thank you for subscribing!");
                emailInput.value = "";
            } catch (error) {
                Toast.error(error.message || "Failed to subscribe. Please try again.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Email validation helper
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Update navigation based on login status
    updateAuthNav();
});

/**
 * Update navigation to show login/logout based on auth status
 */
function updateAuthNav() {
    const navElements = document.querySelectorAll('nav h3 a[href="login.html"]');

    if (API_CONFIG.isLoggedIn()) {
        const user = API_CONFIG.getUser();
        navElements.forEach(el => {
            const parent = el.parentElement;
            parent.innerHTML = `
                <span style="color: #2a472e; margin-right: 10px;">Hi, ${sanitize.escapeHtml(user?.username || 'User')}!</span>
                <a href="#" onclick="handleLogout(event)" style="color: #dc3545;">Logout</a>
            `;
        });
    }
}

/**
 * Global logout handler
 */
function handleLogout(e) {
    if (e) e.preventDefault();
    API_CONFIG.clearAuth();
    Toast.success('Logged out successfully!');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}
