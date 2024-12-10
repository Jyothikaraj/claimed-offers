// Ensure submittedNumbers is defined before using it
const submittedNumbers = new Set(); // Set to track submitted phone numbers

// Declare the offerHidden flag to ensure offer is hidden only once
let offerHidden = false; // Initialize the offerHidden variable

// Handle offer claim
document.getElementById('claim-offer-btn').addEventListener('click', function () {
    const name = document.getElementById('name').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const email = document.getElementById('email').value;

    // Validate form inputs
    if (!name || !phoneNumber || !email) {
        alert("Please fill in all fields.");
        return;
    }

    // Validate phone number format
    const phonePattern = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
    if (!phonePattern.test(phoneNumber)) {
        alert("Invalid phone number format. Please use a valid format (e.g., 123-456-7890).");
        return;
    }

    // Check if the phone number has already been submitted
    if (submittedNumbers.has(phoneNumber)) {
        alert("This phone number has already been used in this session.");
        return;
    }

    // Add phone number to submitted numbers set
    submittedNumbers.add(phoneNumber);

    const formData = new URLSearchParams();
    formData.append('name', name);
    formData.append('phoneNumber', phoneNumber);
    formData.append('email', email);

    // Send form data to the server
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
                const qrToken = data.token;

                // Generate QR code
                new QRious({
                    element: document.getElementById('qr-code'),
                    value: qrToken,
                    size: 200
                });

                document.getElementById('qr-code-container').style.display = 'block';
                alert('Offer claimed! Please scan the QR code.');

                // Start checking QR status periodically
                qrStatusCheckInterval = setInterval(() => checkQrStatus(qrToken), 5000);
            } else {
                alert(data.message); // Display error message if offer claim fails
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
});

// Define the checkQrStatus function to check the status of the QR code
function checkQrStatus(qrToken) {
    console.log("Checking QR status for token:", qrToken);

    // Fetch the status of the QR code
    fetch(`https://script.google.com/macros/s/AKfycbwyrv_Tw3DD4laPqyZ9EoItqTptjEaEoQvhcRo4e5z4LhuuycZZSl1IGgf3DxrrbHqV/exec?qrToken=${qrToken}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'claimed') {
                clearInterval(qrStatusCheckInterval); // Stop checking once it's scanned
                console.log("QR code claimed!");
                hideOffer("Offer claimed successfully.");
            }
        })
        .catch(error => {
            console.error("Error checking QR status:", error);
        });
}

// Hide the offer page and show a message
function hideOffer(message = "The offer has expired.") {
    if (offerHidden) return; // Ensure offer is hidden only once
    offerHidden = true;

    const offerContainer = document.querySelector(".offer-container");
    const messageContainer = document.getElementById("message-container");
    const messageTitle = document.getElementById("message-title");
    const messageDescription = document.getElementById("message-description");

    if (offerContainer) {
        offerContainer.style.display = "none";
    }

    if (messageContainer) {
        messageTitle.textContent = message;
        messageDescription.textContent = message === "Offer claimed successfully."
            ? "Thank you for claiming the offer!"
            : "We're sorry, this offer is no longer available.";
        messageContainer.style.display = "block";
    }
}

// Timer functionality
async function fetchRemainingTime(timerUrl) {
    try {
        const response = await fetch(timerUrl);
        const data = await response.json();
        if (data.success) {
            const timeLeft = data.timeLeft; // Time left in milliseconds
            displayTimer(timeLeft);
        } else {
            hideOffer("The offer has expired.");
        }
    } catch (error) {
        console.error("Error fetching timer:", error);
    }
}

function displayTimer(milliseconds) {
    const timerElement = document.getElementById("timer");

    const interval = setInterval(() => {
        if (offerHidden) {
            clearInterval(interval); // Stop the timer if the offer is already hidden
            return;
        }

        if (milliseconds <= 0) {
            clearInterval(interval);
            timerElement.textContent = "Offer expired.";
            hideOffer("The offer has expired.");
            return;
        }

        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        timerElement.textContent = `${hours}h ${minutes}m ${seconds}s`;
        milliseconds -= 1000;
    }, 1000);
}

// Extract the timer URL from query parameters
const urlParams = new URLSearchParams(window.location.search);
const timerUrl = urlParams.get("timerUrl");

// Fetch the timer if the URL is present
if (timerUrl) {
    fetchRemainingTime(timerUrl);
}
