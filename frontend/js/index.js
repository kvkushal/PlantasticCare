document.addEventListener("DOMContentLoaded", function () {
    // Newsletter Form Validation
    const newsletterForm = document.querySelector("#subscribeForm");
    const emailInput = document.querySelector("[name='email']");

    newsletterForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailValue = emailInput.value.trim();

        // Regular expression for validating email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate email
        if (emailValue === "") {
            alert("Please enter your email address to subscribe to the newsletter.");
        } else if (!emailRegex.test(emailValue)) {
            alert("Please enter a valid email address.");
        } else {
            // Send email to backend for storage
            try {
                const response = await fetch("http://localhost:5000/newsletter/subscribe", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: emailValue }),
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    emailInput.value = "";
                } else {
                    alert(data.error || "An error occurred. Please try again.");
                }
            } catch (error) {
                console.error("Error subscribing to newsletter:", error);
                alert("An error occurred. Please check your connection and try again.");
            }
        }
    });
});
