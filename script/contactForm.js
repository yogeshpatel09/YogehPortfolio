// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
    apiKey: "AIzaSyBLEolHBky2sZT9pxAGrpGsw1lskv8CwqQ",
    authDomain: "yogesh-patel-portfolio.firebaseapp.com",
    projectId: "yogesh-patel-portfolio",
    storageBucket: "yogesh-patel-portfolio.firebasestorage.app",
    messagingSenderId: "617264306014",
    appId: "1:617264306014:web:8a4769b1238150ad8b61cf",
    measurementId: "G-VB4VZHPEZC",
    databaseURL: "https://yogesh-patel-portfolio-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const contactFormDB = firebase.database().ref("contactForm");

// Check database connection with retry logic
function checkConnection() {
    const connectedRef = firebase.database().ref(".info/connected");
    connectedRef.on("value", (snap) => {
        if (snap.val() === true) {
            console.log("✅ Connected to Firebase Database");
            // Test write permission
            testWritePermission();
        } else {
            console.log("❌ Not connected to Firebase Database - Retrying...");
            setTimeout(checkConnection, 3000);
        }
    });
}

// Test if we can write to database
function testWritePermission() {
    const testRef = firebase.database().ref("test_connection");
    testRef.set({
        timestamp: Date.now(),
        message: "Connection test"
    }).then(() => {
        console.log("✅ Write permission granted");
        testRef.remove(); // Clean up
    }).catch((error) => {
        console.error("❌ Write permission denied:", error);
        console.log("Please check database rules in Firebase Console");
    });
}

// Start connection check
checkConnection();

// Get form element
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show loading state
        const submitBtn = document.getElementById('submit');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('emailId').value.trim();
        const message = document.getElementById('messageContent').value.trim();

        // Validation
        if (!name || !email || !message) {
            showError('Please fill all fields');
            resetButton(submitBtn, originalBtnText);
            return;
        }

        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            resetButton(submitBtn, originalBtnText);
            return;
        }

        try {
            // Save to Realtime Database
            const newMessageRef = contactFormDB.push();
            await newMessageRef.set({
                name: name,
                emailId: email,
                messageContent: message,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                status: "unread"
            });

            console.log("✅ Data saved to Realtime Database");

            // Try to send email via Firestore (if extension is installed)
            try {
                await db.collection("mail").add({
                    to: ['yogeshpatel7028@gmail.com'],
                    message: {
                        subject: `New Contact Form Message from ${name}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; padding: 20px;">
                                <h2>New Contact Form Submission</h2>
                                <p><strong>Name:</strong> ${name}</p>
                                <p><strong>Email:</strong> ${email}</p>
                                <p><strong>Message:</strong></p>
                                <p>${message.replace(/\n/g, '<br>')}</p>
                            </div>
                        `,
                        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
                    }
                });
                console.log("✅ Email trigger added to Firestore");
            } catch (emailError) {
                console.log("Email extension not installed, but data saved to database");
                console.log("Data saved with ID:", newMessageRef.key);
            }

            // Show success message
            showSuccess();
            
            // Reset form
            contactForm.reset();

        } catch (error) {
            console.error("❌ Error:", error);
            showError('Failed to save message. Please try again.');
        } finally {
            resetButton(submitBtn, originalBtnText);
        }
    });
} else {
    console.error("Form element not found! Make sure id='contactForm' exists");
}

// Helper Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showSuccess() {
    const successAlert = document.querySelector('.alert');
    if (successAlert) {
        successAlert.style.display = 'block';
        setTimeout(() => {
            successAlert.style.display = 'none';
        }, 5000);
    } else {
        alert("✅ Message sent successfully!");
    }
}

function showError(message) {
    const errorAlert = document.querySelector('.error-alert');
    if (errorAlert) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    } else {
        alert("❌ " + message);
    }
}

function resetButton(button, originalText) {
    if (button) {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Display saved messages (for admin view)
function displayAllMessages() {
    contactFormDB.once('value', (snapshot) => {
        const messages = snapshot.val();
        if (messages) {
            console.log("All saved messages:", messages);
            console.table(messages);
        } else {
            console.log("No messages found");
        }
    });
}

// Optional: Call this to see all messages in console
// displayAllMessages();