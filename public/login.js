/**
 * Author: Donavan Borges
 * CS 132 Spring 2024
 * Date: June 19, 2024
 * 
 * Client-side JavaScript for managing users authentication on the FitLog application.
 */

(function() {
    "use strict";

    const SERVER_BASE_URL = window.location.hostname === "localhost" ?
                        "http://localhost:3000" : "https://workout-website-f8ij.onrender.com";

    /**
     * Initializes the event listeners for login and registration forms.
     */
    function init() {
        document.querySelector("#loginForm").addEventListener("submit", loginUser);
        document.querySelector("#registerForm").addEventListener("submit", registerUser);
    }

    /**
     * Handles user login form submission.
     * @param {Event} event - The form submission event.
     */
    async function loginUser(event) {
        event.preventDefault();
        const username = document.querySelector("#loginName").value;
        const email = document.querySelector("#loginEmail").value;
    
        const resp = await fetch(`${SERVER_BASE_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        });
    
        if (resp.ok) {
            const data = await resp.json();
            displayMessage(data.message, true);
            document.querySelector("#loginName").value = '';
            document.querySelector("#loginEmail").value = '';
            localStorage.setItem('userID', data.userId);
            window.location.href = 'home.html';
        } else {
            const data = await resp.json();
            displayMessage(data.error, false);
        }
    }
    

    /**
     * Handles user registration form submission.
     * @param {Event} event - The form submission event.
     */
    async function registerUser(event) {
        event.preventDefault();
        const username = document.querySelector("#registerName").value;
        const email = document.querySelector("#registerEmail").value;
        const phone_number = document.querySelector("#registerPhone").value;
    
        const resp = await fetch(`${SERVER_BASE_URL}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: username, email, phone_number })
        });
    
        if (resp.ok) {
            const data = await resp.json();
            displayMessage("User registered successfully.", true);
            document.querySelector("#registerName").value = '';
            document.querySelector("#registerEmail").value = '';
            document.querySelector("#registerPhone").value = '';
        } else {
            const data = await resp.json();
            displayMessage(data.error, false);
        }
    }
    

    /**
     * Displays a message to the user in a designated message box.
     * @param {string} message - The message to display.
     * @param {boolean} isSuccess - Whether the message is a success message.
     */
    function displayMessage(msg, isSuccess) {
        const messageBox = document.querySelector("#message-box");
        messageBox.textContent = msg;
        messageBox.className = isSuccess ? "success" : "error";
        messageBox.classList.add("visible");
    }

    init();
})();