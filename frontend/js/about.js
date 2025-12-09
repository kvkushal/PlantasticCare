/**
 * PlantasticCare - About Page JavaScript
 * Contact form handling with improved validation and UX
 */

document.addEventListener("DOMContentLoaded", function () {
  // Get references to the form and input fields
  const contactForm = document.getElementById('contact-form');
  const nameField = document.getElementById('name');
  const emailField = document.getElementById('email');
  const phoneField = document.getElementById('phone');
  const messageField = document.getElementById('message');

  if (!contactForm) return;

  // Event listener for form submission
  contactForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // Collect form data
    const formData = {
      name: nameField.value.trim(),
      email: emailField.value.trim(),
      phone: phoneField.value.trim(),
      message: messageField.value.trim(),
    };

    // Validation
    if (!formData.name) {
      Toast.warning('Please enter your name.');
      nameField.focus();
      return;
    }

    if (!formData.email) {
      Toast.warning('Please enter your email address.');
      emailField.focus();
      return;
    }

    if (!isValidEmail(formData.email)) {
      Toast.warning('Please enter a valid email address.');
      emailField.focus();
      return;
    }

    if (!formData.message) {
      Toast.warning('Please enter your message.');
      messageField.focus();
      return;
    }

    // Validate phone number if provided
    if (formData.phone && !isValidPhone(formData.phone)) {
      Toast.warning('Please enter a valid 10-digit phone number.');
      phoneField.focus();
      return;
    }

    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const result = await API_CONFIG.request('/complaint', {
        method: 'POST',
        body: formData,
        auth: false
      });

      Toast.success(result.message || 'Your message has been received. Thank you!');
      contactForm.reset();
    } catch (error) {
      Toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Validation helpers
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    return /^\d{10}$/.test(phone);
  }
});
