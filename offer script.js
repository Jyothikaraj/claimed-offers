const submittedNumbers = new Set(); // Ensure this is defined outside the event listener

// Set the offer expiration time (3 hours in milliseconds)
const offerDuration = 3 * 60 * 60 * 1000;
let timer;

async function startOfferTimer(email) {
  try {
    const response = await fetch(`https://your-deployed-script-url/exec?action=getTimestamp&email=${encodeURIComponent(email)}`);
    const result = await response.json();

    if (result.success) {
      const startTime = new Date(result.startTime);
      const now = new Date();
      const offerDuration = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
      const timeElapsed = now - startTime;
      const timeLeft = offerDuration - timeElapsed;

      if (timeLeft <= 0) {
        document.getElementById('offer-form').style.display = 'none';
        document.getElementById('timer').style.display = 'none';
        document.getElementById('offer-expired').style.display = 'block';
      } else {
        let countdown = timeLeft / 1000;

        const timerInterval = setInterval(() => {
          if (countdown <= 0) {
            clearInterval(timerInterval);
            document.getElementById('offer-form').style.display = 'none';
            document.getElementById('timer').style.display = 'none';
            document.getElementById('offer-expired').style.display = 'block';
          } else {
            const hours = Math.floor(countdown / 3600);
            const minutes = Math.floor((countdown % 3600) / 60);
            const seconds = Math.floor(countdown % 60);
            document.getElementById('time-left').textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            countdown--;
          }
        }, 1000);
      }
    } else {
      document.getElementById('timer').innerText = "Could not retrieve offer start time.";
    }
  } catch (error) {
    console.error("Error starting countdown:", error);
    document.getElementById('timer').innerText = "Error loading timer.";
  }
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
    fetch('https://script.google.com/macros/s/AKfycbxz2gnxEq1dYOqQs4UjdQatX4fxh1Ty3NRNoEZsjFVTUFk-Js9wXgO9Izl8MA0VU0Kh/exec', {
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
