const submittedNumbers = new Set(); // Ensure this is defined outside the event listener

// Handle offer claim
document.getElementById('claim-offer-btn').addEventListener('click', function() {
    const name = document.getElementById('name').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const email = document.getElementById('email').value;
  
    if (!name || !phoneNumber || !email) {
      alert("Please fill in all fields.");
      return;
    }
    console.log(name, phoneNumber, email); // Debugging: Check if form values are captured
    
    // Validate phone number format (e.g., 123-456-7890)
    const phonePattern = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
    if (!phonePattern.test(phoneNumber)) {
      alert("Invalid phone number format. Please use a valid format (e.g., 123-456-7890).");
      return;
    }

    // Check if the phone number was already submitted in this session
    if (submittedNumbers.has(phoneNumber)) {
        alert("This phone number has already been used in this session.");
        return;
    }

    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('phoneNumber', phoneNumber);
    formData.append('email', email);
  
    // Send the form data to the server using Google Apps Script
    fetch('https://script.google.com/macros/s/AKfycbxypsni4hNZ9zBxcp16VfoRnjUnw_kLo8dCx4XDPb0eEwd6rfl9GpgapywVjUFq6RAZ/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })
    .then(response => response.json())
    .then(data => {
      if (data.result === 'success') {
        submittedNumbers.add(phoneNumber); // Add to submitted numbers
        const qrToken = data.token;
        const qr = new QRious({
          element: document.getElementById('qr-code'),
          value: qrToken,
          size: 200
        });
  
        document.getElementById('qr-code-container').style.display = 'block';
        alert('Offer claimed! Please scan the QR code.');
  
      } else {
        // Handle errors (e.g., phone number already claimed or in pending status)
        alert(data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred. Please try again. Error details: ' + error.message);

    });
  });




// Timer functionality
async function fetchRemainingTime(timerUrl) {
    try {
        const response = await fetch(timerUrl);
        const data = await response.json();
        if (data.success) {
            const timeLeft = data.timeLeft; // Time left in milliseconds
            displayTimer(timeLeft);
        } else {
            console.error("Error:", data.message);
            document.getElementById("timer").textContent = "Offer expired.";
        }
    } catch (error) {
        console.error("Error fetching timer:", error);
    }
}

function displayTimer(milliseconds) {
    const timerElement = document.getElementById("timer");

    const interval = setInterval(() => {
        if (milliseconds <= 0) {
            clearInterval(interval);
            timerElement.textContent = "Offer expired.";
            return;
        }

        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        timerElement.textContent = `${hours}h ${minutes}m ${seconds}s`;

        milliseconds -= 1000;
    }, 1000);
}

// Extract the timer URL from the query parameter
const urlParams = new URLSearchParams(window.location.search);
const timerUrl = urlParams.get("timerUrl");

// Fetch the timer data if the URL is present
if (timerUrl) {
    fetchRemainingTime(timerUrl);
}
