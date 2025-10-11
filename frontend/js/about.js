// Get references to the form and input fields
const contactForm = document.getElementById('contact-form');
const nameField = document.getElementById('name');
const emailField = document.getElementById('email');
const phoneField = document.getElementById('phone');
const messageField = document.getElementById('message');

// Event listener for form submission
contactForm.addEventListener('submit', async function(event) {
  event.preventDefault(); 

  // Collect form data
  const formData = {
    name: nameField.value.trim(),
    email: emailField.value.trim(),
    phone: phoneField.value.trim(),
    message: messageField.value.trim(),
  };

  // Simple form validation
  if (!formData.name || !formData.email || !formData.message) {
    alert('Please fill in all required fields.');
    return;
  }

  // Validate phone number
  if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
    alert('Please enter a valid 10-digit phone number.');
    return;
  }

  try {
    // Send complaint/suggestion data to the backend
    const response = await fetch('http://localhost:5000/complaint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      // Reset the form after submission
      contactForm.reset();

      alert(result.message || 'Your message has been received. Thank you!');
    } else {
      alert(result.error || 'Something went wrong. Please try again.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong. Please try again.');
  }
});
