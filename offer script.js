const submittedNumbers = new Set(); // Ensure this is defined outside the event listener

// Set the offer expiration time (3 hours in milliseconds)
const offerDuration = 3 * 60 * 60 * 1000;
let timer;

// Function to fetch the stored timestamp for the timer
function startTimerFromStoredTimestamp(email) {
  fetch('https://script.google.com/macros/s/AKfycbwem84A45Fs3nS7LEjpiCycFGqaW313OjFWnRUDKCdGfT1spYiw-zxFryvBDwzDnTsP/exec?getTimestamp=true&email=' + encodeURIComponent(email), {
    method: 'POST',
      'Content-Type': 'application/x-www-form-urlencoded'
  })
    .then(response => response.json())
    .then(data => {
      if (data.startTime) {
        const startTime = new Date(data.startTime);
        const now = new Date();

        // Calculate the remaining time (3 hours = 10800000 milliseconds)
        const timeRemaining = offerDuration - (now - startTime);

        if (timeRemaining > 0) {
          startCountdown(timeRemaining); // Start countdown with remaining time
        } else {
          alert("The offer has expired.");
          // Hide form and show expired message if the offer has expired
          document.getElementById('offer-form').style.display = 'none';
          document.getElementById('timer').style.display = 'none';
          document.getElementById('offer-expired').style.display = 'block';
        }
      } else {
        console.error('Timestamp not found:', data.error);
      }
    })
    .catch(error => console.error('Error fetching timestamp:', error));
}

// Function to start countdown with the given remaining duration
function startCountdown(duration) {
  let timer = duration / 1000; // Convert to seconds
  const interval = setInterval(() => {
    const hours = Math.floor(timer / 3600);
    const minutes = Math.floor((timer % 3600) / 60);
    const seconds = Math.floor(timer % 60);

    // Update display with remaining time
    document.getElementById('time-left').textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (timer <= 0) {
      clearInterval(interval);
      alert("Offer has expired!");
      // Additional actions for expired offer (e.g., hide QR code or disable buttons)
      document.getElementById('offer-form').style.display = 'none';
      document.getElementById('timer').style.display = 'none';
      document.getElementById('offer-expired').style.display = 'block';
    } else {
      timer--;
    }
  }, 1000);
}

// Handle offer claim
document.getElementById('claim-offer-btn').addEventListener('click', function() {
  const name = document.getElementById('name').value;
  const phoneNumber = document.getElementById('phoneNumber').value;
  const email = document.getElementById('email').value;

  if (!name || !phoneNumber || !email) {
    alert("Please fill in all fields.");
    return;
  }

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
  fetch('https://script.google.com/macros/s/AKfycbyHuJAskzzuDIol5plbpJpodjNBYvppRVeMPqhA2n0FrI-bGLqWE3ZMvRuvqWhBgnTK/exec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
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

      // Start the timer based on the stored timestamp
      startTimerFromStoredTimestamp(email);
      
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
